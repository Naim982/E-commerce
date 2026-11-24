"""
Product Service: formatting, querying, filtering, and business logic.
Maintains 100% compatibility with LUMEN storefront and admin frontend components.
"""

from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
import re
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc, func, case, cast, String, Text
from app.models.product import Product, ProductVariant, VariantOption, Review, ProductFAQ
from app.models.category import Category, Subcategory
from app.models.brand import Brand, ProductBrand


def slugify(text: str) -> str:
    """Converts a string into a URL-friendly slug."""
    text = str(text).lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "item"


def format_product_detail(p: Product) -> Dict[str, Any]:
    """Formats a Product model into the full product details structure expected by ProductDetails.js."""
    cat_name = p.category.name if p.category else ""
    subcat_name = p.subcategory.name if p.subcategory else ""

    brand_names = [assoc.brand.name for assoc in p.brand_associations if assoc.brand]
    brand_str = " • ".join(brand_names) if brand_names else ""

    regular_price = float(p.regular_price or 0.0)
    discount_pct = int(p.discount_percent or 0)
    if discount_pct > 0:
        current_price = round(regular_price * (1 - discount_pct / 100), 2)
        old_price = regular_price
        discount_str = f"-{discount_pct}%"
    else:
        current_price = regular_price
        old_price = None
        discount_str = "0"

    qty = p.stock_quantity or 0
    stock_status = "in_stock" if qty > 5 else ("low_stock" if qty > 0 else "out_of_stock")

    media = p.media or {}
    main_image = media.get("mainImage") or ""
    thumbnails = media.get("thumbnails") or ([main_image] if main_image else [])

    specs_obj = p.specifications or {}
    card_specs = specs_obj.get("cardSpecs", [])
    quick_overview = specs_obj.get("quickOverview", [])
    specs = specs_obj.get("specs", [])
    description = p.description or {"heading": "", "paragraphs": [], "boxContents": []}

    assurance = p.assurance or []
    warranty = next((a.get("time") for a in assurance if isinstance(a, dict) and a.get("type") == "warranty"), None)
    guarantee = next((a.get("time") for a in assurance if isinstance(a, dict) and a.get("type") == "guarantee"), None)

    # Reconstruct merged variants
    merged_variants = []
    var_modifiers_map = {v.get("id"): v for v in (p.variant_modifiers or []) if isinstance(v, dict)}

    for v in p.variants:
        vv = var_modifiers_map.get(v.id, {})
        stocks = vv.get("stock", [])
        p_mods = vv.get("priceModifier", [])
        merged_options = []
        for idx, opt in enumerate(v.options):
            opt_stock = stocks[idx] if idx < len(stocks) else (opt.stock_quantity if opt.stock_quantity else qty)
            opt_pmod = p_mods[idx] if idx < len(p_mods) else float(opt.price_modifier or 0.0)
            merged_options.append({
                "name": opt.name,
                "isDefault": bool(opt.is_default),
                "stock": opt_stock,
                "priceModifier": opt_pmod
            })
        merged_variants.append({
            "id": v.id,
            "type": v.name,
            "label": v.name,
            "options": merged_options
        })

    # Reviews and distribution
    reviews_list = [
        {
            "id": f"rev-{r.id}",
            "reviewerName": r.user_name,
            "reviewerId": r.user_id,
            "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
            "stars": r.rating,
            "title": r.title or "Product Review",
            "description": r.comment
        }
        for r in p.reviews if r.status == "approved"
    ]

    # Star distribution
    star_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in p.reviews:
        if r.status == "approved" and 1 <= r.rating <= 5:
            star_counts[r.rating] += 1
    distribution = [{"stars": s, "count": star_counts[s]} for s in [5, 4, 3, 2, 1]]

    review_score = float(p.rating_average or 0.0)
    review_count = p.rating_count or len(reviews_list)
    review_obj = {
        "score": review_score,
        "count": review_count,
        "bars": distribution,
        "distribution": distribution,
        "list": reviews_list
    }

    # Normalized FAQ
    faqs_list = [
        {
            "id": f.id,
            "q": f.question,
            "a": f.answer or "",
            "question": f.question,
            "answer": f.answer or ""
        }
        for f in p.faqs if f.is_published
    ]

    badge_data = (p.extra_data or {}).get("badge")
    if not badge_data and p.badge:
        badge_data = {"text": p.badge, "type": "hot"}

    compat_checks = (p.extra_data or {}).get("compatibility", [])

    return {
        "id": p.id,
        "title": p.name,
        "name": p.slug or p.name,
        "sku": p.sku,
        "brandPill": brand_str,
        "brand": brand_str,
        "category": cat_name,
        "subCategory": subcat_name,
        "cardSpecs": card_specs,
        "stock": stock_status,
        "stockStatus": stock_status,
        "warehouseReady": True,
        "mainImage": main_image,
        "thumbnails": thumbnails,
        "badge": badge_data,
        "price": {
            "current": current_price,
            "old": old_price,
            "discount": discount_str
        },
        "pricing": {
            "current": current_price,
            "old": old_price,
            "discount": discount_pct
        },
        "variants": merged_variants,
        "quickOverview": quick_overview,
        "specs": specs,
        "description": description,
        "compatibilityChecks": compat_checks,
        "compatibility": compat_checks,
        "review": review_obj,
        "reviews": review_obj,
        "faq": faqs_list,
        "warranty": warranty,
        "guarantee": guarantee,
        "gurrenty": guarantee,
        "fixed": p.to_fixed_variable_dict()["fixed"],
        "variable": p.to_fixed_variable_dict()["variable"]
    }


