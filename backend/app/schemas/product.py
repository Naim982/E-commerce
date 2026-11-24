"""Product and Category Pydantic schemas."""

from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """Product review submission payload."""
    userId: Optional[str] = None
    userName: Optional[str] = None
    author: Optional[str] = None
    stars: int = Field(5, ge=1, le=5)
    title: Optional[str] = "Product Review"
    description: Optional[str] = None
    comment: Optional[str] = None


class FAQCreate(BaseModel):
    """Product FAQ question submission payload."""
    question: str
    askedBy: Optional[str] = "Customer"


class CategoryCreateAdmin(BaseModel):
    """Admin category creation payload."""
    name: str
    slug: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    displayOrder: Optional[int] = 0
    subcategories: Optional[List[str]] = []


class CategoryUpdateAdmin(BaseModel):
    """Admin category update payload."""
    name: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    displayOrder: Optional[int] = None
    subcategories: Optional[List[str]] = None


class StockUpdateAdmin(BaseModel):
    """Admin stock update payload."""
    stockQuantity: Optional[int] = None
    quantity: Optional[int] = None
    variantModifiers: Optional[List[Dict[str, Any]]] = None
    variantStockAndPriceModifiers: Optional[List[Dict[str, Any]]] = None


class ProductCreateAdmin(BaseModel):
    """Admin product creation payload."""
    id: Optional[str] = None
    sku: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    subCategory: Optional[str] = None
    brand: Optional[Any] = None
    regularPrice: Optional[float] = None
    discountPercent: Optional[float] = None
    stockQuantity: Optional[int] = 0
    badge: Optional[Any] = None
    media: Optional[Dict[str, Any]] = None
    specifications: Optional[Dict[str, Any]] = None
    description: Optional[Dict[str, Any]] = None
    assurance: Optional[List[Dict[str, Any]]] = None
    variants: Optional[List[Dict[str, Any]]] = None
    fixed: Optional[Dict[str, Any]] = None
    variable: Optional[Dict[str, Any]] = None


class ProductUpdateAdmin(BaseModel):
    """Admin product update payload."""
    sku: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    subCategory: Optional[str] = None
    brand: Optional[Any] = None
    regularPrice: Optional[float] = None
    discountPercent: Optional[float] = None
    stockQuantity: Optional[int] = None
    badge: Optional[Any] = None
    media: Optional[Dict[str, Any]] = None
    specifications: Optional[Dict[str, Any]] = None
    description: Optional[Dict[str, Any]] = None
    assurance: Optional[List[Dict[str, Any]]] = None
    variants: Optional[List[Dict[str, Any]]] = None
    fixed: Optional[Dict[str, Any]] = None
    variable: Optional[Dict[str, Any]] = None
    isActive: Optional[bool] = None
