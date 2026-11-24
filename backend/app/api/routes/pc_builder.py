"""
PC Builder Compatibility and Custom Build API Endpoints.
Provides hardware socket compatibility checking, RAM standard validation,
power consumption calculation, clearance verification, and cart migration.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_optional, get_current_user
from app.models.user import User
from app.schemas.pc_builder import PcBuildValidateRequest, PcBuildAddToCartRequest
from app.services.pc_builder_service import validate_pc_build, add_build_to_cart

router = APIRouter(tags=["PC Builder"])


@router.post("/pc-builder/validate", summary="Validate hardware component compatibility")
def validate_custom_build(
    payload: PcBuildValidateRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Evaluates custom PC build configuration across:
    - CPU & Motherboard socket compatibility (AM5, LGA1700, etc.)
    - Memory standard alignment (DDR5 vs DDR4)
    - Total power draw and recommended PSU wattage headroom
    - GPU card physical length vs PC case maximum clearance
    """
    # Accept both top-level component keys or wrapped `components` dict
    components_payload = payload.components or {
        "cpu": payload.cpu,
        "motherboard": payload.motherboard,
        "ram": payload.ram,
        "storage": payload.storage,
        "gpu": payload.gpu,
        "cooler": payload.cooler,
        "psu": payload.psu,
        "case": payload.case
    }

    result = validate_pc_build(db, components_payload)
    return {
        "success": True,
        **result
    }


@router.post("/pc-builder/add-to-cart", summary="Transfer validated PC build components into customer cart")
def add_custom_build_to_cart(
    payload: PcBuildAddToCartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Transfers selected custom build components directly into the customer's shopping cart."""
    result = add_build_to_cart(db, current_user.id, payload.components)
    return result
