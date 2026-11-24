"""Cart and Wishlist Pydantic Schemas."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    """Payload to add a product to the cart."""
    productId: str
    quantity: int = Field(1, ge=1)
    variant: Optional[List[Any]] = []
    selectedVariant: Optional[Dict[str, Any]] = None


class CartItemUpdate(BaseModel):
    """Payload to update cart quantity or variant selection."""
    quantity: Optional[int] = Field(None, ge=1)
    variant: Optional[List[Any]] = None
    selectedVariant: Optional[Dict[str, Any]] = None


class WishlistAdd(BaseModel):
    """Payload to add a product to the wishlist."""
    productId: str
