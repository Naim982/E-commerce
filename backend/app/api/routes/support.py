"""
Customer Support and Helpdesk API Endpoints.
Provides customer ticket submission and status tracking,
along with full administrative inquiry management.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import random
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from app.core.database import get_db
from app.core.security import get_current_user_optional, require_admin
from app.models.user import User
from app.models.support import SupportTicket
from app.schemas.support import SupportTicketCreate, SupportTicketUpdateAdmin

router = APIRouter(tags=["Support"])


def generate_ticket_number(db: Session) -> str:
    """Generates an incremental unique support ticket identifier like SUP-202611-042."""
    now = datetime.now(timezone.utc)
    prefix = f"SUP-{now.strftime('%Y%m')}"
    # Find latest count
    count = db.query(SupportTicket).count() + 1
    candidate = f"{prefix}-{count:03d}"
    # Ensure uniqueness
    while db.query(SupportTicket).filter(SupportTicket.ticket_number == candidate).first():
        count += 1
        candidate = f"{prefix}-{count:03d}"
    return candidate


# ==============================================================================
# 1. CUSTOMER SUPPORT TICKETS
# ==============================================================================

@router.post("/user-support", summary="Submit a customer helpdesk inquiry ticket")
def submit_customer_support(
    payload: SupportTicketCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Submits a customer support ticket and persists it in PostgreSQL."""
    user_id = current_user.id if current_user else (payload.userId or None)
    
    # Resolve customer name & email
    user_name = "Customer"
    user_email = "customer@example.com"
    if current_user:
        user_name = current_user.name or f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or "Customer"
        user_email = current_user.email
    elif payload.userName and payload.userEmail:
        user_name = payload.userName
        user_email = payload.userEmail
    elif user_id:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            user_name = db_user.name or f"{db_user.first_name or ''} {db_user.last_name or ''}".strip() or "Customer"
            user_email = db_user.email

    ticket_number = generate_ticket_number(db)
    subject = payload.subject or f"{payload.topic or 'General Inquiry'}: {payload.message[:40]}..."

    ticket = SupportTicket(
        ticket_number=ticket_number,
        user_id=user_id,
        name=user_name,
        email=user_email,
        topic=payload.topic or "General Inquiry",
        order_number=payload.orderNumber or "",
        subject=subject,
        message=payload.message,
        priority=payload.priority or "medium",
        status="open"
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return {
        "success": True,
        "message": f"Support ticket #{ticket_number} created successfully.",
        "ticket": ticket.to_dict()
    }


@router.get("/user-support", summary="Get customer's support tickets")
def get_customer_support_tickets(
    userId: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lists customer's support inquiries filtered by user identity."""
    target_uid = current_user.id if current_user else userId

    query = db.query(SupportTicket)
    if target_uid:
        query = query.filter(SupportTicket.user_id == target_uid)
    else:
        # If no user id provided and not authenticated, return empty list
        return {
            "success": True,
            "userSupport": []
        }

    tickets = query.order_by(desc(SupportTicket.created_at)).all()

    return {
        "success": True,
        "userSupport": [t.to_dict() for t in tickets],
        "total": len(tickets)
    }


# ==============================================================================
# 2. ADMIN SUPPORT TICKETS MANAGEMENT
# ==============================================================================

@router.get("/admin/support", summary="List all support tickets for administrative response")
def list_admin_support_tickets(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns all support tickets ordered by latest creation."""
    tickets = db.query(SupportTicket).order_by(desc(SupportTicket.created_at)).all()
    formatted = [t.to_dict() for t in tickets]

    return {
        "success": True,
        "tickets": formatted,
        "total": len(formatted)
    }


@router.patch("/admin/support/{ticket_id}", summary="Update support ticket status, priority, and reply")
def update_admin_support_ticket(
    ticket_id: str,
    payload: SupportTicketUpdateAdmin,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates status, priority, and administrative notes/reply on a support ticket."""
    clean_target = ticket_id.strip()
    ticket = db.query(SupportTicket).filter(
        or_(
            SupportTicket.ticket_number == clean_target,
            (SupportTicket.id == int(clean_target)) if clean_target.isdigit() else False
        )
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support ticket '{ticket_id}' not found."
        )

    if payload.status is not None:
        ticket.status = payload.status.strip().lower()

    if payload.priority is not None:
        ticket.priority = payload.priority.strip().lower()

    admin_reply_text = payload.adminNotes or payload.adminReply
    if admin_reply_text is not None:
        ticket.admin_reply = admin_reply_text
        ticket.replied_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ticket)

    return {
        "success": True,
        "message": f"Support ticket #{ticket.ticket_number} updated successfully.",
        "ticket": ticket.to_dict()
    }
