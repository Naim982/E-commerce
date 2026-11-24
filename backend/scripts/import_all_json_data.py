"""
Master import script: LUMEN Hardware
Populates PostgreSQL (lumen_db) from all source JSON files in backend/data/json/:
  - productData.json -> Categories, Subcategories, Brands, ProductBrands, Products, ProductVariants, VariantOptions, Reviews, ProductFAQs
  - userData.json -> Users, Addresses, CartItems, WishlistItems, Orders, OrderItems, Payments
  - coupons.json -> Coupons
  - siteData.json -> SiteContent (heroSlides, authBanners, aboutSection)
  - settings.json -> StoreSettings (store, commerce, shipping, inventory)
  - db.json -> SupportTickets (userSupport)

Safe to run repeatedly (idempotent - uses upsert/check logic).
DOES NOT delete or modify any source JSON files.
"""

import os
import sys
import json
import re
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.category import Category, Subcategory
from app.models.brand import Brand, ProductBrand
from app.models.product import Product, ProductVariant, VariantOption, Review, ProductFAQ
from app.models.user import User, Address
from app.models.cart import CartItem, WishlistItem
from app.models.order import Order, OrderItem, Payment
from app.models.coupon import Coupon
from app.models.site import SiteContent, StoreSettings
from app.models.support import SupportTicket

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "json")


def slugify(text: str) -> str:
    """Convert text to URL-friendly lowercase slug."""
    text = str(text or "").strip().lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-") or "item"


