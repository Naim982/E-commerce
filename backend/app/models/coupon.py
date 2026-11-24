"""Promotional Coupon model."""

from datetime import datetime
from typing import Optional
from decimal import Decimal
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Coupon(Base):
    """Store discount coupon entity."""

    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    discount_type: Mapped[str] = mapped_column(
        String(32), default="percentage", nullable=False
    )  # 'percentage' or 'fixed'
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    min_purchase: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    max_discount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    
    usage_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
