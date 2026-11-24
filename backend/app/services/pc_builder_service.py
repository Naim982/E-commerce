"""
PC Builder Compatibility and Validation Service for LUMEN Hardware.
Validates CPU-motherboard sockets, RAM standards, power supply capacity, and case clearances.
Handles custom build pricing and cart transfers.
"""

from typing import Dict, Any, List, Optional, Tuple
from decimal import Decimal
import re
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.cart import CartItem


def extract_socket(part: Dict[str, Any], product: Optional[Product] = None) -> Optional[str]:
    """Extracts CPU or Motherboard socket (e.g., AM5, LGA1700, LGA1851, AM4)."""
    # 1. From direct part attribute
    if part.get("socket"):
        return str(part["socket"]).strip().upper()

    # 2. From chips / specs array
    search_text = " ".join(part.get("chips", []) + [part.get("title", ""), part.get("name", "")])
    if product and product.specifications:
        search_text += " " + str(product.specifications)

    m = re.search(r"\b(AM5|AM4|LGA1700|LGA1851|LGA1200|sTR5)\b", search_text, re.IGNORECASE)
    if m:
        return m.group(1).upper()
    return None


def extract_memory_type(part: Dict[str, Any], product: Optional[Product] = None) -> Optional[str]:
    """Extracts RAM or Motherboard memory standard (DDR5 vs DDR4)."""
    if part.get("memoryType"):
        return str(part["memoryType"]).strip().upper()

    search_text = " ".join(part.get("chips", []) + [part.get("title", ""), part.get("name", "")])
    if product and product.specifications:
        search_text += " " + str(product.specifications)

    m = re.search(r"\b(DDR5|DDR4)\b", search_text, re.IGNORECASE)
    if m:
        return m.group(1).upper()
    return None


