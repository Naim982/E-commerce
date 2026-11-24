"""Public Product Catalog and Exploration API Endpoints."""

from typing import Dict, Any, Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.product import Product, Review, ProductFAQ
from app.models.category import Category
from app.models.user import User
from app.schemas.product import ReviewCreate, FAQCreate
from app.services.product_service import (
    format_product_detail,
    format_product_card,
    format_best_seller,
    format_top_rated,
    query_products
)

router = APIRouter(tags=["Products"])


# ==============================================================================
# 1. HOMEPAGE & SHOPPAGE AGGREGATIONS
# ==============================================================================

@router.get("/products/homepage-products", summary="Get curated homepage products and featured slices")
def get_homepage_products(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns curated product groups for the homepage:
    - group1: Featured PC & Laptop components (up to 9 items)
    - group2: Accessories & Monitored peripherals (up to 9 items)
    - bestSellers: Highest sales volume items
    - topRated: Highest review rating items
    """
    # Best Sellers
    best_sellers_query = db.query(Product).filter(Product.is_active == True).order_by(Product.total_sold.desc()).limit(6).all()
    best_sellers = [format_best_seller(p) for p in best_sellers_query]

    # Top Rated
    top_rated_query = db.query(Product).filter(Product.is_active == True).order_by(Product.rating_average.desc(), Product.rating_count.desc()).limit(6).all()
    top_rated = [format_top_rated(p) for p in top_rated_query]

    # Group 1 & 2 (General Catalog Slices)
    all_active = db.query(Product).filter(Product.is_active == True).order_by(Product.id.asc()).all()
    group1 = [format_product_card(p) for p in all_active[:9]]
    group2 = [format_product_card(p) for p in all_active[9:18]]

    return {
        "products": {
            "group1": group1,
            "group2": group2
        },
        "bestSellers": best_sellers,
        "topRated": top_rated
    }


@router.get("/products/shoppage-products", summary="Get all shop card products for catalog grid")
def get_shoppage_products(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns full catalog array formatted as product cards for Shoppage.js.
    Matches frontend expectation where result.data is an array.
    """
    products, _ = query_products(db, page=1, limit=500)
    return [format_product_card(p) for p in products]


# ==============================================================================
# 2. CATALOG QUERY & FILTERING
# ==============================================================================

@router.get("/products", summary="Filter, search, sort, and paginate product catalog")
def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=200, description="Items per page"),
    category: Optional[str] = Query(None, description="Category name or slug"),
    subCategory: Optional[str] = Query(None, description="Subcategory name or slug"),
    brand: Optional[str] = Query(None, description="Brand name or comma-separated brands"),
    minPrice: Optional[float] = Query(None, description="Minimum price (BDT)"),
    maxPrice: Optional[float] = Query(None, description="Maximum price (BDT)"),
    stockStatus: Optional[str] = Query(None, description="in_stock, low_stock, out_of_stock"),
    rating: Optional[float] = Query(None, description="Minimum star rating"),
    sort: Optional[str] = Query(None, description="price_asc, price_desc, rating, newest, popular"),
    search: Optional[str] = Query(None, description="Keyword search string"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Comprehensive catalog query endpoint supporting multi-attribute filtering,
    full-text keyword search across name/SKU/specs, sorting, and pagination.
    """
    products, total = query_products(
        db=db,
        page=page,
        limit=limit,
        category=category,
        subCategory=subCategory,
        brand=brand,
        min_price=minPrice,
        max_price=maxPrice,
        stock_status=stockStatus,
        min_rating=rating,
        search=search,
        sort=sort
    )

    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    return {
        "success": True,
        "products": [format_product_card(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages
    }


# ==============================================================================
# 3. SINGLE PRODUCT & SIMILAR PRODUCTS
# ==============================================================================

@router.get("/products/{product_id}", summary="Get detailed product specifications and variants")
def get_product_details(product_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns full product specifications, variants, pricing, reviews, and FAQs."""
    product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID or slug '{product_id}' not found."
        )

    return format_product_detail(product)


@router.get("/products/{product_id}/similar", summary="Get similar products in same category")
def get_similar_products(product_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns up to 5 similar products from the same category or subcategory."""
    target_product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()

    if not target_product:
        return {"success": False, "products": []}

    query = db.query(Product).filter(
        Product.id != target_product.id,
        Product.is_active == True
    )

    if target_product.subcategory_id:
        same_sub = query.filter(Product.subcategory_id == target_product.subcategory_id).limit(5).all()
        if len(same_sub) >= 3:
            return {"success": True, "products": [format_product_card(p) for p in same_sub]}

    if target_product.category_id:
        same_cat = query.filter(Product.category_id == target_product.category_id).limit(5).all()
        return {"success": True, "products": [format_product_card(p) for p in same_cat]}

    fallback = query.limit(5).all()
    return {"success": True, "products": [format_product_card(p) for p in fallback]}


# ==============================================================================
# 4. REVIEWS & FAQS SUBMISSION
# ==============================================================================

@router.post("/products/{product_id}/reviews", summary="Submit a product review")
def submit_review(
    product_id: str,
    payload: ReviewCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Submits a customer rating and review for a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    user_id = None
    if current_user:
        user_id = current_user.id
    elif payload.userId and db.query(User).filter(User.id == payload.userId).first():
        user_id = payload.userId

    user_name = current_user.name if current_user else (payload.userName or payload.author or "Verified Customer")
    comment = payload.description or payload.comment or "Great product."

    review = Review(
        product_id=product.id,
        user_id=user_id,
        user_name=user_name,
        rating=payload.stars,
        title=payload.title,
        comment=comment,
        status="approved"
    )
    db.add(review)

    # Recalculate average rating & count
    all_reviews = db.query(Review).filter(Review.product_id == product.id, Review.status == "approved").all()
    ratings = [r.rating for r in all_reviews] + [payload.stars]
    product.rating_average = Decimal(str(round(sum(ratings) / len(ratings), 2)))
    product.rating_count = len(ratings)

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "product": format_product_detail(product)
    }


@router.post("/products/{product_id}/faq", summary="Submit a product FAQ question")
def submit_faq(
    product_id: str,
    payload: FAQCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Submits a community FAQ question for a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    user_id = current_user.id if current_user else None
    asked_by = current_user.name if current_user else payload.askedBy or "Customer"

    faq = ProductFAQ(
        product_id=product.id,
        user_id=user_id,
        question=payload.question,
        asked_by=asked_by,
        is_published=True
    )
    db.add(faq)
    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "product": format_product_detail(product)
    }
