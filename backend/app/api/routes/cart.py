"""
Customer Cart and Wishlist API Endpoints.
Persists items into PostgreSQL 'cart_items' and 'wishlist_items' tables.
Provides live stock and price verification, subtotal calculations, and item migrations.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user, verify_user_access
from app.models.user import User
from app.models.cart import CartItem, WishlistItem
from app.models.product import Product
from app.schemas.cart import CartItemAdd, CartItemUpdate, WishlistAdd
from app.services.pricing_service import calculate_product_unit_price

router = APIRouter(tags=["Cart & Wishlist"])


# ==============================================================================
# 1. CART MANAGEMENT ENDPOINTS
# ==============================================================================

@router.get("/users/{user_id}/cart", summary="Get customer shopping cart with live prices and stock")
def get_customer_cart(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves all items in the customer's active shopping cart with database-verified pricing."""
    verify_user_access(user_id, current_user)

    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    cart_list = []
    cart_subtotal = 0.0

    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        variants = item.selected_variant or []
        unit_price = float(calculate_product_unit_price(product, variants))
        item_total = round(unit_price * item.quantity, 2)
        cart_subtotal += item_total

        cart_list.append({
            "id": product.id,
            "productId": product.id,
            "quantity": item.quantity,
            "variant": variants,
            "selectedVariant": variants,
            "unitPrice": unit_price,
            "totalPrice": item_total,
            "productName": product.name,
            "sku": product.sku,
            "mainImage": (product.media or {}).get("mainImage", ""),
            "availableStock": product.stock_quantity,
            "inStock": product.stock_quantity >= item.quantity
        })

    return {
        "success": True,
        "cartList": cart_list,
        "subtotal": round(cart_subtotal, 2)
    }


@router.post("/users/{user_id}/cart", summary="Add a product to customer shopping cart")
def add_to_customer_cart(
    user_id: str,
    payload: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Adds a product and chosen variants to the customer's active cart."""
    verify_user_access(user_id, current_user)

    product = db.query(Product).filter(Product.id == payload.productId).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{payload.productId}' not found."
        )

    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product '{product.name}' is currently unavailable for purchase."
        )

    # Check stock availability
    if product.stock_quantity < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({payload.quantity}) exceeds available stock ({product.stock_quantity})."
        )

    # Determine variants selected
    variants = payload.variant or []
    if not variants and payload.selectedVariant:
        variants = [payload.selectedVariant]

    # Find existing item in cart
    existing_item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == payload.productId
    ).first()

    if existing_item:
        existing_item.quantity = payload.quantity
        if variants is not None:
            existing_item.selected_variant = variants
    else:
        new_item = CartItem(
            user_id=user_id,
            product_id=payload.productId,
            quantity=payload.quantity,
            selected_variant=variants
        )
        db.add(new_item)

    db.commit()

    # Re-fetch fresh user state
    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": f"Added '{product.name}' to cart.",
        "user": user.to_dict() if user else None
    }


@router.patch("/users/{user_id}/cart/{product_id}", summary="Update cart item quantity")
@router.put("/users/{user_id}/cart/{product_id}", summary="Update cart item quantity or variant")
def update_cart_item(
    user_id: str,
    product_id: str,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates quantity or variant options for an item in the customer's cart."""
    verify_user_access(user_id, current_user)

    item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item for product '{product_id}' not found."
        )

    product = db.query(Product).filter(Product.id == product_id).first()
    if payload.quantity is not None:
        if product and product.stock_quantity < payload.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity ({payload.quantity}) exceeds available stock ({product.stock_quantity})."
            )
        item.quantity = payload.quantity

    if payload.variant is not None:
        item.selected_variant = payload.variant
    elif payload.selectedVariant is not None:
        item.selected_variant = [payload.selectedVariant]

    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": "Cart item updated.",
        "user": user.to_dict() if user else None
    }


@router.delete("/users/{user_id}/cart/{product_id}", summary="Remove product from cart")
def remove_from_cart(
    user_id: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Removes a product line item from the customer's cart."""
    verify_user_access(user_id, current_user)

    item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id
    ).first()

    if item:
        db.delete(item)
        db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": "Item removed from cart.",
        "user": user.to_dict() if user else None
    }


