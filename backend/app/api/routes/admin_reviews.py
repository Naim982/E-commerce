"""
Administrative Review Moderation and Product FAQ Management Endpoints.
Guarded by require_admin dependency.
Handles customer testimonial verification, approval/rejection workflows,
rating recalculations, and administrative FAQ answers.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc, func
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.product import Product, Review, ProductFAQ
from app.models.order import Order, OrderItem

router = APIRouter(tags=["Admin Reviews & FAQs"])


class AdminReviewUpdate(BaseModel):
    status: Optional[str] = None
    productId: Optional[str] = None
    action: Optional[str] = None


class AdminFAQUpdate(BaseModel):
    answer: Optional[str] = None
    isPublished: Optional[bool] = None
    question: Optional[str] = None


def recalculate_product_ratings(db: Session, product_id: str) -> None:
    """Recalculates rating_average and rating_count on Product based solely on approved reviews."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return

    approved_reviews = db.query(Review).filter(
        Review.product_id == product.id,
        Review.status == "approved"
    ).all()

    if approved_reviews:
        ratings = [r.rating for r in approved_reviews]
        product.rating_average = Decimal(str(round(sum(ratings) / len(ratings), 2)))
        product.rating_count = len(ratings)
    else:
        product.rating_average = Decimal("0.00")
        product.rating_count = 0

    db.commit()


# ==============================================================================
# 1. ADMIN REVIEWS MANAGEMENT
# ==============================================================================

@router.get("/admin/reviews", summary="List and moderate customer reviews")
def list_admin_reviews(
    status: Optional[str] = Query(None),
    rating: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns reviews joined with product data, verification status, and moderation metrics.
    """
    query = db.query(Review).options(joinedload(Review.product))

    if status and status.lower() not in ("all", ""):
        query = query.filter(func.lower(Review.status) == status.strip().lower())

    if rating:
        query = query.filter(Review.rating == rating)

    if search and search.strip():
        token = f"%{search.strip().lower()}%"
        query = query.join(Review.product).filter(
            or_(
                func.lower(Review.user_name).ilike(token),
                func.lower(Review.title).ilike(token),
                func.lower(Review.comment).ilike(token),
                func.lower(Product.name).ilike(token)
            )
        )

    reviews = query.order_by(desc(Review.created_at)).all()

    # Calculate overall metrics
    all_reviews = db.query(Review).all()
    tot_cnt = len(all_reviews)
    approved_cnt = sum(1 for r in all_reviews if (r.status or "").lower() == "approved")
    pending_cnt = sum(1 for r in all_reviews if (r.status or "").lower() == "pending")
    avg_rating = round(sum(r.rating for r in all_reviews) / tot_cnt, 2) if tot_cnt > 0 else 5.0

    # Format review records matching frontend AdminEnd/Reviews/Reviews.js expectations
    formatted_reviews = []
    for r in reviews:
        # Check verified purchase: user has completed order containing this product
        is_verified = False
        if r.user_id:
            order_count = db.query(OrderItem).join(Order).filter(
                Order.user_id == r.user_id,
                OrderItem.product_id == r.product_id,
                Order.status.in_(["pending", "processing", "shipped", "delivered"])
            ).count()
            is_verified = order_count > 0

        prod = r.product
        prod_name = prod.name if prod else "Hardware Product"
        cat_name = prod.category.name if (prod and prod.category) else "Components"

        formatted_reviews.append({
            "id": r.id,
            "productId": r.product_id,
            "productName": prod_name,
            "category": cat_name,
            "userName": r.user_name or "Verified Customer",
            "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "2026-01-01",
            "rating": r.rating,
            "title": r.title or "",
            "description": r.comment or "",
            "status": (r.status or "approved").lower(),
            "verifiedPurchase": is_verified
        })

    return {
        "success": True,
        "reviews": formatted_reviews,
        "total": len(formatted_reviews),
        "metrics": {
            "total": tot_cnt,
            "avgRating": avg_rating,
            "approved": approved_cnt,
            "pending": pending_cnt
        }
    }


@router.patch("/admin/reviews/{review_id}", summary="Update review approval status")
def update_admin_review(
    review_id: int,
    payload: AdminReviewUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates review moderation status ('approved', 'rejected', 'pending') and recalculates score."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review #{review_id} not found."
        )

    if payload.status:
        new_status = payload.status.strip().lower()
        if new_status not in ("approved", "rejected", "pending"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid review status '{payload.status}'. Allowed: approved, rejected, pending."
            )
        review.status = new_status

    db.commit()
    db.refresh(review)

    # Recalculate average rating & count on the product
    recalculate_product_ratings(db, review.product_id)

    return {
        "success": True,
        "message": f"Review #{review_id} updated to status '{review.status}' successfully.",
        "reviewId": review.id,
        "status": review.status
    }


@router.delete("/admin/reviews/{review_id}", summary="Delete customer review")
def delete_admin_review(
    review_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Permanently deletes a customer review and recalculates product rating metrics."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review #{review_id} not found."
        )

    prod_id = review.product_id
    db.delete(review)
    db.commit()

    recalculate_product_ratings(db, prod_id)

    return {
        "success": True,
        "message": f"Review #{review_id} deleted successfully."
    }


# ==============================================================================
# 2. ADMIN PRODUCT FAQS MANAGEMENT
# ==============================================================================

@router.get("/admin/faqs", summary="List community product questions")
def list_admin_faqs(
    product_id: Optional[str] = Query(None),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves all community product questions for administrative answering."""
    query = db.query(ProductFAQ).options(joinedload(ProductFAQ.product))
    if product_id:
        query = query.filter(ProductFAQ.product_id == product_id)

    faqs = query.order_by(desc(ProductFAQ.created_at)).all()

    formatted_faqs = []
    for f in faqs:
        formatted_faqs.append({
            "id": f.id,
            "productId": f.product_id,
            "productName": f.product.name if f.product else "Product",
            "question": f.question,
            "answer": f.answer or "",
            "askedBy": f.asked_by or "Customer",
            "answeredBy": f.answered_by or "",
            "isPublished": f.is_published,
            "createdAt": f.created_at.isoformat() if f.created_at else ""
        })

    return {
        "success": True,
        "faqs": formatted_faqs,
        "total": len(formatted_faqs)
    }


@router.patch("/admin/faqs/{faq_id}", summary="Answer or publish product FAQ")
def update_admin_faq(
    faq_id: int,
    payload: AdminFAQUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Answers a community question and sets publication visibility."""
    faq = db.query(ProductFAQ).filter(ProductFAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product FAQ #{faq_id} not found."
        )

    if payload.question is not None:
        faq.question = payload.question.strip()

    if payload.answer is not None:
        faq.answer = payload.answer.strip()
        faq.answered_by = current_admin.name or "LUMEN Technical Staff"

    if payload.isPublished is not None:
        faq.is_published = payload.isPublished

    db.commit()
    db.refresh(faq)

    return {
        "success": True,
        "message": f"FAQ #{faq_id} updated successfully.",
        "faq": {
            "id": faq.id,
            "productId": faq.product_id,
            "question": faq.question,
            "answer": faq.answer,
            "isPublished": faq.is_published
        }
    }
