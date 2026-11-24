"""Admin Product, Category, and Inventory Management API Endpoints."""

import time
from typing import Dict, Any, Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc, func
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.product import Product, ProductVariant, VariantOption
from app.models.category import Category, Subcategory
from app.models.brand import Brand, ProductBrand
from app.schemas.product import (
    ProductCreateAdmin,
    ProductUpdateAdmin,
    CategoryCreateAdmin,
    CategoryUpdateAdmin,
    StockUpdateAdmin
)
from app.services.product_service import (
    format_product_detail,
    format_admin_product,
    query_products,
    slugify
)

router = APIRouter(tags=["Admin Products"])


# ==============================================================================
# 1. ADMIN PRODUCTS MANAGEMENT
# ==============================================================================

@router.get("/admin/products", summary="List products for administrative catalog")
def get_admin_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort: Optional[str] = Query("name_asc"),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns paginated product catalog for administrative tables."""
    # Translate sort
    sort_mapped = None
    if sort == "price_asc":
        sort_mapped = "price_asc"
    elif sort == "price_desc":
        sort_mapped = "price_desc"
    elif sort in ("name_asc", "newest"):
        sort_mapped = "newest"

    products, total = query_products(
        db=db,
        page=page,
        limit=limit,
        category=category if category and category.lower() != "all" else None,
        stock_status=status if status and status.lower() != "all" else None,
        search=search,
        sort=sort_mapped,
        admin_view=True
    )

    categories = [c.name for c in db.query(Category).order_by(Category.name.asc()).all()]
    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    return {
        "success": True,
        "products": [format_admin_product(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "categories": categories
    }


@router.get("/admin/products/{product_id}", summary="Get product details for admin editor")
def get_admin_product_by_id(
    product_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves full product record for administrative editing."""
    product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    return {
        "success": True,
        "product": format_admin_product(product)
    }


