"""
Data Migration Script: Import Products from productData.json into PostgreSQL.
Idempotent script that safely inserts or updates categories, subcategories,
brands, products, variants, variant options, reviews, and FAQs.
"""

import sys
import os
import json
import re
from decimal import Decimal
from typing import Dict, Any

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine
from app.models.category import Category, Subcategory
from app.models.brand import Brand, ProductBrand
from app.models.product import (
    Product,
    ProductVariant,
    VariantOption,
    Review,
    ProductFAQ
)
from app.models.user import User


def slugify(text: str) -> str:
    """Converts a string into a URL-friendly slug."""
    text = str(text).lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "item"


def run_migration():
    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "json", "productData.json")
    if not os.path.exists(json_path):
        print(f"[ERROR] JSON file not found: {json_path}")
        return False

    with open(json_path, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    total_products = len(products_data)
    print("=" * 70)
    print(f"  LUMEN Hardware — Product Catalog Data Migration")
    print("=" * 70)
    print(f"Found {total_products} products in productData.json")
    print("-" * 70)

    db = SessionLocal()

    # Pre-seed a system reviewer user in PostgreSQL for reviews if needed
    system_user = db.query(User).filter(User.id == "system_reviewer").first()
    if not system_user:
        system_user = User(
            id="system_reviewer",
            email="reviews@lumenhardware.com",
            role="user",
            name="Verified Customer",
            first_name="Verified",
            last_name="Customer",
            is_active=True
        )
        db.add(system_user)
        db.commit()

    # In-memory caches to minimize query overhead
    cat_cache: Dict[str, Category] = {c.name.lower(): c for c in db.query(Category).all()}
    subcat_cache: Dict[str, Subcategory] = {(s.category_id, s.name.lower()): s for s in db.query(Subcategory).all()}
    brand_cache: Dict[str, Brand] = {b.name.lower(): b for b in db.query(Brand).all()}

    imported_products_count = 0
    imported_variants_count = 0
    imported_options_count = 0
    imported_reviews_count = 0
    imported_faqs_count = 0

    try:
        for idx, item in enumerate(products_data, start=1):
            fixed = item.get("fixed", {})
            variable = item.get("variable", {})

            prod_id = fixed.get("id")
            if not prod_id:
                print(f"[SKIP] Product index {idx} has no fixed.id")
                continue

            # 1. Category
            cat_name = (fixed.get("category") or "Uncategorized").strip()
            cat = cat_cache.get(cat_name.lower())
            if not cat:
                cat_slug = slugify(cat_name)
                # Ensure unique slug
                existing_slug_cat = db.query(Category).filter(Category.slug == cat_slug).first()
                if existing_slug_cat:
                    cat_slug = f"{cat_slug}-{len(cat_cache) + 1}"
                cat = Category(
                    name=cat_name,
                    slug=cat_slug,
                    display_order=len(cat_cache) + 1,
                    is_active=True
                )
                db.add(cat)
                db.flush()
                cat_cache[cat_name.lower()] = cat

            # 2. Subcategory
            subcat_name = (fixed.get("subCategory") or "General").strip()
            subcat_key = (cat.id, subcat_name.lower())
            subcat = subcat_cache.get(subcat_key)
            if not subcat:
                subcat_slug = slugify(f"{cat.slug}-{subcat_name}")
                existing_sub = db.query(Subcategory).filter(Subcategory.slug == subcat_slug).first()
                if existing_sub:
                    subcat_slug = f"{subcat_slug}-{len(subcat_cache) + 1}"
                subcat = Subcategory(
                    category_id=cat.id,
                    name=subcat_name,
                    slug=subcat_slug,
                    display_order=len(subcat_cache) + 1,
                    is_active=True
                )
                db.add(subcat)
                db.flush()
                subcat_cache[subcat_key] = subcat

            # 3. Product Core Attributes
            sku = (fixed.get("sku") or f"SKU-{prod_id.upper()}").strip()
            slug = (fixed.get("slug") or slugify(fixed.get("name") or prod_id)).strip()
            name = (fixed.get("name") or sku).strip()

            price_obj = variable.get("price", {})
            regular_price = Decimal(str(price_obj.get("regular", 0.0)))
            discount_percent = Decimal(str(price_obj.get("discount", 0.0) or 0.0))

            stock_obj = variable.get("stock", {})
            stock_quantity = int(stock_obj.get("quantity", 0) or 0)
            total_sold = int(stock_obj.get("totalSold", 0) or 0)

            badge_obj = variable.get("badge")
            badge_text = badge_obj.get("text") if isinstance(badge_obj, dict) else (str(badge_obj) if badge_obj else None)

            rev_obj = variable.get("review") or variable.get("reviews", {})
            rating_average = Decimal(str(round(float(rev_obj.get("score", 0.0) or 0.0), 2)))
            rating_count = int(rev_obj.get("count", 0) or 0)

            # JSONB payloads
            media_json = fixed.get("media") or {"mainImage": fixed.get("mainImage", ""), "thumbnails": []}
            specs_json = fixed.get("specifications") or {"cardSpecs": [], "quickOverview": [], "specs": []}
            desc_json = fixed.get("description") or {"heading": "", "paragraphs": [], "boxContents": []}
            assurance_json = fixed.get("assurance") or []
            var_modifiers_json = variable.get("variants") or []
            extra_data_json = {
                "promo": variable.get("promo"),
                "badge": badge_obj,
                "compatibility": fixed.get("compatibility") or []
            }

            # Check existing product
            product = db.query(Product).filter(Product.id == prod_id).first()
            if not product:
                product = Product(
                    id=prod_id,
                    sku=sku,
                    slug=slug,
                    name=name,
                    category_id=cat.id,
                    subcategory_id=subcat.id,
                    badge=badge_text,
                    regular_price=regular_price,
                    discount_percent=discount_percent,
                    stock_quantity=stock_quantity,
                    total_sold=total_sold,
                    rating_average=rating_average,
                    rating_count=rating_count,
                    media=media_json,
                    specifications=specs_json,
                    description=desc_json,
                    assurance=assurance_json,
                    variant_modifiers=var_modifiers_json,
                    extra_data=extra_data_json,
                    is_active=True
                )
                db.add(product)
                db.flush()
                imported_products_count += 1
            else:
                # Update existing product
                product.sku = sku
                product.slug = slug
                product.name = name
                product.category_id = cat.id
                product.subcategory_id = subcat.id
                product.badge = badge_text
                product.regular_price = regular_price
                product.discount_percent = discount_percent
                product.stock_quantity = stock_quantity
                product.total_sold = total_sold
                product.rating_average = rating_average
                product.rating_count = rating_count
                product.media = media_json
                product.specifications = specs_json
                product.description = desc_json
                product.assurance = assurance_json
                product.variant_modifiers = var_modifiers_json
                product.extra_data = extra_data_json
                db.flush()

            # 4. Brands & ProductBrand Associations
            brands_raw = fixed.get("brand", [])
            if isinstance(brands_raw, str):
                brands_list = [b.strip() for b in brands_raw.split("•") if b.strip()]
            else:
                brands_list = [str(b).strip() for b in brands_raw if str(b).strip()]

            # Clear existing brand associations to avoid duplicates
            db.query(ProductBrand).filter(ProductBrand.product_id == prod_id).delete()
            for b_name in brands_list:
                brand = brand_cache.get(b_name.lower())
                if not brand:
                    brand_slug = slugify(b_name)
                    existing_b = db.query(Brand).filter(Brand.slug == brand_slug).first()
                    if existing_b:
                        brand_slug = f"{brand_slug}-{len(brand_cache) + 1}"
                    brand = Brand(name=b_name, slug=brand_slug, is_active=True)
                    db.add(brand)
                    db.flush()
                    brand_cache[b_name.lower()] = brand

                pb = ProductBrand(product_id=prod_id, brand_id=brand.id)
                db.add(pb)

            # 5. Variants & Variant Options
            # Match fixed variants with variable modifiers
            fixed_variants = fixed.get("variants", [])
            var_modifiers_map = {v.get("id"): v for v in (variable.get("variants") or []) if isinstance(v, dict)}

            # Clear existing variants for clean idempotency
            db.query(ProductVariant).filter(ProductVariant.product_id == prod_id).delete()

            for v_idx, fv in enumerate(fixed_variants, start=1):
                v_id = fv.get("id") or f"var-{prod_id}-{v_idx}"
                v_name = fv.get("label") or fv.get("name") or f"Option {v_idx}"

                pv = ProductVariant(
                    id=v_id,
                    product_id=prod_id,
                    name=v_name,
                    display_order=v_idx
                )
                db.add(pv)
                db.flush()
                imported_variants_count += 1

                # Extract variable modifiers
                vv = var_modifiers_map.get(v_id, {})
                stocks_list = vv.get("stock", [])
                p_mods_list = vv.get("priceModifier", [])

                for opt_idx, opt in enumerate(fv.get("options", []), start=1):
                    opt_name = opt.get("name", f"Option {opt_idx}")
                    is_default = bool(opt.get("isDefault", False))
                    stock_val = stocks_list[opt_idx - 1] if opt_idx - 1 < len(stocks_list) else stock_quantity
                    pmod_val = Decimal(str(p_mods_list[opt_idx - 1])) if opt_idx - 1 < len(p_mods_list) else Decimal("0.00")

                    vo = VariantOption(
                        variant_id=pv.id,
                        name=opt_name,
                        is_default=is_default,
                        price_modifier=pmod_val,
                        stock_quantity=int(stock_val or 0),
                        display_order=opt_idx
                    )
                    db.add(vo)
                    imported_options_count += 1

            # 6. Reviews
            review_items = rev_obj.get("list", [])
            for r in review_items:
                r_comment = r.get("description") or r.get("comment") or "Great product."
                r_title = r.get("title") or "Verified Purchase"
                r_stars = int(r.get("stars") or 5)
                r_user_name = r.get("reviewerName") or "Verified Customer"
                r_user_id = r.get("reviewerId") or system_user.id

                # Ensure reviewer exists
                rev_user = db.query(User).filter(User.id == r_user_id).first()
                if not rev_user:
                    rev_user = User(
                        id=r_user_id,
                        email=f"{slugify(r_user_name)}@customer.lumen",
                        role="user",
                        name=r_user_name,
                        is_active=True
                    )
                    db.add(rev_user)
                    db.flush()

                # Avoid duplicate reviews for the same user & product & title
                existing_rev = db.query(Review).filter(
                    Review.product_id == prod_id,
                    Review.user_id == rev_user.id,
                    Review.title == r_title
                ).first()

                if not existing_rev:
                    new_rev = Review(
                        product_id=prod_id,
                        user_id=rev_user.id,
                        user_name=r_user_name,
                        rating=max(1, min(5, r_stars)),
                        title=r_title,
                        comment=r_comment,
                        status="approved"
                    )
                    db.add(new_rev)
                    imported_reviews_count += 1

            # 7. FAQs
            faq_items = variable.get("faq", [])
            for f_item in faq_items:
                q = f_item.get("question") or f_item.get("q")
                a = f_item.get("answer") or f_item.get("a")
                if q:
                    existing_faq = db.query(ProductFAQ).filter(
                        ProductFAQ.product_id == prod_id,
                        ProductFAQ.question == q
                    ).first()
                    if not existing_faq:
                        faq_record = ProductFAQ(
                            product_id=prod_id,
                            question=q,
                            answer=a,
                            asked_by="Verified Buyer",
                            answered_by="LUMEN Support Team",
                            is_published=True
                        )
                        db.add(faq_record)
                        imported_faqs_count += 1

        db.commit()
        print("-" * 70)
        print("  DATA MIGRATION SUMMARY")
        print("-" * 70)
        print(f"  [OK] Total Products Processed:  {total_products}")
        print(f"  [OK] Products In Database:       {db.query(Product).count()}")
        print(f"  [OK] Categories Created/Cached:  {len(cat_cache)}")
        print(f"  [OK] Subcategories Created:      {len(subcat_cache)}")
        print(f"  [OK] Brands Created/Cached:      {len(brand_cache)}")
        print(f"  [OK] Product Variants Imported:  {db.query(ProductVariant).count()}")
        print(f"  [OK] Variant Options Imported:   {db.query(VariantOption).count()}")
        print(f"  [OK] Product Reviews Imported:   {db.query(Review).count()}")
        print(f"  [OK] Product FAQs Imported:      {db.query(ProductFAQ).count()}")
        print("=" * 70)
        print("[SUCCESS] All product catalog data imported cleanly into PostgreSQL!")
        return True

    except Exception as exc:
        db.rollback()
        print(f"[FATAL ERROR] Migration failed: {exc}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
