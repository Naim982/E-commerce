"""Customer support ticket model."""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SupportTicket(Base):
    """Customer inquiry and helpdesk support ticket."""

    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(128), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    topic: Mapped[Optional[str]] = mapped_column(String(128), default="General Inquiry", nullable=True)
    order_number: Mapped[Optional[str]] = mapped_column(String(64), default="", nullable=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    priority: Mapped[str] = mapped_column(String(32), default="medium", nullable=False)  # low, medium, high, urgent
    status: Mapped[str] = mapped_column(
        String(32), default="open", nullable=False, index=True
    )  # open, in_progress, resolved, closed
    
    admin_reply: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="support_tickets")

    def to_dict(self) -> dict:
        """Serializes support ticket record matching frontend contracts."""
        return {
            "id": self.ticket_number,
            "ticketId": self.ticket_number,
            "dbId": self.id,
            "userId": self.user_id,
            "userName": self.name,
            "userEmail": self.email,
            "topic": self.topic or "General Inquiry",
            "orderNumber": self.order_number or "",
            "subject": self.subject,
            "message": self.message,
            "priority": self.priority,
            "status": self.status,
            "adminReply": self.admin_reply or "",
            "adminNotes": self.admin_reply or "",
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
            "repliedAt": self.replied_at.isoformat() if self.replied_at else ""
        }
