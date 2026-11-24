"""User and Address management endpoints."""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, verify_user_access
from app.models.user import User, Address, Notification
from app.schemas.user import UserCreate, UserProfileUpdate, UserNotificationsUpdate
from app.schemas.address import AddressCreate, AddressUpdate

router = APIRouter(tags=["Users"])


# ==============================================================================
# 1. ACCOUNT EXISTENCE
# ==============================================================================

@router.get("/users/account-exists", summary="Check if email exists in database")
def check_account_exists(
    email: str = Query(..., description="Email address to check"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Public registration helper. Checks whether an email is already associated with an account.
    """
    email_clean = email.strip().lower()
    user = db.query(User).filter(User.email.ilike(email_clean)).first()
    return {
        "exists": user is not None
    }


# ==============================================================================
# 2. CREATE / SYNCHRONIZE USER
# ==============================================================================

@router.post("/users", status_code=status.HTTP_201_CREATED, summary="Create or synchronize customer profile")
def create_user(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Synchronizes a newly registered or authenticated Firebase customer into PostgreSQL.
    Enforces security: role is ALWAYS assigned as 'user'. Admin role cannot be self-assigned.
    """
    profile = payload.get("profile") or {}
    uid = payload.get("firebaseUid") or payload.get("uid") or payload.get("id")
    email = profile.get("email") or payload.get("email")

    first_name = profile.get("firstName") or payload.get("firstName") or ""
    last_name = profile.get("lastName") or payload.get("lastName") or ""
    phone = profile.get("phone") or payload.get("phone") or ""

    if not uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="firebaseUid (or uid) is required to synchronize user account."
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email is required to create user profile."
        )

    # Check if user already exists by ID or email
    user = db.query(User).filter((User.id == uid) | (User.email.ilike(email))).first()

    name = f"{first_name} {last_name}".strip() or profile.get("name") or payload.get("name") or ""

    if user:
        # Update existing user profile attributes
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        if name:
            user.name = name
        if phone:
            user.phone = phone
        db.commit()
        db.refresh(user)
    else:
        # Create new user record
        user = User(
            id=uid,
            email=email.strip().lower(),
            role="user",  # Strict security rule: default role is always 'user'
            first_name=first_name,
            last_name=last_name,
            name=name,
            phone=phone,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "user": user.to_dict()
    }


# ==============================================================================
# 3. GET CUSTOMER PROFILE
# ==============================================================================

@router.get("/users/{user_id}", summary="Get customer profile and data")
def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns full customer profile.
    Security: Customers can access only their own data. Admins can view any customer.
    """
    verify_user_access(user_id, current_user)

    target_user = current_user if current_user.id == user_id else db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return target_user.to_dict()


# ==============================================================================
# 4. UPDATE CUSTOMER PROFILE
# ==============================================================================

@router.api_route("/users/{user_id}/profile", methods=["PATCH", "PUT"], summary="Update customer profile")
def update_user_profile(
    user_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Updates profile details (firstName, lastName, phone).
    Security: Customers can update only their own profile. Cannot change role or ID.
    """
    verify_user_access(user_id, current_user)

    target_user = current_user if current_user.id == user_id else db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if "firstName" in payload:
        target_user.first_name = str(payload["firstName"]).strip()
    if "lastName" in payload:
        target_user.last_name = str(payload["lastName"]).strip()
    if "phone" in payload:
        target_user.phone = str(payload["phone"]).strip()

    # Update combined display name
    target_user.name = f"{target_user.first_name or ''} {target_user.last_name or ''}".strip()

    db.commit()
    db.refresh(target_user)

    user_dict = target_user.to_dict()
    return {
        "success": True,
        "user": user_dict,
        "profile": user_dict.get("profile", {})
    }


# ==============================================================================
# 5. ADDRESSES MANAGEMENT
# ==============================================================================

@router.get("/users/{user_id}/addresses", summary="Get customer saved addresses")
def get_user_addresses(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns all saved addresses for a customer."""
    verify_user_access(user_id, current_user)

    addresses = db.query(Address).filter(Address.user_id == user_id).order_by(Address.created_at.desc()).all()
    return {
        "addresses": [addr.to_dict() for addr in addresses]
    }


@router.post("/users/{user_id}/addresses", status_code=status.HTTP_201_CREATED, summary="Add a shipping address")
def add_user_address(
    user_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Adds a new shipping address.
    If isDefault is true or it is the user's first address, sets it as default.
    """
    verify_user_access(user_id, current_user)

    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Address data is required.")

    # Extract fields supporting both camelCase and snake_case
    title = payload.get("title") or payload.get("label") or "Home"
    recipient_name = payload.get("recipientName") or payload.get("name") or current_user.name or ""
    phone = payload.get("phone") or current_user.phone or ""
    address_line1 = payload.get("street") or payload.get("addressLine1") or payload.get("address_line1") or payload.get("address") or ""
    address_line2 = payload.get("apartment") or payload.get("suite") or payload.get("addressLine2") or payload.get("address_line2") or ""
    city = payload.get("villageArea") or payload.get("city") or "Dhaka"
    state = payload.get("thana") or payload.get("state") or ""
    district = payload.get("district") or city
    postal_code = payload.get("postalCode") or payload.get("zipCode") or payload.get("postal_code") or ""
    country = payload.get("country") or "Bangladesh"
    instructions = payload.get("instructions") or ""

    requested_default = bool(payload.get("isDefault", False) or payload.get("is_default", False))

    existing_addresses = db.query(Address).filter(Address.user_id == user_id).all()
    if not existing_addresses:
        requested_default = True

    if requested_default:
        for addr in existing_addresses:
            addr.is_default = False

    new_address = Address(
        user_id=user_id,
        title=title,
        name=recipient_name,
        phone=phone,
        address_line1=address_line1,
        address_line2=address_line2,
        city=city,
        state=state,
        district=district,
        postal_code=postal_code,
        country=country,
        instructions=instructions,
        is_default=requested_default
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)

    target_user = current_user if current_user.id == user_id else db.query(User).filter(User.id == user_id).first()
    return {
        "user": target_user.to_dict(),
        "address": new_address.to_dict()
    }


@router.api_route("/users/{user_id}/addresses/{address_id}", methods=["PATCH", "PUT"], summary="Update an address")
def update_user_address(
    user_id: str,
    address_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates an existing shipping address."""
    verify_user_access(user_id, current_user)

    # Address ID may be integer in DB
    try:
        addr_id_int = int(address_id)
        address = db.query(Address).filter(Address.id == addr_id_int, Address.user_id == user_id).first()
    except ValueError:
        address = None

    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    if "title" in payload or "label" in payload:
        address.title = payload.get("title") or payload.get("label")
    if "name" in payload or "recipientName" in payload:
        address.name = payload.get("recipientName") or payload.get("name")
    if "phone" in payload:
        address.phone = payload.get("phone")
    if "street" in payload or "addressLine1" in payload or "address_line1" in payload:
        address.address_line1 = payload.get("street") or payload.get("addressLine1") or payload.get("address_line1")
    if "apartment" in payload or "suite" in payload or "addressLine2" in payload:
        address.address_line2 = payload.get("apartment") or payload.get("suite") or payload.get("addressLine2")
    if "city" in payload or "villageArea" in payload:
        address.city = payload.get("villageArea") or payload.get("city")
    if "state" in payload or "thana" in payload:
        address.state = payload.get("thana") or payload.get("state")
    if "district" in payload:
        address.district = payload.get("district")
    if "postalCode" in payload or "zipCode" in payload or "postal_code" in payload:
        address.postal_code = payload.get("postalCode") or payload.get("zipCode") or payload.get("postal_code")
    if "country" in payload:
        address.country = payload.get("country")
    if "instructions" in payload:
        address.instructions = payload.get("instructions")

    if "isDefault" in payload or "is_default" in payload:
        requested_default = bool(payload.get("isDefault", False) or payload.get("is_default", False))
        if requested_default:
            all_addrs = db.query(Address).filter(Address.user_id == user_id).all()
            for a in all_addrs:
                a.is_default = (a.id == address.id)
            address.is_default = True

    db.commit()
    db.refresh(address)

    target_user = current_user if current_user.id == user_id else db.query(User).filter(User.id == user_id).first()
    return {
        "user": target_user.to_dict(),
        "address": address.to_dict()
    }


@router.patch("/users/{user_id}/addresses/{address_id}/default", summary="Set default shipping address")
def set_default_user_address(
    user_id: str,
    address_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Sets the designated address as default and unsets all other addresses for the user."""
    verify_user_access(user_id, current_user)

    try:
        addr_id_int = int(address_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    addresses = db.query(Address).filter(Address.user_id == user_id).all()
    target_found = False

    for a in addresses:
        if a.id == addr_id_int:
            a.is_default = True
            target_found = True
        else:
            a.is_default = False

    if not target_found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    db.commit()

    target_user = current_user if current_user.id == user_id else db.query(User).filter(User.id == user_id).first()
    return {
        "user": target_user.to_dict()
    }


@router.delete("/users/{user_id}/addresses/{address_id}", summary="Delete an address")
def delete_user_address(
    user_id: str,
    address_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deletes a shipping address. If default was deleted, assigns default to another address."""
    verify_user_access(user_id, current_user)

    try:
        addr_id_int = int(address_id)
        address = db.query(Address).filter(Address.id == addr_id_int, Address.user_id == user_id).first()
    except ValueError:
        address = None

    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    was_default = address.is_default
    db.delete(address)
    db.commit()

    # If deleted address was default, promote the first remaining address to default
    if was_default:
        remaining = db.query(Address).filter(Address.user_id == user_id).order_by(Address.created_at.asc()).first()
        if remaining:
            remaining.is_default = True
            db.commit()

    target_user = current_user if current_user.id == user_id else db.query(User).filter(User.id == user_id).first()
    return {
        "user": target_user.to_dict()
    }


# ==============================================================================
# 6. NOTIFICATIONS
# ==============================================================================

@router.get("/users/{user_id}/notifications", summary="Get user notification list")
def get_user_notifications(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns customer notifications."""
    verify_user_access(user_id, current_user)

    notifications = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
    return {
        "notifications": [n.to_dict() for n in notifications]
    }


@router.api_route("/users/{user_id}/notifications", methods=["PATCH", "PUT"], summary="Update user notification statuses")
def update_user_notifications(
    user_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Marks notifications as read or updates notification settings.
    Supports payload: { markAllRead: true } or { notifId: '...', isRead: true }
    """
    verify_user_access(user_id, current_user)

    notifications = db.query(Notification).filter(Notification.user_id == user_id).all()

    if payload.get("markAllRead"):
        for n in notifications:
            n.is_read = True
    elif "notifId" in payload:
        notif_id_str = str(payload["notifId"])
        is_read_val = bool(payload.get("isRead", True))
        for n in notifications:
            if str(n.id) == notif_id_str:
                n.is_read = is_read_val
                break

    db.commit()

    # Refresh and return updated list
    updated_notifications = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
    return {
        "success": True,
        "notifications": [n.to_dict() for n in updated_notifications]
    }