def format_product_card(p: Product) -> Dict[str, Any]:
    """Formats a Product model into the card structure expected by shop cards and grids."""
    cat_name = p.category.name if p.category else ""
    subcat_name = p.subcategory.name if p.subcategory else ""

    brand_names = [assoc.brand.name for assoc in p.brand_associations if assoc.brand]
    brand_str = " • ".join(brand_names) if brand_names else ""

    regular_price = float(p.regular_price or 0.0)
    discount_pct = int(p.discount_percent or 0)
    if discount_pct > 0:
        current_price = round(regular_price * (1 - discount_pct / 100), 2)
        old_price = regular_price
        discount_str = f"-{discount_pct}%"
    else:
        current_price = regular_price
        old_price = None
        discount_str = "0"

    qty = p.stock_quantity or 0
    total_sold = p.total_sold or 0
    total_pool = qty + total_sold
    sales_percentage = round((total_sold / total_pool) * 100) if total_pool > 0 else 0
    stock_status = "in_stock" if qty > 5 else ("low_stock" if qty > 0 else "out_of_stock")

    media = p.media or {}
    main_image = media.get("mainImage") or ""

    badge_data = (p.extra_data or {}).get("badge")
    badge_text = badge_data.get("text") if isinstance(badge_data, dict) else (p.badge or None)
    badge_type = badge_data.get("type") if isinstance(badge_data, dict) else "hot"

    specs_obj = p.specifications or {}
    card_specs = specs_obj.get("cardSpecs", [])

    assurance = p.assurance or []
    warranty = next((a.get("time") for a in assurance if isinstance(a, dict) and a.get("type") == "warranty"), None)
    guarantee = next((a.get("time") for a in assurance if isinstance(a, dict) and a.get("type") == "guarantee"), None)

    return {
        "id": p.id,
        "title": p.name,
        "name": p.slug or p.name,
        "brandPill": brand_str,
        "brand": brand_str,
        "category": cat_name,
        "subCategory": subcat_name,
        "mainImage": main_image,
        "badgeText": badge_text,
        "badgeType": badge_type,
        "cardSpecs": card_specs,
        "currentPrice": current_price,
        "oldPrice": old_price,
        "discount": discount_str,
        "salesPercentage": sales_percentage,
        "remaining": qty,
        "stock": stock_status,
        "soldThisMonth": total_sold,
        "reviewScore": float(p.rating_average or 0.0),
        "reviewCount": p.rating_count or 0,
        "warranty": warranty,
        "guarantee": guarantee,
        "gurrenty": guarantee,
        "fixed": p.to_fixed_variable_dict()["fixed"],
        "variable": p.to_fixed_variable_dict()["variable"]
    }


def format_best_seller(p: Product) -> Dict[str, Any]:
    """Homepage best seller card format."""
    regular = float(p.regular_price or 0.0)
    discount = int(p.discount_percent or 0)
    current_price = round(regular * (1 - discount / 100), 2) if discount > 0 else regular
    old_price = regular if discount > 0 else None

    qty = p.stock_quantity or 0
    total_sold = p.total_sold or 0
    pool = qty + total_sold
    sales_percentage = round((total_sold / pool) * 100) if pool > 0 else 0

    media = p.media or {}
    main_image = media.get("mainImage") or ""

    return {
        "id": p.id,
        "title": p.name,
        "name": p.slug or p.name,
        "mainImage": main_image,
        "currentPrice": current_price,
        "oldPrice": old_price,
        "salesPercentage": sales_percentage,
        "remaining": qty,
        "soldThisMonth": total_sold
    }


def format_top_rated(p: Product) -> Dict[str, Any]:
    """Homepage top rated card format."""
    regular = float(p.regular_price or 0.0)
    discount = int(p.discount_percent or 0)
    current_price = round(regular * (1 - discount / 100), 2) if discount > 0 else regular
    old_price = regular if discount > 0 else None

    media = p.media or {}
    main_image = media.get("mainImage") or ""

    return {
        "id": p.id,
        "title": p.name,
        "name": p.slug or p.name,
        "mainImage": main_image,
        "currentPrice": current_price,
        "oldPrice": old_price,
        "reviewScore": float(p.rating_average or 0.0),
        "reviewCount": p.rating_count or 0
    }


