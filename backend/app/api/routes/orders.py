"""
Customer Orders, Checkout, and Coupon Validation API Endpoints.
Guarantees inventory consistency through PostgreSQL transactions and row-level locking (with_for_update).
Implements demo payment records, immutable snapshot preservation, and stock restoration on cancellation.
"""

from typing import Dict, Any, Optional, List
import random
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from app.core.database import get_db
from app.core.security import get_current_user, verify_user_access
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.models.coupon import Coupon
from app.models.order import Order, OrderItem, Payment
from app.schemas.order import (
    OrderCreate,
    OrderCancelPayload,
    CouponValidateRequest
)
from app.services.pricing_service import (
    calculate_order_pricing,
    validate_coupon,
    round_money
)

router = APIRouter(tags=["Orders & Checkout"])


def generate_order_number() -> str:
    """Generates an order tracking identifier like 'ORD-20261122-8492'."""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    rnd = random.randint(1000, 9999)
    return f"ORD-{date_str}-{rnd}"


def generate_transaction_id() -> str:
    """Generates a demo payment transaction ID like 'TXN-73829104'."""
    rnd = random.randint(10000000, 99999999)
    return f"TXN-{rnd}"


def format_order(order: Order) -> Dict[str, Any]:
    """
    Serializes an Order model into the dictionary shape expected by
    MyOrders.js, OrderDetails.js, and OrderConfirmation.js.
    """
    items_list = []
    for item in (order.items or []):
        p_snap = item.product_snapshot or {}
        items_list.append({
            "productId": item.product_id or p_snap.get("id"),
            "name": p_snap.get("name") or p_snap.get("title", ""),
            "sku": p_snap.get("sku", ""),
            "mainImage": p_snap.get("mainImage") or p_snap.get("image", ""),
            "quantity": item.quantity,
            "variants": item.selected_variant or [],
            "unitPrice": float(item.unit_price),
            "totalPrice": float(item.total_price)
        })

    # Payment details
    pay_method = order.payment_method
    pay_status = order.payment_status
    pay_txn = f"TXN-{order.order_number[-8:]}" if len(order.order_number) >= 8 else "TXN-00000000"
    pay_card = {}

    if order.payments:
        last_pay = order.payments[-1]
        pay_method = last_pay.payment_method
        pay_status = last_pay.status
        pay_txn = last_pay.transaction_id or pay_txn
        if last_pay.payment_details and isinstance(last_pay.payment_details, dict):
            if "card" in last_pay.payment_details:
                pay_card = last_pay.payment_details["card"]
            elif "last4" in last_pay.payment_details:
                pay_card = {"last4": last_pay.payment_details["last4"]}

    # Delivery snapshot
    delivery_data = order.delivery or {
        "name": "Standard Delivery",
        "price": float(order.shipping_fee),
        "trackingNumber": ""
    }

    return {
        "orderId": order.id,
        "orderNumber": order.order_number,
        "userId": order.user_id,
        "items": items_list,
        "address": order.shipping_address or {},
        "delivery": delivery_data,
        "cost": {
            "subtotal": float(order.subtotal),
            "discount": float(order.discount_amount),
            "shipping": float(order.shipping_fee),
            "tax": float(order.tax_amount),
            "grandTotal": float(order.total_amount)
        },
        "payment": {
            "method": pay_method,
            "status": pay_status,
            "transaction": pay_txn,
            **({"card": pay_card} if pay_card else {})
        },
        "orderStatus": order.status,
        "status": order.status,
        "orderDate": order.created_at.isoformat() if order.created_at else datetime.now(timezone.utc).isoformat(),
        "trackingTimeline": order.tracking_timeline or [],
        "adminNotes": order.admin_notes or "",
        "customerNotes": order.customer_notes or "",
        "updatedAt": order.updated_at.isoformat() if order.updated_at else datetime.now(timezone.utc).isoformat()
    }


# ==============================================================================
# 1. ORDER CREATION / CHECKOUT
# ==============================================================================

