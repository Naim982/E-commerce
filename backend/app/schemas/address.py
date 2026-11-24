"""Address-related Pydantic request and response schemas."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AddressCreate(BaseModel):
    """Shipping or billing address creation schema supporting camelCase and snake_case."""
    # Label / Title
    title: Optional[str] = None
    label: Optional[str] = None

    # Recipient Info
    name: Optional[str] = None
    recipientName: Optional[str] = None
    phone: Optional[str] = None

    # Street / Apartment
    street: Optional[str] = None
    addressLine1: Optional[str] = None
    address_line1: Optional[str] = None
    apartment: Optional[str] = None
    suite: Optional[str] = None
    addressLine2: Optional[str] = None
    address_line2: Optional[str] = None

    # Geographical Info
    city: Optional[str] = None
    villageArea: Optional[str] = None
    state: Optional[str] = None
    thana: Optional[str] = None
    district: Optional[str] = None
    postalCode: Optional[str] = None
    zipCode: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "Bangladesh"

    # Notes & Default Status
    instructions: Optional[str] = None
    isDefault: Optional[bool] = False
    is_default: Optional[bool] = False


class AddressUpdate(BaseModel):
    """Shipping or billing address update schema."""
    title: Optional[str] = None
    label: Optional[str] = None
    name: Optional[str] = None
    recipientName: Optional[str] = None
    phone: Optional[str] = None
    street: Optional[str] = None
    addressLine1: Optional[str] = None
    apartment: Optional[str] = None
    suite: Optional[str] = None
    addressLine2: Optional[str] = None
    city: Optional[str] = None
    villageArea: Optional[str] = None
    state: Optional[str] = None
    thana: Optional[str] = None
    district: Optional[str] = None
    postalCode: Optional[str] = None
    zipCode: Optional[str] = None
    country: Optional[str] = None
    instructions: Optional[str] = None
    isDefault: Optional[bool] = None


class AddressResponse(BaseModel):
    """Single address entity response."""
    id: str
    title: str
    label: str
    name: str
    recipientName: str
    phone: str
    addressLine1: str
    street: str
    addressLine2: str
    apartment: str
    suite: str
    city: str
    villageArea: str
    state: str
    thana: str
    district: str
    postalCode: str
    zipCode: str
    country: str
    instructions: str
    isDefault: bool


class AddressListResponse(BaseModel):
    """Address collection response."""
    addresses: List[Dict[str, Any]]
