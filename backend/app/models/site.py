"""Site Content and Store Settings models."""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SiteContent(Base):
    """CMS dynamic content sections (hero carousel slides, banners, about section)."""

    __tablename__ = "site_content"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)  # 'hero_slides', 'auth_banners', etc.
    content: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class StoreSettings(Base):
    """Global e-commerce store settings (currency, tax rules, shipping fees)."""

    __tablename__ = "store_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)  # 'store_info', 'shipping_tiers', etc.
    value: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