@router.post("/admin/products", status_code=status.HTTP_201_CREATED, summary="Create a new product")
def create_admin_product(
    payload: Dict[str, Any],
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Creates a new product record persisting core data and JSONB specifications."""
    fixed = payload.get("fixed") or {}
    variable = payload.get("variable") or {}

    # Extract ID and names
    name = (fixed.get("name") or payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product name is required.")

    prod_id = (fixed.get("id") or payload.get("id") or f"prod-{slugify(name)[:20]}").strip()
    sku = (fixed.get("sku") or payload.get("sku") or f"SKU-{prod_id.upper()}").strip()
    slug = (fixed.get("slug") or payload.get("slug") or slugify(name)).strip()

    # Check for duplicate ID or SKU
    existing = db.query(Product).filter((Product.id == prod_id) | (Product.sku == sku)).first()
    if existing:
        prod_id = f"{prod_id}-{int(time.time())}"
        sku = f"{sku}-NEW"

    # Category & Subcategory
    cat_name = (fixed.get("category") or payload.get("category") or "Uncategorized").strip()
    cat = db.query(Category).filter(func.lower(Category.name) == cat_name.lower()).first()
    if not cat:
        cat = Category(name=cat_name, slug=slugify(cat_name), is_active=True)
        db.add(cat)
        db.flush()

    subcat_name = (fixed.get("subCategory") or payload.get("subCategory") or "General").strip()
    subcat = db.query(Subcategory).filter(
        Subcategory.category_id == cat.id,
        func.lower(Subcategory.name) == subcat_name.lower()
    ).first()
    if not subcat:
        subcat = Subcategory(category_id=cat.id, name=subcat_name, slug=slugify(f"{cat.slug}-{subcat_name}"), is_active=True)
        db.add(subcat)
        db.flush()

    # Pricing & Stock
    price_obj = variable.get("price") or {}
    regular_price = Decimal(str(price_obj.get("regular") or payload.get("regularPrice") or payload.get("currentPrice") or 0.0))
    discount_percent = Decimal(str(price_obj.get("discount") or payload.get("discountPercent") or payload.get("discount") or 0.0))

    stock_obj = variable.get("stock") or {}
    stock_qty = int(stock_obj.get("quantity") or payload.get("stockQuantity") or payload.get("quantity") or 0)

    badge_data = variable.get("badge") or payload.get("badge")
    badge_text = badge_data.get("text") if isinstance(badge_data, dict) else (str(badge_data) if badge_data else None)

    # JSONB specs
    media_json = fixed.get("media") or payload.get("media") or {
        "mainImage": payload.get("mainImage", ""),
        "thumbnails": payload.get("thumbnails", [])
    }
    specs_json = fixed.get("specifications") or payload.get("specifications") or {
        "cardSpecs": payload.get("cardSpecs", []),
        "quickOverview": [],
        "specs": []
    }
    desc_json = fixed.get("description") or payload.get("description") or {
        "heading": name,
        "paragraphs": [payload.get("descriptionText", "")],
        "boxContents": [name]
    }
    assurance_json = fixed.get("assurance") or payload.get("assurance") or [
        {"type": "warranty", "time": "1 Year"},
        {"type": "guarantee", "time": "14 Days"}
    ]
    var_modifiers = variable.get("variants") or payload.get("variantModifiers") or []

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
        stock_quantity=stock_qty,
        total_sold=0,
        rating_average=Decimal("5.00"),
        rating_count=0,
        media=media_json,
        specifications=specs_json,
        description=desc_json,
        assurance=assurance_json,
        variant_modifiers=var_modifiers,
        extra_data={"badge": badge_data},
        is_active=True
    )
    db.add(product)
    db.flush()

    # Brand associations
    brands_raw = fixed.get("brand") or payload.get("brand") or []
    if isinstance(brands_raw, str):
        brands_list = [b.strip() for b in brands_raw.split("•") if b.strip()]
    elif isinstance(brands_raw, list):
        brands_list = [str(b).strip() for b in brands_raw if str(b).strip()]
    else:
        brands_list = []

    for b_name in brands_list:
        brand = db.query(Brand).filter(func.lower(Brand.name) == b_name.lower()).first()
        if not brand:
            brand = Brand(name=b_name, slug=slugify(b_name), is_active=True)
            db.add(brand)
            db.flush()
        pb = ProductBrand(product_id=product.id, brand_id=brand.id)
        db.add(pb)

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": "Product created successfully",
        "product": format_admin_product(product)
    }


@router.put("/admin/products/{product_id}", summary="Update an existing product")
def update_admin_product(
    product_id: str,
    payload: Dict[str, Any],
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates product record attributes, pricing, stock, category, and JSONB fields."""
    product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    fixed = payload.get("fixed") or {}
    variable = payload.get("variable") or {}

    # Update basic fields
    name = (fixed.get("name") or payload.get("name"))
    if name:
        product.name = name.strip()

    sku = (fixed.get("sku") or payload.get("sku"))
    if sku:
        product.sku = sku.strip()

    # Category
    cat_name = (fixed.get("category") or payload.get("category"))
    if cat_name:
        cat = db.query(Category).filter(func.lower(Category.name) == cat_name.strip().lower()).first()
        if not cat:
            cat = Category(name=cat_name.strip(), slug=slugify(cat_name.strip()), is_active=True)
            db.add(cat)
            db.flush()
        product.category_id = cat.id

    # Subcategory
    subcat_name = (fixed.get("subCategory") or payload.get("subCategory"))
    if subcat_name and product.category_id:
        subcat = db.query(Subcategory).filter(
            Subcategory.category_id == product.category_id,
            func.lower(Subcategory.name) == subcat_name.strip().lower()
        ).first()
        if not subcat:
            subcat = Subcategory(category_id=product.category_id, name=subcat_name.strip(), slug=slugify(subcat_name.strip()), is_active=True)
            db.add(subcat)
            db.flush()
        product.subcategory_id = subcat.id

    # Pricing
    price_obj = variable.get("price") or {}
    if "regular" in price_obj:
        product.regular_price = Decimal(str(price_obj["regular"]))
    elif "regularPrice" in payload:
        product.regular_price = Decimal(str(payload["regularPrice"]))
    elif "currentPrice" in payload:
        product.regular_price = Decimal(str(payload["currentPrice"]))

    if "discount" in price_obj:
        product.discount_percent = Decimal(str(price_obj["discount"]))
    elif "discountPercent" in payload:
        product.discount_percent = Decimal(str(payload["discountPercent"]))
    elif "discount" in payload:
        product.discount_percent = Decimal(str(payload["discount"]))

    # Stock
    stock_obj = variable.get("stock") or {}
    if "quantity" in stock_obj:
        product.stock_quantity = int(stock_obj["quantity"])
    elif "stockQuantity" in payload:
        product.stock_quantity = int(payload["stockQuantity"])
    elif "quantity" in payload:
        product.stock_quantity = int(payload["quantity"])

    # Badge
    badge_data = variable.get("badge") or payload.get("badge")
    if badge_data is not None:
        badge_text = badge_data.get("text") if isinstance(badge_data, dict) else (str(badge_data) if badge_data else None)
        product.badge = badge_text
        if not product.extra_data:
            product.extra_data = {}
        product.extra_data["badge"] = badge_data

    # Media & Specifications
    if "media" in fixed:
        product.media = fixed["media"]
    elif "media" in payload:
        product.media = payload["media"]

    if "specifications" in fixed:
        product.specifications = fixed["specifications"]
    elif "specifications" in payload:
        product.specifications = payload["specifications"]

    if "description" in fixed:
        product.description = fixed["description"]
    elif "description" in payload:
        product.description = payload["description"]

    # Active status
    if "isActive" in payload:
        product.is_active = bool(payload["isActive"])

    # Update Brands
    brands_raw = fixed.get("brand") or payload.get("brand")
    if brands_raw is not None:
        if isinstance(brands_raw, str):
            brands_list = [b.strip() for b in brands_raw.split("•") if b.strip()]
        elif isinstance(brands_raw, list):
            brands_list = [str(b).strip() for b in brands_raw if str(b).strip()]
        else:
            brands_list = []

        db.query(ProductBrand).filter(ProductBrand.product_id == product.id).delete()
        for b_name in brands_list:
            brand = db.query(Brand).filter(func.lower(Brand.name) == b_name.lower()).first()
            if not brand:
                brand = Brand(name=b_name, slug=slugify(b_name), is_active=True)
                db.add(brand)
                db.flush()
            pb = ProductBrand(product_id=product.id, brand_id=brand.id)
            db.add(pb)

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": "Product updated successfully",
        "product": format_admin_product(product)
    }


