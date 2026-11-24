"""Order, OrderItem, and Payment models."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlalchemy import (
    String, Integer, Numeric, DateTime, ForeignKey, Text, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Order(Base):
    """Customer purchase order record."""

    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g., 'ord-1700000000'
    order_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    
    # Lifecycle and payment statuses
    status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False, index=True
    )  # 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    payment_status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False, index=True
    )  # 'pending', 'paid', 'failed', 'refunded'
    payment_method: Mapped[str] = mapped_column(
        String(32), default="cod", nullable=False
    )  # 'cod', 'card', 'bkash', 'nagad'

    # Financial Breakdown (BDT Currency)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    shipping_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    coupon_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Shipping, Delivery and Billing Details Snapshot
    shipping_address: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    delivery: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True, default=dict)
    billing_address: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Order Event Timeline: [{ "status": "pending", "timestamp": "...", "note": "Order placed" }]
    tracking_timeline: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    
    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """Line item in an order with immutable product snapshot."""

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    # Immutable snapshot preserving product name, SKU, price, and thumbnail at purchase time
    product_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    selected_variant: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product")


class Payment(Base):
    """Financial transaction and gateway payment record."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    transaction_id: Mapped[Optional[str]] = mapped_column(
        String(128), unique=True, index=True, nullable=True
    )
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="BDT", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)  # pending, completed, failed, refunded
    payment_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="payments")
    user: Mapped["User"] = relationship("User")
