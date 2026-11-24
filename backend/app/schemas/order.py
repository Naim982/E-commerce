"""Order, Checkout, Payment, and Coupon Pydantic Schemas."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class OrderItemPayload(BaseModel):
    """Line item sent during checkout."""
    productId: Optional[str] = None
    id: Optional[str] = None
    quantity: int = Field(1, ge=1)
    variants: Optional[List[Any]] = []
    variant: Optional[List[Any]] = None
    unitPrice: Optional[float] = None
    totalPrice: Optional[float] = None


class OrderCostPayload(BaseModel):
    """Frontend-reported costs (recalculated server-side)."""
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    tax: Optional[float] = None
    shipping: Optional[float] = None
    grandTotal: Optional[float] = None


class OrderPaymentPayload(BaseModel):
    """Payment information submitted during checkout."""
    method: str = "cod"  # 'cod', 'card', 'bkash', 'nagad'
    status: Optional[str] = "pending"
    transaction: Optional[str] = None
    card: Optional[Dict[str, Any]] = None
    phone: Optional[str] = None


class OrderCreate(BaseModel):
    """Checkout order creation payload matching frontend CheckoutPayment.js."""
    items: List[OrderItemPayload]
    address: Dict[str, Any]
    delivery: Optional[Dict[str, Any]] = None
    cost: Optional[OrderCostPayload] = None
    payment: OrderPaymentPayload
    couponCode: Optional[str] = None
    customerNotes: Optional[str] = None


class OrderCancelPayload(BaseModel):
    """Customer cancellation request payload."""
    reason: Optional[str] = "Customer requested cancellation"


class AdminOrderStatusUpdate(BaseModel):
    """Admin order update payload."""
    orderStatus: Optional[str] = None
    status: Optional[str] = None
    paymentStatus: Optional[str] = None
    trackingNumber: Optional[str] = None
    adminNotes: Optional[str] = None


class CouponValidateRequest(BaseModel):
    """Coupon validation request payload."""
    code: str
    subtotal: float = Field(0.0, ge=0.0)


class CouponCreateAdmin(BaseModel):
    """Admin coupon creation payload."""
    code: str
    discountType: str = "percentage"  # 'percentage' or 'fixed'
    discountValue: float = Field(..., gt=0.0)
    description: Optional[str] = ""
    minSpend: Optional[float] = 0.0
    maxUses: Optional[int] = 500
    startDate: Optional[str] = "2026-01-01"
    expiryDate: Optional[str] = "2026-12-31"
    active: Optional[bool] = True


class CouponUpdateAdmin(BaseModel):
    """Admin coupon update payload."""
    code: Optional[str] = None
    discountType: Optional[str] = None
    discountValue: Optional[float] = None
    description: Optional[str] = None
    minSpend: Optional[float] = None
    maxUses: Optional[int] = None
    startDate: Optional[str] = None
    expiryDate: Optional[str] = None
    active: Optional[bool] = None