def format_admin_product(p: Product) -> Dict[str, Any]:
    """Formats a Product model for administrative catalog tables."""
    cat_name = p.category.name if p.category else "Uncategorized"
    subcat_name = p.subcategory.name if p.subcategory else "General"
    brand_names = [assoc.brand.name for assoc in p.brand_associations if assoc.brand]
    brand_str = " • ".join(brand_names) if brand_names else ""

    reg_price = float(p.regular_price or 0.0)
    disc_pct = float(p.discount_percent or 0.0)
    disc_price = round(reg_price * (1 - disc_pct / 100), 2) if disc_pct > 0 else reg_price

    qty = p.stock_quantity or 0
    status_str = "in_stock" if qty > 5 else ("low_stock" if qty > 0 else "out_of_stock")

    media = p.media or {}
    main_image = media.get("mainImage") or ""

    return {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "title": p.name,
        "slug": p.slug,
        "category": cat_name,
        "subCategory": subcat_name,
        "brand": brand_str,
        "brands": brand_names,
        "mainImage": main_image,
        "regularPrice": reg_price,
        "discountPercent": disc_pct,
        "discountedPrice": disc_price,
        "stockQuantity": qty,
        "stockStatus": status_str,
        "status": status_str,
        "totalSold": p.total_sold or 0,
        "rating": {
            "average": float(p.rating_average or 0.0),
            "count": p.rating_count or 0
        },
        "isActive": p.is_active,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
        "updatedAt": p.updated_at.isoformat() if p.updated_at else None,
        "fixed": p.to_fixed_variable_dict()["fixed"],
        "variable": p.to_fixed_variable_dict()["variable"]
    }


# ==============================================================================
# Query and Filter Engine
# ==============================================================================

def query_products(
    db: Session,
    page: int = 1,
    limit: int = 20,
    category: Optional[str] = None,
    subCategory: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    stock_status: Optional[str] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    admin_view: bool = False
) -> Tuple[List[Product], int]:
    """
    Executes a high-performance PostgreSQL query with filtering, search, sorting, and pagination.
    Returns (products_list, total_count).
    """
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.subcategory),
        joinedload(Product.brand_associations).joinedload(ProductBrand.brand)
    )

    if not admin_view:
        query = query.filter(Product.is_active == True)

    # 1. Category Filter (by slug or name)
    if category:
        cat_clean = category.strip().lower()
        query = query.join(Product.category).filter(
            or_(
                func.lower(Category.name) == cat_clean,
                Category.slug == cat_clean
            )
        )

    # 2. Subcategory Filter
    if subCategory:
        subcat_clean = subCategory.strip().lower()
        query = query.join(Product.subcategory).filter(
            or_(
                func.lower(Subcategory.name) == subcat_clean,
                Subcategory.slug == subcat_clean
            )
        )

    # 3. Brand Filter (supports comma-separated brands)
    if brand:
        brand_tokens = [b.strip().lower() for b in brand.split(",") if b.strip()]
        if brand_tokens:
            query = query.join(Product.brand_associations).join(ProductBrand.brand).filter(
                or_(*[
                    or_(func.lower(Brand.name) == b, Brand.slug == b)
                    for b in brand_tokens
                ])
            )

    # 4. Price Filter (evaluates effective current price after discount)
    effective_price = case(
        (Product.discount_percent > 0, Product.regular_price * (1.0 - Product.discount_percent / 100.0)),
        else_=Product.regular_price
    )
    if min_price is not None:
        query = query.filter(effective_price >= Decimal(str(min_price)))
    if max_price is not None:
        query = query.filter(effective_price <= Decimal(str(max_price)))

    # 5. Stock Status Filter
    if stock_status:
        st_clean = stock_status.strip().lower()
        if st_clean in ("in_stock", "instock"):
            query = query.filter(Product.stock_quantity > 5)
        elif st_clean in ("low_stock", "lowstock"):
            query = query.filter(and_(Product.stock_quantity > 0, Product.stock_quantity <= 5))
        elif st_clean in ("out_of_stock", "outofstock"):
            query = query.filter(Product.stock_quantity <= 0)

    # 6. Rating Filter
    if min_rating is not None:
        query = query.filter(Product.rating_average >= Decimal(str(min_rating)))

    # 7. Keyword Search across Product name, SKU, and specifications
    if search:
        search_token = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_token),
                Product.sku.ilike(search_token),
                Product.slug.ilike(search_token),
                cast(Product.specifications, Text).ilike(search_token)
            )
        )

    # Get total count before pagination
    total_count = query.distinct().count()

    # 8. Sorting
    if sort == "price_asc":
        query = query.order_by(asc(effective_price))
    elif sort == "price_desc":
        query = query.order_by(desc(effective_price))
    elif sort == "rating":
        query = query.order_by(desc(Product.rating_average), desc(Product.rating_count))
    elif sort in ("popular", "sales", "bestseller"):
        query = query.order_by(desc(Product.total_sold))
    elif sort == "newest":
        query = query.order_by(desc(Product.created_at))
    else:
        # Default order by ID or creation
        query = query.order_by(desc(Product.created_at), desc(Product.total_sold))

    # 9. Pagination
    if limit and limit > 0:
        offset = max(0, (page - 1) * limit)
        query = query.offset(offset).limit(limit)

    products = query.distinct().all()
    return products, total_count
