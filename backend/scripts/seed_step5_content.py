"""
Seed Script for Step 5: CMS Content, Store Settings, and Support Tickets.
Imports siteData.json and settings.json into PostgreSQL tables:
- site_content ('hero_slides', 'auth_banners', 'about_section')
- store_settings ('store', 'commerce', 'shipping', 'inventory')
- support_tickets (userSupport)
Idempotent and safe to run multiple times.
"""

import os
import sys
import json
from datetime import datetime, timezone

# Ensure backend directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal
from app.models.site import SiteContent, StoreSettings
from app.models.support import SupportTicket
from app.models.user import User


def seed_cms_content(db):
    """Imports hero slides, auth banners, and about section into site_content."""
    site_data_path = os.path.join(BACKEND_DIR, "data", "json", "siteData.json")
    if not os.path.exists(site_data_path):
        print("  - siteData.json not found; skipping CMS seeding.")
        return

    with open(site_data_path, "r", encoding="utf-8") as f:
        site_data = json.load(f)

    sections = {
        "heroSlides": site_data.get("heroSlides", []),
        "authBanners": site_data.get("authBanners", []),
        "aboutSection": site_data.get("aboutSection", {})
    }

    count = 0
    for key, content in sections.items():
        existing = db.query(SiteContent).filter(SiteContent.key == key).first()
        if not existing:
            sc = SiteContent(key=key, content=content, description=f"CMS section for {key}")
            db.add(sc)
            count += 1
        else:
            existing.content = content

    db.commit()
    print(f"✓ Seeded/Updated {len(sections)} CMS sections in site_content table ({count} new).")


def seed_store_settings(db):
    """Imports store, commerce, shipping, and inventory settings into store_settings."""
    settings_path = os.path.join(BACKEND_DIR, "data", "json", "settings.json")
    if not os.path.exists(settings_path):
        print("  - settings.json not found; skipping store settings.")
        return

    with open(settings_path, "r", encoding="utf-8") as f:
        settings_data = json.load(f)

    count = 0
    for key in ["store", "commerce", "shipping", "inventory"]:
        val = settings_data.get(key, {})
        existing = db.query(StoreSettings).filter(StoreSettings.key == key).first()
        if not existing:
            st = StoreSettings(key=key, value=val, description=f"Store settings for {key}")
            db.add(st)
            count += 1
        else:
            existing.value = val

    db.commit()
    print(f"✓ Seeded/Updated 4 settings blocks in store_settings table ({count} new).")


def seed_support_tickets(db):
    """Imports initial support tickets into support_tickets."""
    site_data_path = os.path.join(BACKEND_DIR, "data", "json", "siteData.json")
    if not os.path.exists(site_data_path):
        return

    with open(site_data_path, "r", encoding="utf-8") as f:
        site_data = json.load(f)

    tickets = site_data.get("userSupport", [])
    count = 0
    for t in tickets:
        t_id = t.get("id") or f"SUP-{t.get('ticketId', count+1)}"
        existing = db.query(SupportTicket).filter(SupportTicket.ticket_number == t_id).first()
        if existing:
            continue

        created_dt = datetime.now(timezone.utc)
        if t.get("createdAt"):
            try:
                created_dt = datetime.fromisoformat(t["createdAt"].replace("Z", "+00:00"))
            except Exception:
                pass

        user_id = t.get("userId")
        # Ensure user exists if user_id given
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                user = User(
                    id=user_id,
                    email=t.get("userEmail") or f"{user_id}@customer.lumen",
                    role="user",
                    name=t.get("userName") or "Customer",
                    is_active=True
                )
                db.add(user)
                db.flush()

        ticket = SupportTicket(
            ticket_number=t_id,
            user_id=user_id,
            name=t.get("userName") or "Customer",
            email=t.get("userEmail") or "support@lumen.hardware",
            subject=f"[{t.get('topic', 'General Inquiry')}] {t.get('orderNumber', '')}".strip(),
            message=t.get("message") or "Help request.",
            priority=t.get("priority", "medium"),
            status=t.get("status", "open"),
            admin_reply=t.get("adminNotes") or t.get("adminReply"),
            created_at=created_dt
        )
        db.add(ticket)
        count += 1

    db.commit()
    print(f"✓ Seeded {count} historical support tickets into support_tickets table.")


def main():
    print("=" * 60)
    print("  SEEDING STEP 5: CMS CONTENT, SETTINGS & SUPPORT TICKETS")
    print("=" * 60)
    db = SessionLocal()
    try:
        seed_cms_content(db)
        seed_store_settings(db)
        seed_support_tickets(db)
        print("✓ Step 5 data seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
