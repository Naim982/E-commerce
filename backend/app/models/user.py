"""User, Address, and Notification models."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    String, Boolean, DateTime, ForeignKey, CheckConstraint, func, Text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    """User account model supporting customer ('user') and administrator ('admin') roles."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="check_user_role"),
    )

    # Primary key: VARCHAR string supporting Firebase UIDs or generated IDs
    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    
    first_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Flexible profile attributes (notification preferences, custom settings)
    profile_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    addresses: Mapped[List["Address"]] = relationship(
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    cart_items: Mapped[List["CartItem"]] = relationship(
        "CartItem", back_populates="user", cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[List["WishlistItem"]] = relationship(
        "WishlistItem", back_populates="user", cascade="all, delete-orphan"
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order", back_populates="user"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="user"
    )
    support_tickets: Mapped[List["SupportTicket"]] = relationship(
        "SupportTicket", back_populates="user"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        """Serializes user record matching frontend customer profile contract."""
        fn = self.first_name or ""
        ln = self.last_name or ""
        initials = ""
        if fn:
            initials += fn[0].upper()
        if ln:
            initials += ln[0].upper()
        if not initials and self.name:
            parts = self.name.split()
            initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) > 1 else parts[0][:2].upper()
        if not initials:
            initials = (self.email[:2] if self.email else "CU").upper()

        # Format live cart items
        cart_list = []
        if self.cart_items:
            for ci in self.cart_items:
                cart_list.append({
                    "id": ci.product_id,
                    "quantity": ci.quantity,
                    "variant": ci.selected_variant or []
                })

        # Format live wishlist product IDs
        wishlist_ids = [item.product_id for item in self.wishlist_items] if self.wishlist_items else []

        # Format live orders summary
        orders_summary = []
        if self.orders:
            for o in sorted(self.orders, key=lambda x: x.created_at or datetime.min, reverse=True):
                items_data = []
                for itm in (o.items or []):
                    p_snap = itm.product_snapshot or {}
                    items_data.append({
                        "productId": itm.product_id or p_snap.get("id"),
                        "quantity": itm.quantity,
                        "variants": itm.selected_variant or [],
                        "unitPrice": float(itm.unit_price),
                        "totalPrice": float(itm.total_price),
                        "name": p_snap.get("name") or p_snap.get("title", ""),
                        "mainImage": p_snap.get("mainImage") or p_snap.get("image", "")
                    })

                pay_method = o.payment_method
                pay_status = o.payment_status
                pay_txn = f"TXN-{o.order_number[-8:]}" if len(o.order_number) >= 8 else "TXN-00000000"
                pay_card = {}
                if o.payments:
                    last_pay = o.payments[-1]
                    pay_method = last_pay.payment_method
                    pay_status = last_pay.status
                    pay_txn = last_pay.transaction_id or pay_txn
                    if last_pay.payment_details and "card" in last_pay.payment_details:
                        pay_card = last_pay.payment_details["card"]

                orders_summary.append({
                    "orderId": o.id,
                    "orderNumber": o.order_number,
                    "items": items_data,
                    "address": o.shipping_address or {},
                    "delivery": o.delivery or {"name": "Standard Delivery", "price": float(o.shipping_fee), "trackingNumber": ""},
                    "cost": {
                        "subtotal": float(o.subtotal),
                        "discount": float(o.discount_amount),
                        "tax": float(o.tax_amount),
                        "shipping": float(o.shipping_fee),
                        "grandTotal": float(o.total_amount)
                    },
                    "payment": {
                        "method": pay_method,
                        "status": pay_status,
                        "transaction": pay_txn,
                        **({"card": pay_card} if pay_card else {})
                    },
                    "orderStatus": o.status,
                    "orderDate": o.created_at.isoformat() if o.created_at else "",
                    "adminNotes": o.admin_notes or "",
                    "customerNotes": o.customer_notes or "",
                    "updatedAt": o.updated_at.isoformat() if o.updated_at else ""
                })

        return {
            "id": self.id,
            "role": self.role,
            "accountStatus": "active" if self.is_active else "inactive",
            "profile": {
                "firstName": fn,
                "lastName": ln,
                "email": self.email,
                "phone": self.phone or "",
                "avatarInitials": initials,
                "avatarUrl": self.avatar or "",
                "joinedDate": self.created_at.strftime("%B %Y") if self.created_at else ""
            },
            "security": {
                "twoFactorEnabled": False,
                "lastPasswordChange": "",
                "activeSessions": []
            },
            "preferences": {
                "currency": "BDT",
                "marketingEmails": False,
                "orderUpdatesSms": False,
                "theme": "light"
            },
            "addresses": [addr.to_dict() for addr in self.addresses] if self.addresses else [],
            "paymentMethods": [],
            "wishlist": wishlist_ids,
            "cartList": cart_list,
            "ordersSummary": orders_summary,
            "recentOrdersSummary": orders_summary[:5],
            "reviewsSummary": [],
            "notifications": [n.to_dict() for n in self.notifications] if self.notifications else []
        }


class Address(Base):
    """Customer shipping and billing address model."""

    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(64), default="Home", nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="Bangladesh", nullable=False)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="addresses")

    def to_dict(self) -> dict:
        """Serializes address record with dual snake_case and camelCase compatibility."""
        return {
            "id": str(self.id),
            "title": self.title,
            "label": self.title,
            "name": self.name or "",
            "recipientName": self.name or "",
            "phone": self.phone or "",
            "addressLine1": self.address_line1,
            "street": self.address_line1,
            "addressLine2": self.address_line2 or "",
            "apartment": self.address_line2 or "",
            "suite": self.address_line2 or "",
            "city": self.city,
            "villageArea": self.city,
            "state": self.state or "",
            "thana": self.state or "",
            "district": self.district or self.city or "Dhaka",
            "postalCode": self.postal_code or "",
            "zipCode": self.postal_code or "",
            "country": self.country or "Bangladesh",
            "instructions": self.instructions or "",
            "isDefault": self.is_default
        }


class Notification(Base):
    """Customer system notification model."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(64), default="order_update", nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

    def to_dict(self) -> dict:
        """Serializes notification record to dictionary."""
        return {
            "id": str(self.id),
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "link": self.link,
            "isRead": self.is_read,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