@router.post("/users/{user_id}/cart/{product_id}/move-to-wishlist", summary="Move cart item to wishlist")
def move_cart_item_to_wishlist(
    user_id: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Moves an item from the customer's cart into their saved wishlist."""
    verify_user_access(user_id, current_user)

    cart_item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in shopping cart."
        )

    # Ensure in wishlist
    existing_wishlist = db.query(WishlistItem).filter(
        WishlistItem.user_id == user_id,
        WishlistItem.product_id == product_id
    ).first()

    if not existing_wishlist:
        db.add(WishlistItem(user_id=user_id, product_id=product_id))

    db.delete(cart_item)
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": "Item moved to wishlist.",
        "user": user.to_dict() if user else None
    }


@router.delete("/users/{user_id}/cart", summary="Clear customer cart")
def clear_customer_cart(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deletes all items from the customer's shopping cart."""
    verify_user_access(user_id, current_user)

    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": "Cart cleared successfully.",
        "user": user.to_dict() if user else None
    }


# ==============================================================================
# 2. WISHLIST MANAGEMENT ENDPOINTS
# ==============================================================================

@router.get("/users/{user_id}/wishlist", summary="Get customer saved wishlist")
def get_customer_wishlist(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves all product IDs currently saved in customer wishlist."""
    verify_user_access(user_id, current_user)

    items = db.query(WishlistItem).filter(WishlistItem.user_id == user_id).all()
    wishlist_ids = [item.product_id for item in items]

    return {
        "success": True,
        "wishlist": wishlist_ids
    }


@router.post("/users/{user_id}/wishlist", summary="Add product to customer wishlist")
def add_to_customer_wishlist(
    user_id: str,
    payload: WishlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Saves a product into the customer's wishlist."""
    verify_user_access(user_id, current_user)

    product = db.query(Product).filter(Product.id == payload.productId).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{payload.productId}' not found."
        )

    existing = db.query(WishlistItem).filter(
        WishlistItem.user_id == user_id,
        WishlistItem.product_id == payload.productId
    ).first()

    if not existing:
        db.add(WishlistItem(user_id=user_id, product_id=payload.productId))
        db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": f"Added '{product.name}' to wishlist.",
        "user": user.to_dict() if user else None
    }


@router.delete("/users/{user_id}/wishlist/{product_id}", summary="Remove product from wishlist")
def remove_from_wishlist(
    user_id: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Removes a product from the customer's wishlist."""
    verify_user_access(user_id, current_user)

    item = db.query(WishlistItem).filter(
        WishlistItem.user_id == user_id,
        WishlistItem.product_id == product_id
    ).first()

    if item:
        db.delete(item)
        db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": "Product removed from wishlist.",
        "user": user.to_dict() if user else None
    }


@router.post("/users/{user_id}/wishlist/move-to-cart", summary="Move all wishlist items to cart")
def move_wishlist_to_cart(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Moves all items from wishlist into cart and empties the wishlist."""
    verify_user_access(user_id, current_user)

    wishlist_items = db.query(WishlistItem).filter(WishlistItem.user_id == user_id).all()
    existing_cart_pids = {
        ci.product_id for ci in db.query(CartItem).filter(CartItem.user_id == user_id).all()
    }

    for wi in wishlist_items:
        if wi.product_id not in existing_cart_pids:
            db.add(CartItem(
                user_id=user_id,
                product_id=wi.product_id,
                quantity=1,
                selected_variant=[]
            ))

    db.query(WishlistItem).filter(WishlistItem.user_id == user_id).delete()
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": "Moved wishlist items to cart.",
        "user": user.to_dict() if user else None
    }


@router.delete("/users/{user_id}/wishlist", summary="Clear customer wishlist")
def clear_customer_wishlist(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deletes all items from customer wishlist."""
    verify_user_access(user_id, current_user)

    db.query(WishlistItem).filter(WishlistItem.user_id == user_id).delete()
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return {
        "success": True,
        "message": "Wishlist cleared.",
        "user": user.to_dict() if user else None
    }


# ==============================================================================
# 3. WISHLIST & CART COMBINED STATUS
# ==============================================================================

@router.get("/users/{user_id}/wishlist-cart-status/{product_id}", summary="Check status for single product")
def check_product_wishlist_cart_status(
    user_id: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Checks whether a given product is currently in the customer's wishlist and/or cart."""
    verify_user_access(user_id, current_user)

    is_wishlisted = db.query(WishlistItem).filter(
        WishlistItem.user_id == user_id,
        WishlistItem.product_id == product_id
    ).first() is not None

    cart_item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id
    ).first()

    cart_data = None
    if cart_item:
        cart_data = {
            "id": cart_item.product_id,
            "quantity": cart_item.quantity,
            "variant": cart_item.selected_variant or []
        }

    return {
        "success": True,
        "wishlistStatus": is_wishlisted,
        "cartStatus": cart_item is not None,
        "cartData": cart_data
    }
