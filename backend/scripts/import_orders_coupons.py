"""
Data Migration & Seeding Script for Step 4.
Imports coupons from backend/data/json/coupons.json and historical orders from backend/data/json/userData.json into PostgreSQL.
Idempotent and safe to run multiple times.
"""

import json
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal

# Ensure backend root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal
from app.models.coupon import Coupon
from app.models.user import User
from app.models.order import Order, OrderItem, Payment
from app.models.product import Product


def seed_coupons(db):
    """Imports initial coupons from coupons.json and adds LUMEN10 promo."""
    coupons_path = os.path.join(BACKEND_DIR, "data", "json", "coupons.json")
    coupons_data = []

    if os.path.exists(coupons_path):
        with open(coupons_path, "r", encoding="utf-8") as f:
            coupons_data = json.load(f)

    # Ensure LUMEN10 is in the list
    if not any(c.get("code", "").upper() == "LUMEN10" for c in coupons_data):
        coupons_data.append({
            "code": "LUMEN10",
            "discountType": "percentage",
            "discountValue": 10.0,
            "description": "Standard 10% promotional hardware discount",
            "minSpend": 0.0,
            "maxUses": 1000,
            "usedCount": 15,
            "startDate": "2026-01-01",
            "expiryDate": "2026-12-31",
            "active": True
        })

    imported_coupons = 0
    for c in coupons_data:
        code = str(c.get("code", "")).strip().upper()
        if not code:
            continue

        existing = db.query(Coupon).filter(Coupon.code == code).first()
        starts_at = None
        if c.get("startDate"):
            try:
                starts_at = datetime.fromisoformat(c["startDate"].replace("Z", "+00:00"))
            except Exception:
                pass

        expires_at = None
        if c.get("expiryDate"):
            try:
                expires_at = datetime.fromisoformat(c["expiryDate"].replace("Z", "+00:00"))
            except Exception:
                pass

        disc_val = Decimal(str(c.get("discountValue") or 0.0))
        min_sp = Decimal(str(c.get("minSpend") or 0.0))
        max_uses = int(c.get("maxUses") or 500)
        used = int(c.get("usedCount") or 0)
        is_act = bool(c.get("active", True))
        desc = c.get("description", "")

        if not existing:
            new_c = Coupon(
                code=code,
                discount_type=c.get("discountType", "percentage"),
                discount_value=disc_val,
                description=desc,
                min_purchase=min_sp,
                usage_limit=max_uses,
                usage_count=used,
                is_active=is_act,
                starts_at=starts_at,
                expires_at=expires_at
            )
            db.add(new_c)
            imported_coupons += 1
        else:
            existing.discount_type = c.get("discountType", "percentage")
            existing.discount_value = disc_val
            existing.description = desc
            existing.min_purchase = min_sp
            existing.usage_limit = max_uses
            existing.is_active = is_act

    db.commit()
    print(f"✓ Seeded/Verified {len(coupons_data)} coupons in PostgreSQL ({imported_coupons} newly created).")


