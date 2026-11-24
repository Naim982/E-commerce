"""Product, Variant, Option, Review, and FAQ models."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlalchemy import (
    String, Integer, Numeric, Boolean, DateTime, ForeignKey, Text, CheckConstraint, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Product(Base):
    """
    Core Product entity supporting the dual-structure:
    - Relational columns for core business data (pricing, stock, category IDs, status).
    - PostgreSQL JSONB for flexible hardware specifications, media, descriptions, and assurances.
    """

    __tablename__ = "products"

    # Core Identifiers
    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g., 'prod-cpu-1'
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    # Categorization Foreign Keys
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    subcategory_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subcategories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Core Business & Pricing Data (relational)
    badge: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # 'Featured', 'Hot', etc.
    regular_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    discount_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_sold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Aggregated rating cache
    rating_average: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("0.00"), nullable=False)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Semi-Structured JSONB Columns for Flexible Content
    media: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=lambda: {"mainImage": "", "thumbnails": []}
    )
    specifications: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=lambda: {"cardSpecs": [], "quickOverview": [], "specs": []}
    )
    description: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=lambda: {"heading": "", "paragraphs": [], "boxContents": []}
    )
    assurance: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    # Variant modifiers map: { "var-id-option": { "price": +500, "stock": 10 } }
    variant_modifiers: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    # Extra payload for future promotions or flexible tags
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, default=dict
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    subcategory: Mapped[Optional["Subcategory"]] = relationship("Subcategory", back_populates="products")
    brand_associations: Mapped[List["ProductBrand"]] = relationship(
        "ProductBrand", back_populates="product", cascade="all, delete-orphan"
    )
    variants: Mapped[List["ProductVariant"]] = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan", order_by="ProductVariant.display_order"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="product", cascade="all, delete-orphan"
    )
    faqs: Mapped[List["ProductFAQ"]] = relationship(
        "ProductFAQ", back_populates="product", cascade="all, delete-orphan"
    )
    cart_items: Mapped[List["CartItem"]] = relationship(
        "CartItem", back_populates="product", cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[List["WishlistItem"]] = relationship(
        "WishlistItem", back_populates="product", cascade="all, delete-orphan"
    )

    def to_fixed_variable_dict(self) -> Dict[str, Any]:
        """
        Serializes product entity to the agreed LUMEN 'fixed' and 'variable' JSON structure.
        Ensures 100% contract compatibility with existing frontend components.
        """
        # Assemble brand names
        brand_names = [assoc.brand.name for assoc in self.brand_associations if assoc.brand]

        # Assemble variants list
        variants_list = []
        for v in self.variants:
            variants_list.append({
                "id": v.id,
                "name": v.name,
                "options": [
                    {
                        "id": opt.id,
                        "name": opt.name,
                        "isDefault": opt.is_default,
                        "priceModifier": float(opt.price_modifier),
                        "stockQuantity": opt.stock_quantity
                    }
                    for opt in v.options
                ]
            })

        # Calculate discounted price
        discount_pct = float(self.discount_percent or 0)
        reg_price = float(self.regular_price or 0)
        disc_price = round(reg_price * (1 - discount_pct / 100), 2) if discount_pct > 0 else reg_price

        return {
            "fixed": {
                "id": self.id,
                "sku": self.sku,
                "slug": self.slug,
                "name": self.name,
                "brand": brand_names,
                "category": self.category.name if self.category else "",
                "subCategory": self.subcategory.name if self.subcategory else "",
                "media": self.media or {"mainImage": "", "thumbnails": []},
                "specifications": self.specifications or {"cardSpecs": [], "quickOverview": [], "specs": []},
                "description": self.description or {"heading": "", "paragraphs": [], "boxContents": []},
                "assurance": self.assurance or [],
                "variants": variants_list
            },
            "variable": {
                "badge": self.badge,
                "regularPrice": reg_price,
                "discountPercent": discount_pct,
                "discountedPrice": disc_price,
                "stockQuantity": self.stock_quantity,
                "totalSold": self.total_sold,
                "variantStockAndPriceModifiers": self.variant_modifiers or {},
                "rating": {
                    "average": float(self.rating_average or 0),
                    "count": self.rating_count or 0
                },
                "isActive": self.is_active,
                "promotions": (self.extra_data or {}).get("promotions", []),
                "faqs": [
                    {
                        "id": f.id,
                        "question": f.question,
                        "answer": f.answer,
                        "askedBy": f.asked_by,
                        "answeredBy": f.answered_by,
                        "createdAt": f.created_at.isoformat() if f.created_at else None
                    }
                    for f in self.faqs if f.is_published
                ],
                "reviews": [
                    {
                        "id": r.id,
                        "userId": r.user_id,
                        "userName": r.user_name,
                        "rating": r.rating,
                        "title": r.title,
                        "comment": r.comment,
                        "createdAt": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in self.reviews if r.status == "approved"
                ]
            }
        }


class ProductVariant(Base):
    """Configurable variant group for a product (e.g. 'Color', 'Internal Memory')."""

    __tablename__ = "product_variants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g., 'var-color', 'var-memory'
    product_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    options: Mapped[List["VariantOption"]] = relationship(
        "VariantOption", back_populates="variant", cascade="all, delete-orphan", order_by="VariantOption.display_order"
    )


class VariantOption(Base):
    """Specific option value within a variant group (e.g. '16GB', 'Midnight Blue')."""

    __tablename__ = "variant_options"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    variant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    price_modifier: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="options")


class Review(Base):
    """Customer product review and rating entity."""

    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_review_rating"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(128), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_name: Mapped[str] = mapped_column(String(128), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="approved", nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="reviews")
    user: Mapped["User"] = relationship("User", back_populates="reviews")


class ProductFAQ(Base):
    """Product Frequently Asked Questions and community Q&A."""

    __tablename__ = "product_faqs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(128), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    asked_by: Mapped[str] = mapped_column(String(128), nullable=False)
    answered_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="faqs")
