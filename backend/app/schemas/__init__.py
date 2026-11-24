"""Schemas package initialization."""
from app.schemas.user import (
    UserCreate,
    UserProfileUpdate,
    UserNotificationsUpdate,
    AccountExistsResponse,
    UserResponse,
    AuthMeResponse
)
from app.schemas.address import (
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse
)
from app.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    WishlistAdd
)
from app.schemas.order import (
    OrderCreate,
    OrderCancelPayload,
    AdminOrderStatusUpdate,
    CouponValidateRequest,
    CouponCreateAdmin,
    CouponUpdateAdmin
)

__all__ = [
    "UserCreate",
    "UserProfileUpdate",
    "UserNotificationsUpdate",
    "AccountExistsResponse",
    "UserResponse",
    "AuthMeResponse",
    "AddressCreate",
    "AddressUpdate",
    "AddressResponse",
    "AddressListResponse",
    "CartItemAdd",
    "CartItemUpdate",
    "WishlistAdd",
    "OrderCreate",
    "OrderCancelPayload",
    "AdminOrderStatusUpdate",
    "CouponValidateRequest",
    "CouponCreateAdmin",
    "CouponUpdateAdmin",
]