def run_full_import():
    db: Session = SessionLocal()
    print("=" * 75)
    print("  LUMEN HARDWARE — COMPLETE JSON TO POSTGRESQL IMPORT")
    print("=" * 75)
    print(f"Data Source Directory: {DATA_DIR}")
    print("-" * 75)

    try:
        # ======================================================================
        # 1. IMPORT PRODUCTS & CATALOG (productData.json)
        # ======================================================================
        prod_file = os.path.join(DATA_DIR, "productData.json")
        if os.path.exists(prod_file):
            print("\n[PHASE 1] Importing Products & Catalog Taxonomy...")
            with open(prod_file, "r", encoding="utf-8") as f:
                products_raw = json.load(f)

            category_cache = {}
            subcategory_cache = {}
            brand_cache = {}

            # Preload existing taxonomy
            for cat in db.query(Category).all():
                category_cache[cat.name.lower()] = cat
            for sub in db.query(Subcategory).all():
                subcategory_cache[(sub.category_id, sub.name.lower())] = sub
            for br in db.query(Brand).all():
                brand_cache[br.name.lower()] = br

            prod_count = 0
            for item in products_raw:
                fixed = item.get("fixed", {})
                variable = item.get("variable", {})

                # 1.1 Category
                cat_name = str(fixed.get("category", "General")).strip()
                cat_key = cat_name.lower()
                if cat_key not in category_cache:
                    new_cat = Category(
                        name=cat_name,
                        slug=slugify(cat_name),
                        display_order=len(category_cache),
                        is_active=True
                    )
                    db.add(new_cat)
                    db.flush()
                    category_cache[cat_key] = new_cat
                category = category_cache[cat_key]

                # 1.2 Subcategory
                sub_name = str(fixed.get("subcategory", "")).strip()
                subcategory = None
                if sub_name:
                    sub_key = (category.id, sub_name.lower())
                    if sub_key not in subcategory_cache:
                        new_sub = Subcategory(
                            category_id=category.id,
                            name=sub_name,
                            slug=slugify(f"{cat_name}-{sub_name}"),
                            display_order=len(subcategory_cache),
                            is_active=True
                        )
                        db.add(new_sub)
                        db.flush()
                        subcategory_cache[sub_key] = new_sub
                    subcategory = subcategory_cache[sub_key]

                # 1.3 Product Record
                prod_id = str(fixed.get("id") or item.get("id")).strip()
                name = str(fixed.get("name") or "Hardware Product").strip()
                sku = str(fixed.get("sku") or f"SKU-{prod_id}").strip()
                slug = str(fixed.get("slug") or slugify(name)).strip()

                pricing = variable.get("pricing", {})
                regular_price = Decimal(str(pricing.get("regular") or 0.0))
                discount = Decimal(str(variable.get("discount", 0) or 0))
                stock_quantity = int(variable.get("stock", 10) or 0)
                badge = str(variable.get("badge") or "").strip()

                rev_summary = variable.get("reviewsSummary", {})
                rating_average = Decimal(str(rev_summary.get("averageRating") or 0.0))
                rating_count = int(rev_summary.get("totalReviews") or 0)

                media = fixed.get("media", {})
                specifications = fixed.get("specifications", {})
                descriptions = fixed.get("description", {})
                assurances = fixed.get("warrantyGuarantee", [])
                if isinstance(assurances, dict):
                    assurances = [assurances]
                elif not isinstance(assurances, list):
                    assurances = []

                variant_modifiers = variable.get("variantStockAndPriceModifiers", {})

                product = db.query(Product).filter(Product.id == prod_id).first()
                if not product:
                    product = Product(
                        id=prod_id,
                        sku=sku,
                        slug=slug,
                        name=name,
                        category_id=category.id,
                        subcategory_id=subcategory.id if subcategory else None,
                        regular_price=regular_price,
                        discount_percent=discount,
                        stock_quantity=stock_quantity,
                        total_sold=int(variable.get("totalSold", 0) or 0),
                        badge=badge,
                        rating_average=rating_average,
                        rating_count=rating_count,
                        is_active=True,
                        media=media,
                        specifications=specifications,
                        description=descriptions,
                        assurance=assurances,
                        variant_modifiers=variant_modifiers
                    )
                    db.add(product)
                    db.flush()
                    prod_count += 1
                else:
                    product.sku = sku
                    product.slug = slug
                    product.name = name
                    product.category_id = category.id
                    product.subcategory_id = subcategory.id if subcategory else None
                    product.regular_price = regular_price
                    product.discount_percent = discount
                    product.stock_quantity = stock_quantity
                    product.badge = badge
                    product.media = media
                    product.specifications = specifications
                    product.description = descriptions
                    product.assurance = assurances
                    product.variant_modifiers = variant_modifiers

                # 1.4 Brands mapping
                raw_brands = fixed.get("brand", [])
                if isinstance(raw_brands, str):
                    raw_brands = [raw_brands]
                for b_name in raw_brands:
                    b_clean = str(b_name).strip()
                    if not b_clean:
                        continue
                    b_key = b_clean.lower()
                    if b_key not in brand_cache:
                        new_b = Brand(name=b_clean, slug=slugify(b_clean))
                        db.add(new_b)
                        db.flush()
                        brand_cache[b_key] = new_b
                    brand_obj = brand_cache[b_key]
                    pb = db.query(ProductBrand).filter(
                        ProductBrand.product_id == product.id,
                        ProductBrand.brand_id == brand_obj.id
                    ).first()
                    if not pb:
                        db.add(ProductBrand(product_id=product.id, brand_id=brand_obj.id))

                # 1.5 Variants
                raw_variants = fixed.get("variants", [])
                for v_idx, v in enumerate(raw_variants):
                    raw_v_id = str(v.get("id", f"var-{v_idx}")).strip()
                    unique_pv_id = f"{product.id}_{raw_v_id}"
                    v_label = v.get("label") or v.get("name") or raw_v_id

                    pv = db.query(ProductVariant).filter(ProductVariant.id == unique_pv_id).first()
                    if not pv:
                        pv = ProductVariant(
                            id=unique_pv_id,
                            product_id=product.id,
                            name=v_label,
                            display_order=v_idx
                        )
                        db.add(pv)
                        db.flush()

                    for opt_idx, opt in enumerate(v.get("options", [])):
                        opt_name = str(opt.get("name", "")).strip()
                        if not opt_name:
                            continue
                        vo = db.query(VariantOption).filter(
                            VariantOption.variant_id == pv.id,
                            VariantOption.name == opt_name
                        ).first()
                        if not vo:
                            vo = VariantOption(
                                variant_id=pv.id,
                                name=opt_name,
                                price_modifier=Decimal(str(opt.get("priceModifier", 0.0))),
                                stock_quantity=int(opt.get("stock", opt.get("stockQuantity", 10))),
                                is_default=bool(opt.get("isDefault", False)),
                                display_order=opt_idx
                            )
                            db.add(vo)

                # 1.6 Reviews
                for rev in variable.get("reviews", []):
                    r_comment = rev.get("comment", "")
                    r_user_name = rev.get("userName") or rev.get("user") or "Verified Customer"
                    r_rating = int(rev.get("rating") or 5)
                    r_title = rev.get("title", "")
                    existing_r = db.query(Review).filter(
                        Review.product_id == product.id,
                        Review.user_name == r_user_name,
                        Review.comment == r_comment
                    ).first()
                    if not existing_r:
                        db.add(Review(
                            product_id=product.id,
                            user_id=None,
                            user_name=r_user_name,
                            rating=r_rating,
                            title=r_title,
                            comment=r_comment,
                            status="approved"
                        ))

                # 1.7 FAQs
                for faq in variable.get("faqs", []):
                    q = faq.get("question", "")
                    a = faq.get("answer", "")
                    if q:
                        existing_faq = db.query(ProductFAQ).filter(
                            ProductFAQ.product_id == product.id,
                            ProductFAQ.question == q
                        ).first()
                        if not existing_faq:
                            db.add(ProductFAQ(
                                product_id=product.id,
                                question=q,
                                answer=a,
                                asked_by=faq.get("askedBy", "Customer"),
                                answered_by=faq.get("answeredBy", "LUMEN Support"),
                                is_published=True
                            ))

            db.commit()
            print(f"✓ Products catalog imported: {prod_count} products, {len(category_cache)} categories, {len(subcategory_cache)} subcategories, {len(brand_cache)} brands.")

        # ======================================================================
        # 2. IMPORT USERS, ADDRESSES, CART, WISHLIST, ORDERS (userData.json)
        # ======================================================================
        users_file = os.path.join(DATA_DIR, "userData.json")
        if os.path.exists(users_file):
            print("\n[PHASE 2] Importing Users, Addresses, Cart, Wishlist & Orders...")
            with open(users_file, "r", encoding="utf-8") as f:
                users_raw = json.load(f)

            ADMIN_EMAILS = {"admin@lumen.com", "admin@lumenhardware.com", "demo.account@lumen.com"}
            user_count = 0
            order_count = 0

            for u in users_raw:
                u_id = str(u.get("id")).strip()
                p = u.get("profile", {})
                email = str(p.get("email") or f"{u_id}@customer.lumen").strip().lower()

                assigned_role = "admin" if (u.get("role") == "admin" or email in ADMIN_EMAILS) else "user"
                first_name = p.get("firstName", "")
                last_name = p.get("lastName", "")
                name = f"{first_name} {last_name}".strip() or "Customer"
                phone = p.get("phone", "")

                user = db.query(User).filter(User.id == u_id).first()
                if not user:
                    user = User(
                        id=u_id,
                        email=email,
                        role=assigned_role,
                        first_name=first_name,
                        last_name=last_name,
                        name=name,
                        phone=phone,
                        avatar=p.get("avatarUrl", ""),
                        is_active=True,
                        profile_data=u.get("security", {})
                    )
                    db.add(user)
                    db.flush()
                    user_count += 1
                else:
                    user.role = assigned_role
                    user.email = email
                    user.first_name = first_name
                    user.last_name = last_name
                    user.name = name
                    user.phone = phone

                # Addresses
                for addr in u.get("addresses", []):
                    street = addr.get("street") or addr.get("addressLine1") or addr.get("address") or "Street"
                    city = addr.get("city", "Dhaka")
                    title = addr.get("type") or addr.get("title") or "Home"
                    recipient = addr.get("recipientName") or addr.get("name") or user.name

                    existing_addr = db.query(Address).filter(
                        Address.user_id == user.id,
                        Address.address_line1 == street
                    ).first()
                    if not existing_addr:
                        db.add(Address(
                            user_id=user.id,
                            title=title,
                            name=recipient,
                            phone=addr.get("phone") or user.phone or "",
                            address_line1=street,
                            address_line2=addr.get("addressLine2") or addr.get("apartment") or "",
                            city=city,
                            state=addr.get("state", "Dhaka"),
                            district=addr.get("district") or city or "Dhaka",
                            postal_code=str(addr.get("zipCode") or addr.get("postalCode") or "1200"),
                            country=addr.get("country", "Bangladesh"),
                            is_default=bool(addr.get("isDefault", False))
                        ))

                # Cart items
                for ci in u.get("cartList", []):
                    prod_ref = ci.get("id") or ci.get("productId")
                    if prod_ref:
                        prod_exists = db.query(Product).filter(Product.id == prod_ref).first()
                        if prod_exists:
                            existing_ci = db.query(CartItem).filter(
                                CartItem.user_id == user.id,
                                CartItem.product_id == prod_ref
                            ).first()
                            if not existing_ci:
                                db.add(CartItem(
                                    user_id=user.id,
                                    product_id=prod_ref,
                                    quantity=int(ci.get("quantity", 1)),
                                    selected_variant=ci.get("variant", [])
                                ))

                # Wishlist items
                for w in u.get("wishList", []):
                    w_prod_id = w if isinstance(w, str) else (w.get("id") or w.get("productId"))
                    if w_prod_id:
                        prod_exists = db.query(Product).filter(Product.id == w_prod_id).first()
                        if prod_exists:
                            existing_w = db.query(WishlistItem).filter(
                                WishlistItem.user_id == user.id,
                                WishlistItem.product_id == w_prod_id
                            ).first()
                            if not existing_w:
                                db.add(WishlistItem(user_id=user.id, product_id=w_prod_id))

                # Orders summary
                for o in u.get("ordersSummary", []):
                    o_id = o.get("orderId") or f"ord-{o.get('orderNumber')}"
                    existing_o = db.query(Order).filter(Order.id == o_id).first()
                    if existing_o:
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
                    txn = pay.get("transaction") or f"TXN-{o_id}"

                    created_dt = datetime.now(timezone.utc)
                    if o.get("orderDate"):
                        try:
                            created_dt = datetime.fromisoformat(o["orderDate"].replace("Z", "+00:00"))
                        except Exception:
                            pass

                    new_order = Order(
                        id=o_id,
                        order_number=str(o.get("orderNumber") or o_id),
                        user_id=user.id,
                        status=str(o.get("orderStatus", "processing")).lower(),
                        payment_status=str(pay_status).lower(),
                        payment_method=str(pay_method).lower(),
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
                    order_count += 1

                    # Order items
                    for itm in o.get("items", []):
                        p_id = itm.get("productId") or itm.get("id")
                        qty = int(itm.get("quantity") or 1)
                        u_price = Decimal(str(itm.get("unitPrice") or 0.0))
                        t_price = Decimal(str(itm.get("totalPrice") or (u_price * qty)))

                        db.add(OrderItem(
                            order_id=new_order.id,
                            product_id=p_id,
                            quantity=qty,
                            unit_price=u_price,
                            total_price=t_price,
                            selected_variant=itm.get("variants", []),
                            product_snapshot=itm
                        ))

                    # Payment record
                    db.add(Payment(
                        order_id=new_order.id,
                        transaction_id=txn,
                        payment_method=pay_method.lower(),
                        amount=grand_total,
                        status=pay_status.lower(),
                        payment_details=pay
                    ))

            db.commit()
            print(f"✓ Users and orders imported: {user_count} users, {order_count} orders created.")

        # ======================================================================
        # 3. IMPORT COUPONS (coupons.json & db.json)
        # ======================================================================
        print("\n[PHASE 3] Importing Promotional Coupons...")
        coupons_data = []
        coupons_file = os.path.join(DATA_DIR, "coupons.json")
        if os.path.exists(coupons_file):
            with open(coupons_file, "r", encoding="utf-8") as f:
                coupons_data.extend(json.load(f))

        # Ensure LUMEN10 is present
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

        coupon_count = 0
        for c in coupons_data:
            code = str(c.get("code", "")).strip().upper()
            if not code:
                continue
            existing_c = db.query(Coupon).filter(Coupon.code == code).first()
            disc_val = Decimal(str(c.get("discountValue") or 0.0))
            min_sp = Decimal(str(c.get("minSpend") or 0.0))
            max_uses = int(c.get("maxUses") or 500)
            desc = c.get("description", "")
            is_act = bool(c.get("active", True))

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

            if not existing_c:
                db.add(Coupon(
                    code=code,
                    discount_type=c.get("discountType", "percentage"),
                    discount_value=disc_val,
                    description=desc,
                    min_purchase=min_sp,
                    usage_limit=max_uses,
                    usage_count=int(c.get("usedCount") or 0),
                    is_active=is_act,
                    starts_at=starts_at,
                    expires_at=expires_at
                ))
                coupon_count += 1
            else:
                existing_c.discount_value = disc_val
                existing_c.description = desc
                existing_c.min_purchase = min_sp
                existing_c.is_active = is_act

        db.commit()
        print(f"✓ Coupons verified/imported: {coupon_count} new coupons added.")

        # ======================================================================
        # 4. IMPORT CMS SITE CONTENT (siteData.json)
        # ======================================================================
        print("\n[PHASE 4] Importing CMS Site Content...")
        site_file = os.path.join(DATA_DIR, "siteData.json")
        if os.path.exists(site_file):
            with open(site_file, "r", encoding="utf-8") as f:
                site_raw = json.load(f)

            sections = {
                "heroSlides": site_raw.get("heroSlides", []),
                "authBanners": site_raw.get("authBanners", []),
                "aboutSection": site_raw.get("aboutSection", {})
            }

            for key, content in sections.items():
                existing = db.query(SiteContent).filter(SiteContent.key == key).first()
                if not existing:
                    db.add(SiteContent(key=key, content=content, description=f"CMS section for {key}"))
                else:
                    existing.content = content

            db.commit()
            print(f"✓ Seeded {len(sections)} CMS sections in site_content.")

        # ======================================================================
        # 5. IMPORT STORE SETTINGS (settings.json)
        # ======================================================================
        print("\n[PHASE 5] Importing Store Settings...")
        settings_file = os.path.join(DATA_DIR, "settings.json")
        if os.path.exists(settings_file):
            with open(settings_file, "r", encoding="utf-8") as f:
                settings_raw = json.load(f)

            for key, val in settings_raw.items():
                existing_s = db.query(StoreSettings).filter(StoreSettings.key == key).first()
                if not existing_s:
                    db.add(StoreSettings(key=key, value=val, description=f"Settings for {key}"))
                else:
                    existing_s.value = val

            db.commit()
            print(f"✓ Seeded {len(settings_raw)} store setting groups in store_settings.")

        # ======================================================================
        # 6. IMPORT SUPPORT TICKETS (db.json / siteData.json)
        # ======================================================================
        print("\n[PHASE 6] Importing Customer Support Inquiries...")
        db_file = os.path.join(DATA_DIR, "db.json")
        support_items = []
        if os.path.exists(db_file):
            with open(db_file, "r", encoding="utf-8") as f:
                db_raw = json.load(f)
                support_items = db_raw.get("userSupport", [])

        st_count = 0
        for st in support_items:
            t_num = str(st.get("id") or st.get("ticketId") or f"SUP-{st_count+1:04d}")
            existing_st = db.query(SupportTicket).filter(SupportTicket.ticket_number == t_num).first()
            if not existing_st:
                db.add(SupportTicket(
                    ticket_number=t_num,
                    user_id=st.get("userId"),
                    name=st.get("name") or st.get("userName") or "Customer",
                    email=st.get("email") or st.get("userEmail") or "customer@example.com",
                    topic=st.get("topic") or "General Inquiry",
                    order_number=st.get("orderNumber") or "",
                    subject=st.get("subject") or "Support Request",
                    message=st.get("message") or "Help inquiry message",
                    priority=st.get("priority", "medium").lower(),
                    status=st.get("status", "open").lower(),
                    admin_reply=st.get("adminNotes") or st.get("adminReply")
                ))
                st_count += 1

        db.commit()
        print(f"✓ Support tickets imported: {st_count} tickets created.")

        print("\n" + "=" * 75)
        print("  ALL JSON DATA SUCCESSFULLY IMPORTED INTO POSTGRESQL!")
        print("=" * 75)
        return True

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Migration failed: {exc}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_full_import()
    sys.exit(0 if success else 1)
