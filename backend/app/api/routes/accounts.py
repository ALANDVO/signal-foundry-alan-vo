from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.models.account import Account, AccountType
from app.models.contact import Contact
from app.models.audit_log import AuditLog, AuditAction
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime


router = APIRouter(prefix="/accounts", tags=["accounts"])


class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: AccountType = AccountType.PROSPECT
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    annual_revenue: Optional[int] = Field(None, ge=0)
    employee_count: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    primary_contact_id: Optional[int] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    type: Optional[AccountType] = None
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[HttpUrl] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    annual_revenue: Optional[int] = Field(None, ge=0)
    employee_count: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    primary_contact_id: Optional[int] = None


class AccountResponse(AccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountListResponse(BaseModel):
    items: List[AccountResponse]
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


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(account: AccountCreate, db: AsyncSession = Depends(get_db)) -> Account:
    if account.primary_contact_id:
        contact_result = await db.execute(select(Contact).where(Contact.id == account.primary_contact_id))
        if not contact_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Primary contact not found")

    db_account = Account(**account.model_dump())
    db.add(db_account)
    await db.flush()
    log_audit(db, "account", db_account.id, AuditAction.CREATE, changes=account.model_dump_json())
    await db.commit()
    await db.refresh(db_account)
    return db_account


@router.get("", response_model=AccountListResponse)
async def list_accounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    type: Optional[AccountType] = Query(None),
    industry: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> AccountListResponse:
    query = select(Account)
    count_query = select(func.count(Account.id))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Account.name.ilike(search_term),
                Account.industry.ilike(search_term),
            )
        )
        count_query = count_query.where(
            or_(
                Account.name.ilike(search_term),
                Account.industry.ilike(search_term),
            )
        )

    if type:
        query = query.where(Account.type == type)
        count_query = count_query.where(Account.type == type)

    if industry:
        query = query.where(Account.industry.ilike(f"%{industry}%"))
        count_query = count_query.where(Account.industry.ilike(f"%{industry}%"))

    total = (await db.execute(count_query)).scalar_one()
    total_pages = (total + page_size - 1) // page_size

    query = query.order_by(Account.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    accounts = result.scalars().all()

    return AccountListResponse(
        items=accounts,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: int, db: AsyncSession = Depends(get_db)) -> Account:
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(account_id: int, account_update: AccountUpdate, db: AsyncSession = Depends(get_db)) -> Account:
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = account_update.model_dump(exclude_unset=True)
    if "primary_contact_id" in update_data and update_data["primary_contact_id"]:
        contact_result = await db.execute(select(Contact).where(Contact.id == update_data["primary_contact_id"]))
        if not contact_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Primary contact not found")

    for field, value in update_data.items():
        setattr(account, field, value)

    log_audit(db, "account", account_id, AuditAction.UPDATE, changes=account_update.model_dump_json())
    await db.commit()
    await db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(account_id: int, db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    log_audit(db, "account", account_id, AuditAction.DELETE)
    await db.delete(account)
    await db.commit()