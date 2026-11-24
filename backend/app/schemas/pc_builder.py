"""PC Builder Pydantic schemas."""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class PcBuildValidateRequest(BaseModel):
    """Payload to validate PC build compatibility."""
    cpu: Optional[Dict[str, Any]] = None
    motherboard: Optional[Dict[str, Any]] = None
    ram: Optional[Dict[str, Any]] = None
    storage: Optional[Dict[str, Any]] = None
    gpu: Optional[Dict[str, Any]] = None
    cooler: Optional[Dict[str, Any]] = None
    psu: Optional[Dict[str, Any]] = None
    case: Optional[Dict[str, Any]] = None
    components: Optional[Dict[str, Any]] = None


class PcBuildAddToCartRequest(BaseModel):
    """Payload to transfer validated custom PC build items into customer's cart."""
    components: Dict[str, Any]
    buildName: Optional[str] = "Custom PC Build"
