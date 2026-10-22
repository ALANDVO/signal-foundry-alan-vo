from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.contact import Contact
from app.models.audit_log import AuditLog, AuditAction
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


router = APIRouter(prefix="/contacts", tags=["contacts"])


class ContactBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=200)
    title: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=200)
    title: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    notes: Optional[str] = None


class ContactResponse(ContactBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactListResponse(BaseModel):
    items: List[ContactResponse]
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


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactCreate, db: AsyncSession = Depends(get_db)) -> Contact:
    existing = await db.execute(select(Contact).where(Contact.email == contact.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    db_contact = Contact(**contact.model_dump())
    db.add(db_contact)
    await db.flush()
    log_audit(db, "contact", db_contact.id, AuditAction.CREATE, changes=contact.model_dump_json())
    await db.commit()
    await db.refresh(db_contact)
    return db_contact


@router.get("", response_model=ContactListResponse)
async def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> ContactListResponse:
    query = select(Contact)
    count_query = select(func.count(Contact.id))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Contact.first_name.ilike(search_term),
                Contact.last_name.ilike(search_term),
                Contact.email.ilike(search_term),
            )
        )
        count_query = count_query.where(
            or_(
                Contact.first_name.ilike(search_term),
                Contact.last_name.ilike(search_term),
                Contact.email.ilike(search_term),
            )
        )

    if company:
        query = query.where(Contact.company.ilike(f"%{company}%"))
        count_query = count_query.where(Contact.company.ilike(f"%{company}%"))

    total = (await db.execute(count_query)).scalar_one()
    total_pages = (total + page_size - 1) // page_size

    query = query.order_by(Contact.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    contacts = result.scalars().all()

    return ContactListResponse(
        items=contacts,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(contact_id: int, db: AsyncSession = Depends(get_db)) -> Contact:
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: int, contact_update: ContactUpdate, db: AsyncSession = Depends(get_db)) -> Contact:
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    update_data = contact_update.model_dump(exclude_unset=True)
    if "email" in update_data:
        existing = await db.execute(select(Contact).where(Contact.email == update_data["email"], Contact.id != contact_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")

    for field, value in update_data.items():
        setattr(contact, field, value)

    log_audit(db, "contact", contact_id, AuditAction.UPDATE, changes=contact_update.model_dump_json())
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(contact_id: int, db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    log_audit(db, "contact", contact_id, AuditAction.DELETE)
    await db.delete(contact)
    await db.commit()