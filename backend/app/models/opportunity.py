from sqlalchemy import String, Text, Integer, ForeignKey, Enum as SQLEnum, Numeric, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin
from typing import Optional, List
from datetime import datetime
import enum


class OpportunityStage(str, enum.Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class Opportunity(Base, TimestampMixin):
    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    stage: Mapped[OpportunityStage] = mapped_column(SQLEnum(OpportunityStage), default=OpportunityStage.PROSPECTING, nullable=False)
    amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    probability: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expected_close_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_close_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_step: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    account: Mapped["Account"] = relationship("Account", back_populates="opportunities")

    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    contact: Mapped["Contact"] = relationship("Contact", back_populates="opportunities")

    __table_args__ = (
        Index("ix_opportunities_stage", "stage"),
        Index("ix_opportunities_account", "account_id"),
        Index("ix_opportunities_contact", "contact_id"),
        Index("ix_opportunities_expected_close", "expected_close_date"),
    )