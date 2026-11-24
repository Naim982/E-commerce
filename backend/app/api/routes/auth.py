"""Authentication and identity endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(tags=["Authentication"])


@router.get("/auth/me", summary="Get Authenticated User Profile & Role")
def get_auth_me(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Returns current authenticated identity verified via Firebase ID Token.
    Provides role authorization context ('user' or 'admin') and permissions.
    """
    user_name = current_user.name
    if not user_name and (current_user.first_name or current_user.last_name):
        user_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
    if not user_name:
        user_name = "Authorized User"

    is_admin = (current_user.role == "admin")
    permissions = ["admin:all"] if is_admin else ["customer:standard"]

    return {
        "success": True,
        "authenticated": True,
        "role": current_user.role,
        "isAdmin": is_admin,
        "user": {
            "uid": current_user.id,
            "email": current_user.email,
            "name": user_name,
            "role": current_user.role,
            "permissions": permissions
        }
    }