def import_historical_orders(db):
    """Imports historical orders from userData.json for existing customer profiles."""
    users_path = os.path.join(BACKEND_DIR, "data", "json", "userData.json")
    if not os.path.exists(users_path):
        print("  - No userData.json found; skipping historical orders.")
        return

    with open(users_path, "r", encoding="utf-8") as f:
        users_data = json.load(f)

    total_orders = 0
    imported_orders = 0

    for u in users_data:
        u_id = u.get("id")
        orders = u.get("ordersSummary", [])
        if not orders:
            continue

        # Ensure user exists in database
        db_user = db.query(User).filter(User.id == u_id).first()
        if not db_user:
            p = u.get("profile", {})
            first = p.get("firstName", "")
            last = p.get("lastName", "")
            db_user = User(
                id=u_id,
                email=p.get("email") or f"{u_id}@customer.lumen",
                role=u.get("role", "user"),
                first_name=first,
                last_name=last,
                name=f"{first} {last}".strip() or "Customer",
                phone=p.get("phone", ""),
                is_active=True
            )
            db.add(db_user)
            db.flush()

        for o in orders:
            total_orders += 1
            o_id = o.get("orderId") or f"ord-{o.get('orderNumber', total_orders)}"
            existing_order = db.query(Order).filter(Order.id == o_id).first()
            if existing_order:
                continue

            cost = o.get("cost", {})
            subtotal = Decimal(str(cost.get("subtotal", 0.0)))
            discount = Decimal(str(cost.get("discount", 0.0)))
            tax = Decimal(str(cost.get("tax", 0.0)))
            grand_total = Decimal(str(cost.get("grandTotal", 0.0)))
            shipping = Decimal(str(o.get("delivery", {}).get("price", 0.0)))

            pay = o.get("payment", {})
            pay_method = pay.get("method", "card")
            pay_status = pay.get("status", "paid")
            txn = pay.get("transaction") or f"TXN-{total_orders:08d}"

            created_dt = datetime.now(timezone.utc)
            if o.get("orderDate"):
                try:
                    created_dt = datetime.fromisoformat(o["orderDate"].replace("Z", "+00:00"))
                except Exception:
                    pass

            new_order = Order(
                id=o_id,
                order_number=o.get("orderNumber") or o_id,
                user_id=db_user.id,
                status=o.get("orderStatus", "processing").lower(),
                payment_status=pay_status.lower(),
                payment_method=pay_method.lower(),
                subtotal=subtotal,
                discount_amount=discount,
                shipping_fee=shipping,
                tax_amount=tax,
                total_amount=grand_total,
                coupon_code=o.get("couponCode"),
                shipping_address=o.get("address", {}),
                delivery=o.get("delivery", {}),
                billing_address=o.get("address", {}),
                tracking_timeline=[
                    {"status": "pending", "timestamp": created_dt.isoformat(), "note": "Order placed."},
                    {"status": o.get("orderStatus", "processing"), "timestamp": created_dt.isoformat(), "note": "Order processed."}
                ],
                customer_notes=o.get("customerNotes", ""),
                admin_notes=o.get("adminNotes", ""),
                created_at=created_dt
            )
            db.add(new_order)
            db.flush()

            # Add OrderItems
            for itm in o.get("items", []):
                p_id = itm.get("productId") or itm.get("id")
                qty = int(itm.get("quantity") or 1)
                u_price = Decimal(str(itm.get("unitPrice") or 0.0))
                t_price = Decimal(str(itm.get("totalPrice") or (u_price * qty)))

                # Lookup product name or SKU if exists
                p_obj = db.query(Product).filter(Product.id == p_id).first() if p_id else None
                p_snap = {
                    "id": p_id,
                    "name": p_obj.name if p_obj else itm.get("name", "Hardware Component"),
                    "sku": p_obj.sku if p_obj else f"SKU-{p_id}",
                    "mainImage": (p_obj.media or {}).get("mainImage", "") if p_obj else itm.get("mainImage", "")
                }

                order_item = OrderItem(
                    order_id=new_order.id,
                    product_id=p_obj.id if p_obj else None,
                    product_snapshot=p_snap,
                    selected_variant=itm.get("variants") or itm.get("variant") or [],
                    quantity=qty,
                    unit_price=u_price,
                    total_price=t_price,
                    created_at=created_dt
                )
                db.add(order_item)

            # Add Payment record
            payment_record = Payment(
                order_id=new_order.id,
                user_id=db_user.id,
                transaction_id=txn,
                payment_method=pay_method,
                amount=grand_total,
                currency="BDT",
                status=pay_status,
                payment_details={"card": pay.get("card")} if pay.get("card") else {},
                created_at=created_dt
            )
            db.add(payment_record)
            imported_orders += 1

    db.commit()
    print(f"✓ Imported {imported_orders} historical orders into PostgreSQL (Total inspected: {total_orders}).")


def main():
    print("=" * 60)
    print("  SEEDING COUPONS & IMPORTING HISTORICAL ORDERS")
    print("=" * 60)
    db = SessionLocal()
    try:
        seed_coupons(db)
        import_historical_orders(db)
        print("✓ Step 4 data preparation completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
