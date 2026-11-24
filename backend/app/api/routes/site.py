"""
CMS Site Content and Global Store Settings API Endpoints.
Serves public storefront assets (Hero slides, Auth banners, About company info)
and provides administrative content editing and store configuration management.
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.site import SiteContent, StoreSettings
from app.schemas.site import SiteContentUpdateAdmin, StoreSettingsUpdateAdmin

router = APIRouter(tags=["Site Content & Settings"])


# ==============================================================================
# 1. PUBLIC SITE DATA ENDPOINTS
# ==============================================================================

@router.get("/site-data", summary="Get all CMS content sections")
def get_all_site_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns combined CMS content sections (Hero slides, Auth banners, About section)."""
    rows = db.query(SiteContent).all()
    content_map = {row.key: row.content for row in rows}

    return {
        "success": True,
        "heroSlides": content_map.get("heroSlides", []),
        "authBanners": content_map.get("authBanners", []),
        "aboutSection": content_map.get("aboutSection", {})
    }


@router.get("/site-data/hero-slides", summary="Get storefront hero carousel slides")
def get_hero_slides(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns hero slides for homepage banner."""
    row = db.query(SiteContent).filter(SiteContent.key == "heroSlides").first()
    return {
        "success": True,
        "heroSlides": row.content if row else []
    }


@router.get("/site-data/auth-banners", summary="Get authentication page promotional banners")
def get_auth_banners(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns promotional banners for login and registration views."""
    row = db.query(SiteContent).filter(SiteContent.key == "authBanners").first()
    return {
        "success": True,
        "authBanners": row.content if row else []
    }


@router.get("/site-data/about", summary="Get company about information and partners")
@router.get("/site-data/about-section", summary="Get about section data alias")
def get_about_section(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns about section data (partner brands, customer reviews, warranty guarantees)."""
    row = db.query(SiteContent).filter(SiteContent.key == "aboutSection").first()
    return {
        "success": True,
        "aboutSection": row.content if row else {}
    }


@router.get("/settings", summary="Get public store settings")
def get_public_settings(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns general public store settings (currency, tax rules, shipping rules)."""
    rows = db.query(StoreSettings).all()
    settings_dict = {row.key: row.value for row in rows}
    return {
        "success": True,
        "settings": settings_dict
    }


# ==============================================================================
# 2. ADMIN CMS & SETTINGS MANAGEMENT
# ==============================================================================

@router.get("/admin/site-content", summary="Get site content for administrative CMS editor")
def get_admin_site_content(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves all site content sections for administrative editing."""
    rows = db.query(SiteContent).all()
    content_map = {row.key: row.content for row in rows}

    return {
        "success": True,
        "heroSlides": content_map.get("heroSlides", []),
        "authBanners": content_map.get("authBanners", []),
        "aboutSection": content_map.get("aboutSection", {})
    }


@router.put("/admin/site-content", summary="Update CMS content section")
def update_admin_site_content(
    payload: SiteContentUpdateAdmin,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates a CMS content section (heroSlides, authBanners, or aboutSection)."""
    section_key = payload.section.strip()
    if section_key not in ("heroSlides", "authBanners", "aboutSection"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid CMS section '{section_key}'. Allowed: heroSlides, authBanners, aboutSection."
        )

    row = db.query(SiteContent).filter(SiteContent.key == section_key).first()
    if row:
        row.content = payload.data
    else:
        row = SiteContent(key=section_key, content=payload.data)
        db.add(row)

    db.commit()
    db.refresh(row)

    return {
        "success": True,
        "message": f"Section '{section_key}' updated successfully."
    }


@router.get("/admin/settings", summary="Get full administrative store settings")
def get_admin_settings(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves comprehensive e-commerce configuration."""
    rows = db.query(StoreSettings).all()
    settings_dict = {row.key: row.value for row in rows}

    return {
        "success": True,
        "settings": settings_dict
    }


@router.patch("/admin/settings", summary="Update administrative store settings")
def update_admin_settings(
    payload: Dict[str, Any] = Body(...),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates one or more store setting categories (store, commerce, shipping, inventory)."""
    for section_key, section_data in payload.items():
        if isinstance(section_data, dict):
            row = db.query(StoreSettings).filter(StoreSettings.key == section_key).first()
            if row:
                merged = dict(row.value or {})
                merged.update(section_data)
                row.value = merged
            else:
                db.add(StoreSettings(key=section_key, value=section_data))

    db.commit()

    # Re-fetch complete settings
    rows = db.query(StoreSettings).all()
    settings_dict = {row.key: row.value for row in rows}

    return {
        "success": True,
        "message": "Store settings updated successfully.",
        "settings": settings_dict
    }
