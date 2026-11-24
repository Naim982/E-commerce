"""
Import Users, Addresses, Carts, Wishlists, Orders, Payments, Coupons, CMS Content, Store Settings, and Support Tickets.
Safe to run repeatedly (idempotent).
Does not modify or delete any source JSON files.
"""

import os
import sys
import json
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.user import User, Address
from app.models.cart import CartItem, WishlistItem
from app.models.order import Order, OrderItem, Payment
from app.models.coupon import Coupon
from app.models.site import SiteContent, StoreSettings
from app.models.support import SupportTicket

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "json")


def parse_datetime(dt_str):
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(str(dt_str).replace("Z", "+00:00"))
    except Exception:
        return None


def run_import():
    db: Session = SessionLocal()
    print("=" * 70)
    print("  IMPORTING USERS, ORDERS, COUPONS & SITE CONTENT INTO POSTGRESQL")
    print("=" * 70)

    try:
        # Preload known product IDs to validate FKs
        existing_product_ids = set(r[0] for r in db.query(Product.id).all())
        print(f"Loaded {len(existing_product_ids)} existing product IDs for foreign key validation.")

        # ----------------------------------------------------------------------
        # 1. USERS & RELATED DATA (userData.json)
        # ----------------------------------------------------------------------
        user_file = os.path.join(DATA_DIR, "userData.json")
        user_count = 0
        order_count = 0
        cart_count = 0
        wishlist_count = 0

        if os.path.exists(user_file):
            print("\n[PHASE 1] Processing Users, Addresses, Carts, Wishlists & Orders...")
            with open(user_file, "r", encoding="utf-8") as f:
                raw_users = json.load(f)

            ADMIN_EMAILS = {"admin@lumen.com", "admin@lumenhardware.com", "demo.account@lumen.com"}
            ADMIN_UIDS = {"L5kFDg8QGbUC1JhgYfCNhbkF8GG3"}

            for u in raw_users:
                u_id = str(u.get("id")).strip()
                if not u_id:
                    continue

                prof = u.get("profile", {}) or {}
                email = str(prof.get("email") or f"{u_id}@customer.lumen").strip().lower()

                is_admin = (
                    u.get("role") == "admin"
                    or email in ADMIN_EMAILS
                    or u_id in ADMIN_UIDS
                )
                role = "admin" if is_admin else "user"

                first_name = prof.get("firstName") or ""
                last_name = prof.get("lastName") or ""
                full_name = f"{first_name} {last_name}".strip() or "Customer"
                phone = prof.get("phone") or ""
                avatar = prof.get("avatarUrl") or ""

                user = db.query(User).filter(User.id == u_id).first()
                if not user:
                    user = User(
                        id=u_id,
                        email=email,
                        role=role,
                        first_name=first_name,
                        last_name=last_name,
                        name=full_name,
                        phone=phone,
                        avatar=avatar,
                        is_active=True,
                        profile_data={
                            "security": u.get("security", {}),
                            "preferences": u.get("preferences", {})
                        }
                    )
                    db.add(user)
                    db.flush()
                    user_count += 1
                else:
                    user.role = role
                    user.email = email
                    user.first_name = first_name
                    user.last_name = last_name
                    user.name = full_name
                    user.phone = phone
                    user.avatar = avatar
                    db.flush()

                # 1.1 Addresses
                addresses_raw = u.get("addresses") or []
                for addr in addresses_raw:
                    street = addr.get("street") or addr.get("addressLine1") or "Street Address"
                    city = addr.get("city") or "Dhaka"
                    title = addr.get("type") or addr.get("title") or "Home"
                    recip = addr.get("recipientName") or addr.get("name") or user.name

                    existing_addr = db.query(Address).filter(
                        Address.user_id == user.id,
                        Address.address_line1 == street
                    ).first()
                    if not existing_addr:
                        db.add(Address(
                            user_id=user.id,
                            title=title,
                            name=recip,
                            phone=addr.get("phone") or user.phone or "",
                            address_line1=street,
                            address_line2=addr.get("addressLine2") or addr.get("apartment") or "",
                            city=city,
                            state=addr.get("state") or "Dhaka",
                            district=addr.get("district") or city or "Dhaka",
                            postal_code=str(addr.get("zip") or addr.get("zipCode") or addr.get("postalCode") or "1200"),
                            country=addr.get("country") or "Bangladesh",
                            instructions=addr.get("instructions") or "",
                            is_default=bool(addr.get("isDefault", False))
                        ))

                # 1.2 Cart Items
                cart_raw = u.get("cartList") or []
                for ci in cart_raw:
                    p_id = ci.get("id") or ci.get("productId")
                    if p_id and p_id in existing_product_ids:
                        existing_ci = db.query(CartItem).filter(
                            CartItem.user_id == user.id,
                            CartItem.product_id == p_id
                        ).first()
                        if not existing_ci:
                            db.add(CartItem(
                                user_id=user.id,
                                product_id=p_id,
                                quantity=max(1, int(ci.get("quantity") or 1)),
                                selected_variant=ci.get("variant") or []
                            ))
                            cart_count += 1

                # 1.3 Wishlist Items
                wish_raw = u.get("wishlist") or []
                for w in wish_raw:
                    w_pid = w if isinstance(w, str) else (w.get("id") or w.get("productId"))
                    if w_pid and w_pid in existing_product_ids:
                        existing_w = db.query(WishlistItem).filter(
                            WishlistItem.user_id == user.id,
                            WishlistItem.product_id == w_pid
                        ).first()
                        if not existing_w:
                            db.add(WishlistItem(
                                user_id=user.id,
                                product_id=w_pid
                            ))
                            wishlist_count += 1

                # 1.4 Orders & Payments
                orders_raw = u.get("ordersSummary") or []
                for o in orders_raw:
                    if not o or not o.get("orderId"):
                        continue
                    o_id = str(o["orderId"]).strip()
                    existing_order = db.query(Order).filter(Order.id == o_id).first()
                    if existing_order:
                        continue

                    cost = o.get("cost") or {}
                    subtotal = Decimal(str(cost.get("subtotal") or 0.0))
                    discount = Decimal(str(cost.get("discount") or 0.0))
                    tax = Decimal(str(cost.get("tax") or 0.0))
                    delivery_info = o.get("delivery") or {}
                    shipping = Decimal(str(delivery_info.get("price") or cost.get("shipping") or 0.0))
                    grand_total = Decimal(str(cost.get("grandTotal") or (subtotal + tax + shipping - discount)))

                    pay_info = o.get("payment") or {}
                    pay_method = str(pay_info.get("method") or "card").lower()
                    pay_status = str(pay_info.get("status") or "paid").lower()
                    pay_txn = str(pay_info.get("transaction") or f"TXN-{o_id}")

                    dt_order = parse_datetime(o.get("orderDate")) or datetime.now(timezone.utc)

                    new_order = Order(
                        id=o_id,
                        order_number=str(o.get("orderNumber") or o_id),
                        user_id=user.id,
                        status=str(o.get("orderStatus") or "processing").lower(),
                        payment_status=pay_status,
                        payment_method=pay_method,
                        subtotal=subtotal,
                        discount_amount=discount,
                        shipping_fee=shipping,
                        tax_amount=tax,
                        total_amount=grand_total,
                        coupon_code=o.get("couponCode"),
                        shipping_address=o.get("address") or {},
                        delivery=delivery_info,
                        billing_address=o.get("address") or {},
                        tracking_timeline=o.get("trackingTimeline") or [
                            {"status": "pending", "timestamp": dt_order.isoformat(), "note": "Order placed by customer."},
                            {"status": str(o.get("orderStatus") or "processing"), "timestamp": dt_order.isoformat(), "note": "Processing hardware dispatch."}
                        ],
                        customer_notes=o.get("customerNotes") or "",
                        admin_notes=o.get("adminNotes") or "",
                        created_at=dt_order
                    )
                    db.add(new_order)
                    db.flush()
                    order_count += 1

                    # Order Items
                    for itm in (o.get("items") or []):
                        item_pid = itm.get("productId") or itm.get("id")
                        db_pid = item_pid if item_pid in existing_product_ids else None
                        qty = max(1, int(itm.get("quantity") or 1))
                        u_price = Decimal(str(itm.get("unitPrice") or 0.0))
                        t_price = Decimal(str(itm.get("totalPrice") or (u_price * qty)))

                        db.add(OrderItem(
                            order_id=new_order.id,
                            product_id=db_pid,
                            product_snapshot=itm,
                            selected_variant=itm.get("variants") or [],
                            quantity=qty,
                            unit_price=u_price,
                            total_price=t_price
                        ))

                    # Payment
                    existing_txn = db.query(Payment).filter(Payment.transaction_id == pay_txn).first()
                    if existing_txn:
                        pay_txn = f"{pay_txn}-{o_id}"

                    db.add(Payment(
                        order_id=new_order.id,
                        user_id=user.id,
                        transaction_id=pay_txn,
                        payment_method=pay_method,
                        amount=grand_total,
                        status=pay_status,
                        currency="BDT",
                        payment_details=pay_info
                    ))

            db.commit()
            print(f"✓ Users & Orders committed: {user_count} users added/verified, {order_count} orders created.")

        # ----------------------------------------------------------------------
        # 2. PROMOTIONAL COUPONS (coupons.json)
        # ----------------------------------------------------------------------
        print("\n[PHASE 2] Processing Promotional Coupons...")
        coupons_file = os.path.join(DATA_DIR, "coupons.json")
        coupon_count = 0
        if os.path.exists(coupons_file):
            with open(coupons_file, "r", encoding="utf-8") as f:
                coupons_raw = json.load(f)

            for c in coupons_raw:
                code = str(c.get("code", "")).strip().upper()
                if not code:
                    continue

                existing_c = db.query(Coupon).filter(Coupon.code == code).first()
                disc_type = str(c.get("discountType") or "percentage").lower()
                disc_val = Decimal(str(c.get("discountValue") or 0.0))
                min_spend = Decimal(str(c.get("minSpend") or 0.0))
                max_uses = int(c.get("maxUses") or 1000)
                used = int(c.get("usedCount") or 0)
                is_act = bool(c.get("active", True))
                starts = parse_datetime(c.get("startDate"))
                expires = parse_datetime(c.get("expiryDate"))

                if not existing_c:
                    db.add(Coupon(
                        code=code,
                        discount_type=disc_type,
                        discount_value=disc_val,
                        description=c.get("description") or "",
                        min_purchase=min_spend,
                        usage_limit=max_uses,
                        usage_count=used,
                        is_active=is_act,
                        starts_at=starts,
                        expires_at=expires
                    ))
                    coupon_count += 1
                else:
                    existing_c.discount_type = disc_type
                    existing_c.discount_value = disc_val
                    existing_c.description = c.get("description") or ""
                    existing_c.min_purchase = min_spend
                    existing_c.is_active = is_act

        # Also ensure LUMEN10 is present
        if not db.query(Coupon).filter(Coupon.code == "LUMEN10").first():
            db.add(Coupon(
                code="LUMEN10",
                discount_type="percentage",
                discount_value=Decimal("10.00"),
                description="Default store promotional 10% discount",
                min_purchase=Decimal("50.00"),
                usage_limit=1000,
                usage_count=25,
                is_active=True
            ))
            coupon_count += 1

        db.commit()
        print(f"✓ Coupons verified: {coupon_count} new coupons added, total {db.query(Coupon).count()}.")

        # ----------------------------------------------------------------------
        # 3. CMS CONTENT (siteData.json)
        # ----------------------------------------------------------------------
        print("\n[PHASE 3] Processing CMS Site Content...")
        site_file = os.path.join(DATA_DIR, "siteData.json")
        if os.path.exists(site_file):
            with open(site_file, "r", encoding="utf-8") as f:
                site_raw = json.load(f)

            sections = {
                "heroSlides": site_raw.get("heroSlides") or [],
                "authBanners": site_raw.get("authBanners") or [],
                "aboutSection": site_raw.get("aboutSection") or {}
            }

            for k, content in sections.items():
                existing = db.query(SiteContent).filter(SiteContent.key == k).first()
                if not existing:
                    db.add(SiteContent(key=k, content=content, description=f"CMS section for {k}"))
                else:
                    existing.content = content

            db.commit()
            print(f"✓ CMS content updated: {len(sections)} sections saved in site_content.")

        # ----------------------------------------------------------------------
        # 4. STORE SETTINGS (settings.json)
        # ----------------------------------------------------------------------
        print("\n[PHASE 4] Processing Store Settings...")
        settings_file = os.path.join(DATA_DIR, "settings.json")
        if os.path.exists(settings_file):
            with open(settings_file, "r", encoding="utf-8") as f:
                settings_raw = json.load(f)

            for k in ["store", "commerce", "shipping", "inventory"]:
                if k in settings_raw:
                    existing = db.query(StoreSettings).filter(StoreSettings.key == k).first()
                    if not existing:
                        db.add(StoreSettings(key=k, value=settings_raw[k], description=f"Global configuration for {k}"))
                    else:
                        existing.value = settings_raw[k]

            db.commit()
            print(f"✓ Store settings updated in store_settings.")

        # ----------------------------------------------------------------------
        # 5. SUPPORT TICKETS (siteData.json userSupport)
        # ----------------------------------------------------------------------
        print("\n[PHASE 5] Processing Customer Support Tickets...")
        ticket_count = 0
        if os.path.exists(site_file):
            with open(site_file, "r", encoding="utf-8") as f:
                site_raw = json.load(f)
                tickets = site_raw.get("userSupport") or []

            existing_user_ids = set(r[0] for r in db.query(User.id).all())

            for st in tickets:
                t_num = str(st.get("id") or f"SUP-{ticket_count+1:04d}").strip()
                existing_st = db.query(SupportTicket).filter(SupportTicket.ticket_number == t_num).first()
                if not existing_st:
                    raw_uid = st.get("userId")
                    valid_uid = raw_uid if raw_uid in existing_user_ids else None

                    created_at = parse_datetime(st.get("createdAt")) or datetime.now(timezone.utc)

                    db.add(SupportTicket(
                        ticket_number=t_num,
                        user_id=valid_uid,
                        name=st.get("userName") or "Customer",
                        email=st.get("userEmail") or "customer@example.com",
                        topic=st.get("topic") or "General Inquiry",
                        order_number=st.get("orderNumber") or "",
                        subject=f"Help with {st.get('topic') or 'support'}",
                        message=st.get("message") or "Help inquiry message",
                        priority=str(st.get("priority") or "medium").lower(),
                        status=str(st.get("status") or "open").lower(),
                        created_at=created_at
                    ))
                    ticket_count += 1

            db.commit()
            print(f"✓ Support tickets verified: {ticket_count} created, total {db.query(SupportTicket).count()}.")

        print("\n" + "=" * 70)
        print("  ALL REMAINING JSON DATA SUCCESSFULLY IMPORTED!")
        print("=" * 70)
        return True

    except Exception as exc:
        db.rollback()
        print(f"\n[FATAL ERROR] Import failed: {exc}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_import()
    sys.exit(0 if success else 1)
