from sqlalchemy import String, Text, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin
from typing import Optional, List


class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    accounts: Mapped[List["Account"]] = relationship("Account", back_populates="primary_contact")
    opportunities: Mapped[List["Opportunity"]] = relationship("Opportunity", back_populates="contact")

    __table_args__ = (
        Index("ix_contacts_name", "last_name", "first_name"),
        Index("ix_contacts_company", "company"),
    )

    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"