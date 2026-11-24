"""
Administrative Order Management and Promotional Coupon API Endpoints.
Guarded by require_admin dependency.
Supports order lifecycle management, fulfillment updates, tracking numbers, and promotional coupon CRUD.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc, func, cast, String
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.order import Order, OrderItem, Payment
from app.models.product import Product
from app.models.coupon import Coupon
from app.schemas.order import (
    AdminOrderStatusUpdate,
    CouponCreateAdmin,
    CouponUpdateAdmin
)
from app.api.routes.orders import format_order

router = APIRouter(tags=["Admin Orders & Coupons"])


def format_admin_order(order: Order) -> Dict[str, Any]:
    """Formats an order including customer contact details for administrative views."""
    base = format_order(order)
    user = order.user
    cust_name = "Customer"
    cust_email = ""
    cust_phone = ""

    if user:
        cust_name = user.name or f"{user.first_name or ''} {user.last_name or ''}".strip() or "Customer"
        cust_email = user.email or ""
        cust_phone = user.phone or ""

    base["customerName"] = cust_name
    base["customerEmail"] = cust_email
    base["customerPhone"] = cust_phone
    return base


def format_coupon(c: Coupon) -> Dict[str, Any]:
    """Serializes a Coupon model matching frontend AdminEnd/Coupons/Coupons.js contract."""
    return {
        "id": f"cpn-{c.id}",
        "couponId": c.id,
        "code": c.code,
        "discountType": c.discount_type,
        "discountValue": float(c.discount_value),
        "description": c.description or "",
        "minSpend": float(c.min_purchase or Decimal("0.00")),
        "maxUses": c.usage_limit or 500,
        "usedCount": c.usage_count or 0,
        "startDate": c.starts_at.strftime("%Y-%m-%d") if c.starts_at else "2026-01-01",
        "expiryDate": c.expires_at.strftime("%Y-%m-%d") if c.expires_at else "2026-12-31",
        "active": c.is_active,
        "createdAt": c.created_at.isoformat() if c.created_at else datetime.now(timezone.utc).isoformat()
    }


# ==============================================================================
# 1. ADMIN ORDERS MANAGEMENT
# ==============================================================================

@router.get("/admin/orders", summary="List orders for administrative fulfillment dashboard")
def list_admin_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves paginated orders with customer details, order items, and status filtering."""
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items),
        joinedload(Order.payments)
    )

    # Filter by status
    if status and status.lower() not in ("all", ""):
        query = query.filter(func.lower(Order.status) == status.strip().lower())

    # Filter by search token (order ID, order number, customer name, email)
    if search and search.strip():
        token = f"%{search.strip().lower()}%"
        query = query.join(Order.user).filter(
            or_(
                func.lower(Order.id).ilike(token),
                func.lower(Order.order_number).ilike(token),
                func.lower(User.name).ilike(token),
                func.lower(User.email).ilike(token)
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    orders = query.order_by(desc(Order.created_at)).offset(offset).limit(limit).all()

    formatted_orders = [format_admin_order(o) for o in orders]
    total_pages = max(1, (total + limit - 1) // limit)

    return {
        "success": True,
        "orders": formatted_orders,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages
    }


@router.get("/admin/orders/{order_id}", summary="Get order details for admin modal or page")
def get_admin_order(
    order_id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves single order with complete customer, fulfillment, and payment metadata."""
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items),
        joinedload(Order.payments)
    ).filter(
        or_(Order.id == order_id, Order.order_number == order_id)
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found."
        )

    return {
        "success": True,
        "order": format_admin_order(order)
    }


@router.patch("/admin/orders/{order_id}", summary="Update order fulfillment and status")
@router.patch("/admin/orders/{order_id}/status", summary="Update order status shortcut")
def update_admin_order(
    order_id: str,
    payload: AdminOrderStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates order status, payment status, tracking number, and admin fulfillment notes."""
    order = db.query(Order).filter(
        or_(Order.id == order_id, Order.order_number == order_id)
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found."
        )

    # 1. Update Order Status
    new_status = payload.orderStatus or payload.status
    if new_status:
        valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
        new_status_clean = new_status.strip().lower()
        if new_status_clean not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid order status '{new_status}'. Allowed values: {valid_statuses}."
            )

        # If admin is cancelling the order, restore inventory
        if new_status_clean == "cancelled" and order.status != "cancelled":
            for itm in order.items:
                if itm.product_id:
                    p = db.query(Product).filter(Product.id == itm.product_id).first()
                    if p:
                        p.stock_quantity += itm.quantity
                        p.total_sold = max(0, (p.total_sold or 0) - itm.quantity)

        order.status = new_status_clean
        timeline = list(order.tracking_timeline or [])
        timeline.append({
            "status": new_status_clean,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": f"Status updated to '{new_status_clean}' by Administrator."
        })
        order.tracking_timeline = timeline

    # 2. Update Payment Status
    if payload.paymentStatus:
        order.payment_status = payload.paymentStatus.strip().lower()
        if order.payments:
            order.payments[-1].status = order.payment_status

    # 3. Update Delivery / Tracking Number
    if payload.trackingNumber is not None:
        delivery_dict = dict(order.delivery or {})
        delivery_dict["trackingNumber"] = payload.trackingNumber.strip()
        order.delivery = delivery_dict

    # 4. Admin Notes
    if payload.adminNotes is not None:
        order.admin_notes = payload.adminNotes

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": f"Order #{order.order_number} updated successfully.",
        "order": format_admin_order(order)
    }


# ==============================================================================
# 2. ADMIN PROMOTIONAL COUPONS MANAGEMENT
# ==============================================================================

@router.get("/admin/coupons", summary="List promotional coupons")
def list_admin_coupons(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves all promotional coupons."""
    coupons = db.query(Coupon).order_by(desc(Coupon.created_at)).all()
    return {
        "success": True,
        "coupons": [format_coupon(c) for c in coupons]
    }


@router.post("/admin/coupons", summary="Create new promotional coupon")
def create_admin_coupon(
    payload: CouponCreateAdmin,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Creates a new promotional discount coupon."""
    code_clean = payload.code.strip().upper()
    if not code_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon code cannot be empty.")

    existing = db.query(Coupon).filter(func.upper(Coupon.code) == code_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{code_clean}' already exists."
        )

    starts_at = None
    if payload.startDate:
        try:
            starts_at = datetime.fromisoformat(payload.startDate.replace("Z", "+00:00"))
        except Exception:
            pass

    expires_at = None
    if payload.expiryDate:
        try:
            expires_at = datetime.fromisoformat(payload.expiryDate.replace("Z", "+00:00"))
        except Exception:
            pass

    coupon = Coupon(
        code=code_clean,
        discount_type=payload.discountType.lower().strip(),
        discount_value=Decimal(str(payload.discountValue)),
        description=payload.description or "",
        min_purchase=Decimal(str(payload.minSpend or 0.0)),
        usage_limit=payload.maxUses,
        usage_count=0,
        is_active=bool(payload.active),
        starts_at=starts_at,
        expires_at=expires_at
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    return {
        "success": True,
        "message": f"Coupon '{code_clean}' created successfully.",
        "coupon": format_coupon(coupon)
    }


@router.put("/admin/coupons/{id_or_code}", summary="Update promotional coupon")
def update_admin_coupon(
    id_or_code: str,
    payload: CouponUpdateAdmin,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates an existing promotional coupon by numeric ID, 'cpn-N' identifier, or code."""
    clean_target = id_or_code.strip()
    target_num = None
    if clean_target.startswith("cpn-"):
        try:
            target_num = int(clean_target[4:])
        except Exception:
            pass
    elif clean_target.isdigit():
        target_num = int(clean_target)

    coupon = db.query(Coupon).filter(
        or_(
            (Coupon.id == target_num) if target_num is not None else False,
            func.upper(Coupon.code) == clean_target.upper()
        )
    ).first()

    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coupon '{id_or_code}' not found."
        )

    if payload.code is not None and payload.code.strip():
        new_code = payload.code.strip().upper()
        conflict = db.query(Coupon).filter(
            func.upper(Coupon.code) == new_code,
            Coupon.id != coupon.id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{new_code}' is already used by another coupon."
            )
        coupon.code = new_code

    if payload.discountType is not None:
        coupon.discount_type = payload.discountType.lower().strip()
    if payload.discountValue is not None:
        coupon.discount_value = Decimal(str(payload.discountValue))
    if payload.description is not None:
        coupon.description = payload.description
    if payload.minSpend is not None:
        coupon.min_purchase = Decimal(str(payload.minSpend))
    if payload.maxUses is not None:
        coupon.usage_limit = payload.maxUses
    if payload.active is not None:
        coupon.is_active = bool(payload.active)

    if payload.startDate:
        try:
            coupon.starts_at = datetime.fromisoformat(payload.startDate.replace("Z", "+00:00"))
        except Exception:
            pass

    if payload.expiryDate:
        try:
            coupon.expires_at = datetime.fromisoformat(payload.expiryDate.replace("Z", "+00:00"))
        except Exception:
            pass

    db.commit()
    db.refresh(coupon)

    return {
        "success": True,
        "message": f"Coupon '{coupon.code}' updated successfully.",
        "coupon": format_coupon(coupon)
    }


@router.delete("/admin/coupons/{id_or_code}", summary="Delete promotional coupon")
def delete_admin_coupon(
    id_or_code: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deletes a promotional coupon."""
    clean_target = id_or_code.strip()
    target_num = None
    if clean_target.startswith("cpn-"):
        try:
            target_num = int(clean_target[4:])
        except Exception:
            pass
    elif clean_target.isdigit():
        target_num = int(clean_target)

    coupon = db.query(Coupon).filter(
        or_(
            (Coupon.id == target_num) if target_num is not None else False,
            func.upper(Coupon.code) == clean_target.upper()
        )
    ).first()

    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coupon '{id_or_code}' not found."
        )

    db.delete(coupon)
    db.commit()

    return {
        "success": True,
        "message": f"Coupon '{coupon.code}' deleted successfully."
    }