@router.post("/users/{user_id}/orders", summary="Create order from checkout with atomic row-locking")
def create_order(
    user_id: str,
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Places an order atomically.
    - Locks inventory rows with 'with_for_update()' to prevent race conditions.
    - Verifies stock and prevents negative inventory.
    - Authoritatively recalculates subtotal, discounts, shipping, tax, and totals.
    - Records demo payment in pending status.
    - Decrements inventory and creates immutable order snapshots.
    - Clears purchased items from customer's cart.
    - Rolls back entire transaction on any failure.
    """
    verify_user_access(user_id, current_user)

    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item."
        )

    if not payload.address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shipping address is required."
        )

    # 1. Collect all product IDs and item quantities
    items_map: Dict[str, int] = {}
    items_raw = []
    for itm in payload.items:
        p_id = (itm.productId or itm.id or "").strip()
        if not p_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product ID missing for order item.")
        qty = max(1, itm.quantity)
        items_map[p_id] = items_map.get(p_id, 0) + qty
        items_raw.append({
            "productId": p_id,
            "quantity": qty,
            "variants": itm.variants or itm.variant or []
        })

    product_ids = list(items_map.keys())

    # 2. Start atomic transaction with row locking
    try:
        # Acquire SELECT FOR UPDATE locks on all purchased products
        locked_products = db.query(Product).filter(
            Product.id.in_(product_ids)
        ).with_for_update().all()

        locked_prod_dict = {p.id: p for p in locked_products}

        # Verify all products exist and have sufficient stock
        for p_id, requested_qty in items_map.items():
            prod = locked_prod_dict.get(p_id)
            if not prod:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID '{p_id}' not found in catalog."
                )
            if not prod.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{prod.name}' is currently unavailable."
                )
            if prod.stock_quantity < requested_qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{prod.name}'. Only {prod.stock_quantity} available, but {requested_qty} requested."
                )

        # 3. Recalculate authoritative financial pricing
        delivery_dict = payload.delivery or {"name": "Standard Carbon-Neutral Delivery", "price": 0.0}
        pricing = calculate_order_pricing(
            db=db,
            items_data=items_raw,
            delivery_data=delivery_dict,
            coupon_code=payload.couponCode
        )

        # 4. If coupon was applied, acquire lock on Coupon and atomically increment usage_count
        coupon_code_used = pricing.get("couponCode")
        if coupon_code_used:
            locked_coupon = db.query(Coupon).filter(
                func.upper(Coupon.code) == coupon_code_used.upper()
            ).with_for_update().first()
            if locked_coupon:
                locked_coupon.usage_count += 1

        # 5. Atomically decrement stock and increment total_sold
        for p_id, qty in items_map.items():
            prod = locked_prod_dict[p_id]
            prod.stock_quantity = max(0, prod.stock_quantity - qty)
            prod.total_sold = (prod.total_sold or 0) + qty

        # 6. Generate order identifiers
        order_num = generate_order_number()
        order_id = order_num.lower()

        # 7. Demo Payment Handling
        pay_info = payload.payment
        pay_method = pay_info.method.lower().strip() if pay_info.method else "cod"
        txn_id = pay_info.transaction or generate_transaction_id()

        # Strict requirement: Online payment methods remain pending in demo mode
        initial_order_status = "processing"
        initial_payment_status = "pending"

        # Card sanitization: store only card.last4, never full number or CVV
        card_details = None
        if pay_method == "card" and pay_info.card:
            last4 = str(pay_info.card.get("last4") or "")
            if len(last4) >= 4:
                card_details = {"last4": last4[-4:]}

        # 8. Create Order record
        order = Order(
            id=order_id,
            order_number=order_num,
            user_id=user_id,
            status=initial_order_status,
            payment_status=initial_payment_status,
            payment_method=pay_method,
            subtotal=pricing["subtotal"],
            discount_amount=pricing["discount"],
            shipping_fee=pricing["shipping"],
            tax_amount=pricing["tax"],
            total_amount=pricing["grandTotal"],
            coupon_code=coupon_code_used,
            shipping_address=payload.address,
            delivery={
                "name": delivery_dict.get("name", "Standard Delivery"),
                "price": float(pricing["shipping"]),
                "trackingNumber": ""
            },
            billing_address=payload.address,
            tracking_timeline=[
                {
                    "status": "pending",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "note": "Order placed successfully."
                },
                {
                    "status": "processing",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "note": "Order queued for warehouse fulfillment."
                }
            ],
            customer_notes=payload.customerNotes
        )
        db.add(order)
        db.flush()

        # 9. Create immutable OrderItem snapshots
        for processed in pricing["items"]:
            prod = processed["product"]
            p_snap = {
                "id": prod.id,
                "sku": prod.sku,
                "name": prod.name,
                "category": prod.category.name if prod.category else "",
                "mainImage": (prod.media or {}).get("mainImage", "")
            }
            order_item = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                product_snapshot=p_snap,
                selected_variant=processed["variants"],
                quantity=processed["quantity"],
                unit_price=processed["unitPrice"],
                total_price=processed["totalPrice"]
            )
            db.add(order_item)

        # 10. Create Payment transaction record
        payment_record = Payment(
            order_id=order.id,
            user_id=user_id,
            transaction_id=txn_id,
            payment_method=pay_method,
            amount=pricing["grandTotal"],
            currency="BDT",
            status=initial_payment_status,
            payment_details={"card": card_details} if card_details else {}
        )
        db.add(payment_record)

        # 11. Clear ordered items from customer's active CartItem table
        db.query(CartItem).filter(
            CartItem.user_id == user_id,
            CartItem.product_id.in_(product_ids)
        ).delete(synchronize_session=False)

        # Commit entire atomic transaction
        db.commit()
        db.refresh(order)

        return {
            "success": True,
            "message": "Order created successfully.",
            "order": format_order(order)
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Checkout failed: {str(exc)}"
        )


# ==============================================================================
# 2. CUSTOMER ORDER RETRIEVAL & CANCELLATION
# ==============================================================================

@router.get("/users/{user_id}/orders", summary="Get customer order history")
def get_customer_orders(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves all past orders placed by the customer, sorted newest first."""
    verify_user_access(user_id, current_user)

    orders = db.query(Order).filter(
        Order.user_id == user_id
    ).order_by(desc(Order.created_at)).all()

    return {
        "success": True,
        "orders": [format_order(o) for o in orders],
        "total": len(orders)
    }


@router.get("/users/{user_id}/orders/{order_id}", summary="Get customer single order details")
def get_customer_order_detail(
    user_id: str,
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves single order details with item specifications and delivery snapshot."""
    verify_user_access(user_id, current_user)

    order = db.query(Order).filter(
        Order.user_id == user_id,
        or_(Order.id == order_id, Order.order_number == order_id)
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found."
        )

    return {
        "success": True,
        "order": format_order(order)
    }


@router.patch("/users/{user_id}/orders/{order_id}/cancel", summary="Cancel customer order and restore inventory")
def cancel_customer_order(
    user_id: str,
    order_id: str,
    payload: Optional[OrderCancelPayload] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Cancels an eligible customer order.
    - Only allowed if order status is 'pending' or 'processing'.
    - Atomically locks inventory rows and restores product stock_quantity.
    - Decrements coupon usage count if coupon was applied.
    - Appends cancellation event to tracking timeline.
    """
    verify_user_access(user_id, current_user)
    reason = payload.reason if payload else "Customer requested cancellation"

    try:
        # Lock order row with with_for_update()
        order = db.query(Order).filter(
            Order.user_id == user_id,
            or_(Order.id == order_id, Order.order_number == order_id)
        ).with_for_update().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{order_id}' not found."
            )

        if order.status == "cancelled":
            return {
                "success": True,
                "message": f"Order #{order.order_number} is already cancelled.",
                "order": format_order(order)
            }

        # Check cancellation eligibility
        if order.status not in ("pending", "processing"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel order in '{order.status}' status. Only pending or processing orders can be cancelled."
            )

        # Restore inventory stock atomically
        item_pids = [item.product_id for item in order.items if item.product_id]
        if item_pids:
            locked_prods = db.query(Product).filter(
                Product.id.in_(item_pids)
            ).with_for_update().all()
            prod_lookup = {p.id: p for p in locked_prods}

            for itm in order.items:
                if itm.product_id and itm.product_id in prod_lookup:
                    p = prod_lookup[itm.product_id]
                    p.stock_quantity += itm.quantity
                    p.total_sold = max(0, (p.total_sold or 0) - itm.quantity)

        # Restore coupon usage count if used
        if order.coupon_code:
            locked_coupon = db.query(Coupon).filter(
                func.upper(Coupon.code) == order.coupon_code.upper()
            ).with_for_update().first()
            if locked_coupon:
                locked_coupon.usage_count = max(0, locked_coupon.usage_count - 1)

        # Update order status & timeline
        order.status = "cancelled"
        timeline = list(order.tracking_timeline or [])
        timeline.append({
            "status": "cancelled",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": f"Order cancelled: {reason}"
        })
        order.tracking_timeline = timeline

        db.commit()
        db.refresh(order)

        return {
            "success": True,
            "message": f"Order #{order.order_number} has been cancelled successfully.",
            "order": format_order(order)
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel order: {str(exc)}"
        )


# ==============================================================================
# 3. COUPON VALIDATION ENDPOINTS (Customer Storefront)
# ==============================================================================

@router.post("/coupons/validate", summary="Validate coupon code and return discount amount")
def validate_coupon_endpoint(
    payload: CouponValidateRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Validates coupon code against minimum spend, expiry, and usage limits."""
    subtotal = Decimal(str(payload.subtotal or "0.00"))
    is_valid, coupon, discount, err = validate_coupon(db, payload.code, subtotal)

    if not is_valid:
        return {
            "success": False,
            "valid": False,
            "error": err,
            "discount": 0.0
        }

    return {
        "success": True,
        "valid": True,
        "code": coupon.code,
        "discountType": coupon.discount_type,
        "discountValue": float(coupon.discount_value),
        "discount": float(discount),
        "minSpend": float(coupon.min_purchase)
    }


@router.get("/coupons/{code}", summary="Get coupon details by code")
def get_coupon_by_code(code: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieves public metadata for a promotional coupon code."""
    coupon = db.query(Coupon).filter(func.upper(Coupon.code) == code.strip().upper()).first()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Coupon '{code}' not found.")

    return {
        "success": True,
        "coupon": {
            "id": coupon.id,
            "code": coupon.code,
            "discountType": coupon.discount_type,
            "discountValue": float(coupon.discount_value),
            "minSpend": float(coupon.min_purchase),
            "active": coupon.is_active,
            "usageCount": coupon.usage_count,
            "maxUses": coupon.usage_limit
        }
    }
