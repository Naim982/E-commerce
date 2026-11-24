"""Authentication and authorization dependencies for FastAPI."""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.firebase import verify_firebase_id_token
from app.models.user import User

logger = logging.getLogger(__name__)

# Standard HTTP Bearer scheme
bearer_scheme = HTTPBearer(auto_error=False)

ADMIN_EMAILS = {"admin@lumen.com", "admin@lumenhardware.com", "demo.account@lumen.com"}


def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts, verifies the Firebase ID token,
    and returns the authenticated User entity from PostgreSQL.

    If the user does not yet exist in PostgreSQL, they are automatically
    synchronized with default role 'user'.
    """
    if not auth_header or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify ID token
    token = auth_header.credentials
    claims = verify_firebase_id_token(token)

    uid = claims.get("uid") or claims.get("sub") or claims.get("user_id")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identification claim (uid).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Retrieve user from PostgreSQL
    user = db.query(User).filter(User.id == uid).first()

    if not user:
        # Automatic synchronization of authenticated Firebase users into PostgreSQL
        email = claims.get("email") or f"{uid}@user.lumen"
        name = claims.get("name") or claims.get("displayName") or ""
        first_name = name.split(" ")[0] if name else ""
        last_name = " ".join(name.split(" ")[1:]) if name and " " in name else ""
        assigned_role = "admin" if email.strip().lower() in ADMIN_EMAILS else "user"

        user = User(
            id=uid,
            email=email,
            role=assigned_role,
            name=name,
            first_name=first_name,
            last_name=last_name,
            avatar=claims.get("picture"),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Synchronized new Firebase user into PostgreSQL: uid={uid}, email={email}, role={assigned_role}")
    elif user.email and user.email.strip().lower() in ADMIN_EMAILS and user.role != "admin":
        user.role = "admin"
        db.commit()
        db.refresh(user)

    # Check account active status
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account has been deactivated. Please contact support."
        )

    return user


def get_current_user_optional(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Optional authentication dependency.
    Returns User if valid Bearer token provided, None otherwise without raising 401.
    """
    if not auth_header or not auth_header.credentials:
        return None
    try:
        return get_current_user(auth_header=auth_header, db=db)
    except HTTPException:
        return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that enforces administrator privileges.
    Allows access only when current_user.role == 'admin'.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrator privileges required."
        )
    return current_user


def verify_user_access(target_user_id: str, current_user: User) -> None:
    """
    Verifies that the authenticated user is either the target user or an administrator.
    Prevents customers from accessing or modifying another customer's data.
    """
    if current_user.role == "admin":
        return

    if current_user.id != str(target_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access or modify another user's data."
        )