@router.delete("/admin/products/{product_id}", summary="Delete or deactivate product")
def delete_admin_product(
    product_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deletes or deactivates product from catalog."""
    product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    db.delete(product)
    db.commit()

    return {
        "success": True,
        "message": f"Product {product_id} deleted successfully"
    }


# ==============================================================================
# 2. CATEGORY MANAGEMENT
# ==============================================================================

@router.get("/admin/categories", summary="List categories with subcategories and product counts")
def get_admin_categories(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns categories with live product count and associated subcategories."""
    categories = db.query(Category).options(joinedload(Category.subcategories)).order_by(Category.name.asc()).all()

    category_list = []
    for c in categories:
        prod_count = db.query(Product).filter(Product.category_id == c.id).count()
        category_list.append({
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "icon": c.icon,
            "image": c.image,
            "productCount": prod_count,
            "subcategories": [s.name for s in c.subcategories],
            "active": c.is_active
        })

    return {
        "success": True,
        "categories": category_list
    }


@router.post("/admin/categories", status_code=status.HTTP_201_CREATED, summary="Create a new category")
def create_admin_category(
    payload: Dict[str, Any],
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Creates a new category entity and optionally its subcategories."""
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name is required.")

    existing = db.query(Category).filter(func.lower(Category.name) == name.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Category '{name}' already exists.")

    slug = payload.get("slug") or slugify(name)
    category = Category(
        name=name,
        slug=slug,
        icon=payload.get("icon"),
        image=payload.get("image"),
        is_active=True
    )
    db.add(category)
    db.flush()

    # Add subcategories if provided
    subcats = payload.get("subcategories") or []
    for s_name in subcats:
        if isinstance(s_name, str) and s_name.strip():
            sc = Subcategory(
                category_id=category.id,
                name=s_name.strip(),
                slug=slugify(f"{slug}-{s_name.strip()}"),
                is_active=True
            )
            db.add(sc)

    db.commit()
    db.refresh(category)

    return {
        "success": True,
        "message": f"Category '{name}' registered.",
        "category": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "productCount": 0,
            "active": category.is_active
        }
    }


@router.put("/admin/categories/{name}", summary="Update or rename category")
def update_admin_category(
    name: str,
    payload: Dict[str, Any],
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates a category and renames it across associated records."""
    category = db.query(Category).filter(
        or_(func.lower(Category.name) == name.lower(), Category.slug == name.lower())
    ).first()

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category '{name}' not found.")

    new_name = (payload.get("name") or "").strip()
    if new_name:
        category.name = new_name
        category.slug = slugify(new_name)

    if "icon" in payload:
        category.icon = payload["icon"]
    if "image" in payload:
        category.image = payload["image"]
    if "active" in payload:
        category.is_active = bool(payload["active"])

    # Update subcategories if provided
    if "subcategories" in payload and isinstance(payload["subcategories"], list):
        existing_subcats = {s.name.lower(): s for s in category.subcategories}
        for s_name in payload["subcategories"]:
            if isinstance(s_name, str) and s_name.strip():
                if s_name.strip().lower() not in existing_subcats:
                    sc = Subcategory(
                        category_id=category.id,
                        name=s_name.strip(),
                        slug=slugify(f"{category.slug}-{s_name.strip()}"),
                        is_active=True
                    )
                    db.add(sc)

    db.commit()

    return {
        "success": True,
        "message": f"Category updated successfully."
    }


@router.delete("/admin/categories/{name}", summary="Delete a category")
def delete_admin_category(
    name: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deletes a category."""
    category = db.query(Category).filter(
        or_(func.lower(Category.name) == name.lower(), Category.slug == name.lower())
    ).first()

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category '{name}' not found.")

    db.delete(category)
    db.commit()

    return {
        "success": True,
        "message": f"Category '{name}' deleted successfully"
    }


# ==============================================================================
# 3. INVENTORY MANAGEMENT
# ==============================================================================

@router.get("/admin/inventory", summary="Get inventory items and stock statistics")
def get_admin_inventory(
    search: Optional[str] = Query(None),
    filter: Optional[str] = Query(None),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns inventory status with stock summary counters."""
    products = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.brand_associations).joinedload(ProductBrand.brand)
    ).order_by(Product.stock_quantity.asc()).all()

    low_stock_thresh = 5
    inventory_items = []
    total_qty = 0
    total_value = 0.0
    in_stock_count = 0
    low_stock_count = 0
    out_of_stock_count = 0

    for p in products:
        qty = p.stock_quantity or 0
        reg_price = float(p.regular_price or 0.0)
        disc_pct = float(p.discount_percent or 0.0)
        price = round(reg_price * (1 - disc_pct / 100), 2) if disc_pct > 0 else reg_price

        total_qty += qty
        total_value += (qty * price)

        if qty <= 0:
            stk_status = "out_of_stock"
            out_of_stock_count += 1
        elif qty <= low_stock_thresh:
            stk_status = "low_stock"
            low_stock_count += 1
        else:
            stk_status = "in_stock"
            in_stock_count += 1

        # Search filter
        if search:
            s_clean = search.strip().lower()
            if s_clean not in p.name.lower() and s_clean not in p.sku.lower() and s_clean not in p.id.lower():
                continue

        # Stock status filter
        if filter and filter != "all":
            if filter == "low_stock" and stk_status != "low_stock":
                continue
            elif filter == "out_of_stock" and stk_status != "out_of_stock":
                continue
            elif filter == "in_stock" and stk_status != "in_stock":
                continue

        brand_names = [assoc.brand.name for assoc in p.brand_associations if assoc.brand]
        brand_str = " • ".join(brand_names) if brand_names else ""
        media = p.media or {}

        inventory_items.append({
            "id": p.id,
            "name": p.name,
            "category": p.category.name if p.category else "Uncategorized",
            "brand": brand_str,
            "sku": p.sku,
            "quantity": qty,
            "stockQuantity": qty,
            "price": price,
            "status": stk_status,
            "stockStatus": stk_status,
            "lowStockThreshold": low_stock_thresh,
            "mainImage": media.get("mainImage", "")
        })

    return {
        "success": True,
        "inventory": inventory_items,
        "summary": {
            "totalProducts": len(products),
            "totalUnits": total_qty,
            "totalValuation": round(total_value, 2),
            "inStockCount": in_stock_count,
            "lowStockCount": low_stock_count,
            "outOfStockCount": out_of_stock_count
        }
    }


@router.patch("/admin/inventory/{product_id}", summary="Update product inventory stock")
def update_admin_stock(
    product_id: str,
    payload: Dict[str, Any],
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates product stock quantity."""
    product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    qty = payload.get("quantity") if payload.get("quantity") is not None else payload.get("stockQuantity")
    if qty is not None:
        product.stock_quantity = max(0, int(qty))

    # Variant modifiers update if provided
    var_mods = payload.get("variantModifiers") or payload.get("variantStockAndPriceModifiers")
    if var_mods is not None:
        product.variant_modifiers = var_mods

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": "Inventory updated successfully",
        "stock": {
            "quantity": product.stock_quantity,
            "stockQuantity": product.stock_quantity
        }
    }
