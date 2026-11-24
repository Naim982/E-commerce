"""Brand and ProductBrand association models."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Brand(Base):
    """Manufacturer / brand entity model."""

    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    logo: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    product_associations: Mapped[List["ProductBrand"]] = relationship(
        "ProductBrand", back_populates="brand", cascade="all, delete-orphan"
    )


class ProductBrand(Base):
    """Many-to-Many association table between Products and Brands."""

    __tablename__ = "product_brands"

    product_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )
    brand_id: Mapped[int] = mapped_column(
        ForeignKey("brands.id", ondelete="CASCADE"), primary_key=True
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="brand_associations")
    brand: Mapped["Brand"] = relationship("Brand", back_populates="product_associations")
