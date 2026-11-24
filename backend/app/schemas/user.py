"""User-related Pydantic request and response schemas."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class AccountExistsResponse(BaseModel):
    """Account existence check response."""
    exists: bool


class UserProfileData(BaseModel):
    """Nested profile information inside user request or response."""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatarInitials: Optional[str] = None
    avatarUrl: Optional[str] = None
    joinedDate: Optional[str] = None


class UserCreate(BaseModel):
    """Customer creation / synchronization payload."""
    firebaseUid: Optional[str] = Field(None, description="Firebase User UID")
    uid: Optional[str] = Field(None, description="Alternate UID field")
    email: Optional[str] = None
    name: Optional[str] = None
    profile: Optional[UserProfileData] = None


class UserProfileUpdate(BaseModel):
    """Profile update payload."""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    avatarUrl: Optional[str] = None


class UserNotificationsUpdate(BaseModel):
    """Notification status update payload."""
    markAllRead: Optional[bool] = False
    notifId: Optional[str] = None
    isRead: Optional[bool] = True


class AuthMeUserInfo(BaseModel):
    """User summary in /auth/me."""
    uid: str
    email: str
    name: str
    role: str
    permissions: List[str]


class AuthMeResponse(BaseModel):
    """Authentication status response."""
    success: bool
    authenticated: bool
    role: str
    isAdmin: bool
    user: AuthMeUserInfo


class UserResponse(BaseModel):
    """Customer profile response model."""
    id: str
    role: str
    accountStatus: str
    profile: Dict[str, Any]
    security: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None
    addresses: List[Dict[str, Any]] = []
    paymentMethods: List[Dict[str, Any]] = []
    wishlist: List[str] = []
    cartList: List[Dict[str, Any]] = []
    recentOrdersSummary: List[Dict[str, Any]] = []
    reviewsSummary: List[Dict[str, Any]] = []
    notifications: List[Dict[str, Any]] = []
