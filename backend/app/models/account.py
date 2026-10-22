from sqlalchemy import String, Text, Integer, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin
from typing import Optional, List
import enum


class AccountType(str, enum.Enum):
    CUSTOMER = "customer"
    PROSPECT = "prospect"
    PARTNER = "partner"
    VENDOR = "vendor"


class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    type: Mapped[AccountType] = mapped_column(SQLEnum(AccountType), default=AccountType.PROSPECT, nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    annual_revenue: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    employee_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    primary_contact_id: Mapped[Optional[int]] = mapped_column(ForeignKey("contacts.id"), nullable=True)
    primary_contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="accounts")

    opportunities: Mapped[List["Opportunity"]] = relationship("Opportunity", back_populates="account")

    __table_args__ = (
        Index("ix_accounts_type", "type"),
        Index("ix_accounts_industry", "industry"),
    )