"""CMS Content and Store Settings Pydantic schemas."""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class SiteContentUpdateAdmin(BaseModel):
    """Admin payload to update a CMS section."""
    section: str = Field(..., description="Section key, e.g. heroSlides, authBanners, aboutSection")
    data: Any = Field(..., description="Content payload for the section")


class StoreSettingsUpdateAdmin(BaseModel):
    """Admin payload to update store settings."""
    store: Optional[Dict[str, Any]] = None
    commerce: Optional[Dict[str, Any]] = None
    shipping: Optional[Dict[str, Any]] = None
    inventory: Optional[Dict[str, Any]] = None