def extract_watts(part: Dict[str, Any], default: int = 0) -> int:
    """Extracts wattage consumption or PSU power capacity."""
    if part.get("watts") is not None:
        try:
            return int(part["watts"])
        except Exception:
            pass

    search_text = " ".join(part.get("chips", []) + [part.get("title", ""), part.get("name", "")])
    m = re.search(r"(\d{2,4})\s*(?:W|watts|TDP)", search_text, re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            pass
    return default


def extract_length_mm(part: Dict[str, Any], default: int = 0) -> int:
    """Extracts GPU card length in millimeters."""
    if part.get("length") is not None:
        try:
            return int(part["length"])
        except Exception:
            pass
    search_text = " ".join(part.get("chips", []) + [part.get("title", ""), part.get("name", "")])
    m = re.search(r"(\d{3})\s*mm", search_text, re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            pass
    return default


def extract_max_clearance_mm(part: Dict[str, Any], default: int = 400) -> int:
    """Extracts case maximum GPU clearance in millimeters."""
    if part.get("maxGpuLength") is not None:
        try:
            return int(part["maxGpuLength"])
        except Exception:
            pass
    search_text = " ".join(part.get("chips", []) + [part.get("title", ""), part.get("name", "")])
    m = re.search(r"(?:max\s*gpu|clearance)\s*:?\s*(\d{3})\s*mm", search_text, re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            pass
    return default


def validate_pc_build(
    db: Session,
    components: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validates hardware component compatibility across a full custom PC configuration.
    Returns validation status, errors, warnings, estimated wattage, and total build cost.
    """
    errors: List[str] = []
    warnings: List[str] = []

    # Unpack components by slot
    cpu = components.get("stage-cpu") or components.get("cpu") or {}
    mobo = components.get("stage-mobo") or components.get("motherboard") or {}
    ram = components.get("stage-ram") or components.get("ram") or {}
    storage = components.get("stage-storage") or components.get("storage") or {}
    gpu = components.get("stage-gpu") or components.get("gpu") or {}
    cooler = components.get("stage-cooler") or components.get("cooler") or {}
    psu = components.get("stage-psu") or components.get("psu") or {}
    case = components.get("stage-case") or components.get("case") or {}

    # 1. CPU & Motherboard Socket Compatibility
    cpu_socket = extract_socket(cpu)
    mobo_socket = extract_socket(mobo)

    if cpu_socket and mobo_socket:
        if cpu_socket != mobo_socket:
            errors.append(
                f"Socket Incompatibility: Selected CPU ({cpu.get('name') or cpu.get('title') or 'CPU'}) requires {cpu_socket} socket, but Motherboard features {mobo_socket} socket."
            )
    elif cpu and mobo:
        warnings.append("Could not verify CPU/Motherboard socket standard. Please confirm physical socket alignment.")

    # 2. RAM & Motherboard Memory Standard Compatibility
    ram_type = extract_memory_type(ram)
    mobo_mem = extract_memory_type(mobo)

    if ram_type and mobo_mem:
        if ram_type != mobo_mem:
            errors.append(
                f"Memory Type Incompatibility: Selected RAM ({ram.get('name') or ram.get('title') or 'RAM'}) is {ram_type}, but Motherboard requires {mobo_mem} memory."
            )

    # 3. Power Consumption & PSU Compatibility
    cpu_watts = extract_watts(cpu, default=105) if cpu else 0
    gpu_watts = extract_watts(gpu, default=250) if gpu else 0
    base_system_watts = 75  # Motherboard, fans, storage, and RGB draw
    total_watts = cpu_watts + gpu_watts + base_system_watts
    recommended_psu_capacity = max(550, int(total_watts * 1.3))

    psu_capacity = extract_watts(psu, default=0) if psu else 0
    if psu:
        if psu_capacity > 0 and psu_capacity < total_watts:
            errors.append(
                f"Power Supply Insufficient: System estimated draw is {total_watts}W, but selected PSU only provides {psu_capacity}W."
            )
        elif psu_capacity > 0 and psu_capacity < recommended_psu_capacity:
            warnings.append(
                f"Recommended PSU capacity is {recommended_psu_capacity}W for stability and efficiency headroom (current PSU: {psu_capacity}W)."
            )

    # 4. GPU & Case Clearance
    gpu_length = extract_length_mm(gpu, default=0) if gpu else 0
    case_max_gpu = extract_max_clearance_mm(case, default=360) if case else 0

    if gpu_length > 0 and case_max_gpu > 0 and gpu_length > case_max_gpu:
        errors.append(
            f"GPU Clearance Conflict: GPU card length ({gpu_length}mm) exceeds case maximum clearance ({case_max_gpu}mm)."
        )

    # Calculate total price
    total_price = 0.0
    for part in [cpu, mobo, ram, storage, gpu, cooler, psu, case]:
        if part and "price" in part:
            try:
                total_price += float(part["price"])
            except Exception:
                pass

    is_valid = len(errors) == 0

    return {
        "valid": is_valid,
        "isCompatible": is_valid,
        "errors": errors,
        "warnings": warnings,
        "metrics": {
            "estimatedWattage": total_watts,
            "recommendedPsuWattage": recommended_psu_capacity,
            "totalPrice": round(total_price, 2)
        },
        "components": {
            "cpu": cpu,
            "motherboard": mobo,
            "ram": ram,
            "storage": storage,
            "gpu": gpu,
            "cooler": cooler,
            "psu": psu,
            "case": case
        }
    }


def add_build_to_cart(
    db: Session,
    user_id: str,
    components: Dict[str, Any]
) -> Dict[str, Any]:
    """Transfers validated custom build items into customer's persistent shopping cart."""
    added_count = 0
    unmapped_count = 0

    for slot_key, comp in components.items():
        if not comp or not isinstance(comp, dict):
            continue

        p_id = comp.get("catalogId") or comp.get("productId") or comp.get("id")
        if not p_id:
            unmapped_count += 1
            continue

        product = db.query(Product).filter(Product.id == p_id).first()
        if not product:
            unmapped_count += 1
            continue

        # Add or update in cart_items table
        existing_ci = db.query(CartItem).filter(
            CartItem.user_id == user_id,
            CartItem.product_id == product.id
        ).first()

        if existing_ci:
            existing_ci.quantity += 1
        else:
            db.add(CartItem(
                user_id=user_id,
                product_id=product.id,
                quantity=1,
                selected_variant=[]
            ))
        added_count += 1

    db.commit()
    return {
        "success": True,
        "addedCount": added_count,
        "unmappedCount": unmapped_count,
        "message": f"Successfully transferred {added_count} build components into shopping cart."
    }
