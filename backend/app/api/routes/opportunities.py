from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.models.opportunity import Opportunity, OpportunityStage
from app.models.account import Account
from app.models.contact import Contact
from app.models.audit_log import AuditLog, AuditAction
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


router = APIRouter(prefix="/opportunities", tags=["opportunities"])


class OpportunityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    amount: Optional[float] = Field(None, ge=0)
    probability: int = Field(0, ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None
    description: Optional[str] = None
    next_step: Optional[str] = Field(None, max_length=500)
    account_id: int
    contact_id: int


class OpportunityCreate(OpportunityBase):
    pass


class OpportunityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    stage: Optional[OpportunityStage] = None
    amount: Optional[float] = Field(None, ge=0)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None
    description: Optional[str] = None
    next_step: Optional[str] = Field(None, max_length=500)
    account_id: Optional[int] = None
    contact_id: Optional[int] = None


class OpportunityResponse(OpportunityBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OpportunityListResponse(BaseModel):
    items: List[OpportunityResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


def log_audit(db: AsyncSession, entity_type: str, entity_id: int, action: AuditAction, user_email: Optional[str] = None, changes: Optional[str] = None):
    log = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user_email=user_email,
        changes=changes
    )
    db.add(log)


@router.post("", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(opportunity: OpportunityCreate, db: AsyncSession = Depends(get_db)) -> Opportunity:
    account_result = await db.execute(select(Account).where(Account.id == opportunity.account_id))
    if not account_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Account not found")

    contact_result = await db.execute(select(Contact).where(Contact.id == opportunity.contact_id))
    if not contact_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Contact not found")

    db_opportunity = Opportunity(**opportunity.model_dump())
    db.add(db_opportunity)
    await db.flush()
    log_audit(db, "opportunity", db_opportunity.id, AuditAction.CREATE, changes=opportunity.model_dump_json())
    await db.commit()
    await db.refresh(db_opportunity)
    return db_opportunity


@router.get("", response_model=OpportunityListResponse)
async def list_opportunities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    stage: Optional[OpportunityStage] = Query(None),
    account_id: Optional[int] = Query(None),
    contact_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> OpportunityListResponse:
    query = select(Opportunity)
    count_query = select(func.count(Opportunity.id))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Opportunity.name.ilike(search_term),
                Opportunity.description.ilike(search_term),
            )
        )
        count_query = count_query.where(
            or_(
                Opportunity.name.ilike(search_term),
                Opportunity.description.ilike(search_term),
            )
        )

    if stage:
        query = query.where(Opportunity.stage == stage)
        count_query = count_query.where(Opportunity.stage == stage)

    if account_id:
        query = query.where(Opportunity.account_id == account_id)
        count_query = count_query.where(Opportunity.account_id == account_id)

    if contact_id:
        query = query.where(Opportunity.contact_id == contact_id)
        count_query = count_query.where(Opportunity.contact_id == contact_id)

    total = (await db.execute(count_query)).scalar_one()
    total_pages = (total + page_size - 1) // page_size

    query = query.order_by(Opportunity.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    opportunities = result.scalars().all()

    return OpportunityListResponse(
        items=opportunities,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(opportunity_id: int, db: AsyncSession = Depends(get_db)) -> Opportunity:
    result = await db.execute(select(Opportunity).where(Opportunity.id == opportunity_id))
    opportunity = result.scalar_one_or_none()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity


@router.patch("/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(opportunity_id: int, opportunity_update: OpportunityUpdate, db: AsyncSession = Depends(get_db)) -> Opportunity:
    result = await db.execute(select(Opportunity).where(Opportunity.id == opportunity_id))
    opportunity = result.scalar_one_or_none()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    update_data = opportunity_update.model_dump(exclude_unset=True)
    if "account_id" in update_data:
        account_result = await db.execute(select(Account).where(Account.id == update_data["account_id"]))
        if not account_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Account not found")

    if "contact_id" in update_data:
        contact_result = await db.execute(select(Contact).where(Contact.id == update_data["contact_id"]))
        if not contact_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Contact not found")

    for field, value in update_data.items():
        setattr(opportunity, field, value)

    log_audit(db, "opportunity", opportunity_id, AuditAction.UPDATE, changes=opportunity_update.model_dump_json())
    await db.commit()
    await db.refresh(opportunity)
    return opportunity


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(opportunity_id: int, db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(Opportunity).where(Opportunity.id == opportunity_id))
    opportunity = result.scalar_one_or_none()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    log_audit(db, "opportunity", opportunity_id, AuditAction.DELETE)
    await db.delete(opportunity)
    await db.commit()