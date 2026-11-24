"""Support ticket Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class SupportTicketCreate(BaseModel):
    """Payload to create a customer support ticket."""
    userId: Optional[str] = None
    userName: Optional[str] = None
    userEmail: Optional[str] = None
    topic: Optional[str] = "General Inquiry"
    orderNumber: Optional[str] = ""
    subject: Optional[str] = None
    message: str = Field(..., min_length=1)
    priority: Optional[str] = "medium"


class SupportTicketUpdateAdmin(BaseModel):
    """Admin support ticket update payload."""
    status: Optional[str] = None
    priority: Optional[str] = None
    adminReply: Optional[str] = None
    adminNotes: Optional[str] = None
