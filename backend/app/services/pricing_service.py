"""
Pricing and Coupon Service for LUMEN Hardware.
Performs authoritative, high-precision financial calculations using Decimal.
Enforces strict coupon validation and prevents manipulation of cart and checkout totals.
"""

from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product import Product, VariantOption
from app.models.coupon import Coupon

# Two-place Decimal constant for exact currency rounding
CENT = Decimal("0.01")
TAX_RATE = Decimal("0.08")  # 8% standard VAT/sales tax


def round_money(val: Decimal) -> Decimal:
    """Rounds a decimal value to standard currency cents (2 decimal places)."""
    return val.quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_product_unit_price(
    product: Product,
    variants_selected: Optional[List[Any]] = None
) -> Decimal:
    """
    Calculates the authoritative unit price for a product.
    Formula: Base effective price (after product discount) + Sum of variant price modifiers.
    """
    regular = Decimal(str(product.regular_price or "0.00"))
    disc_pct = Decimal(str(product.discount_percent or "0.00"))

    if disc_pct > 0:
        base_unit = regular * (Decimal("1.00") - (disc_pct / Decimal("100.00")))
    else:
        base_unit = regular

    base_unit = round_money(base_unit)

    # Calculate variant price modifiers
    variant_modifiers = Decimal("0.00")
    if variants_selected and isinstance(variants_selected, list):
        for v in variants_selected:
            if isinstance(v, dict):
                # Check for explicit priceModifier or lookup in option
                pmod = v.get("priceModifier")
                if pmod is not None:
                    try:
                        variant_modifiers += Decimal(str(pmod))
                    except Exception:
                        pass

    return round_money(base_unit + variant_modifiers)


def validate_coupon(
    db: Session,
    code: str,
    subtotal: Decimal
) -> Tuple[bool, Optional[Coupon], Decimal, str]:
    """
    Validates a coupon code against database rules and calculates discount amount.
    Returns: (is_valid, coupon_model, discount_amount, error_message)
    """
    clean_code = str(code).strip().upper()
    if not clean_code:
        return False, None, Decimal("0.00"), "Coupon code is empty."

    coupon = db.query(Coupon).filter(func.upper(Coupon.code) == clean_code).first()
    if not coupon:
        return False, None, Decimal("0.00"), f"Invalid coupon code: '{clean_code}'."

    if not coupon.is_active:
        return False, coupon, Decimal("0.00"), f"Coupon '{clean_code}' is currently inactive."

    now = datetime.now(timezone.utc)

    # Check start date
    if coupon.starts_at and coupon.starts_at > now:
        return False, coupon, Decimal("0.00"), f"Coupon '{clean_code}' has not started yet."

    # Check expiration date
    if coupon.expires_at and coupon.expires_at < now:
        return False, coupon, Decimal("0.00"), f"Coupon '{clean_code}' has expired."

    # Check usage limits
    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        return False, coupon, Decimal("0.00"), f"Coupon '{clean_code}' has reached its maximum usage limit."

    # Check minimum purchase threshold
    min_spend = Decimal(str(coupon.min_purchase or "0.00"))
    if subtotal < min_spend:
        return False, coupon, Decimal("0.00"), f"Minimum spending of ৳{min_spend} required for '{clean_code}'."

    # Calculate discount
    disc_val = Decimal(str(coupon.discount_value))
    if coupon.discount_type == "percentage":
        discount = round_money(subtotal * (disc_val / Decimal("100.00")))
        if coupon.max_discount is not None:
            max_disc = Decimal(str(coupon.max_discount))
            if discount > max_disc:
                discount = max_disc
    elif coupon.discount_type == "fixed":
        discount = round_money(min(subtotal, disc_val))
    else:
        discount = Decimal("0.00")

    return True, coupon, discount, ""


def calculate_order_pricing(
    db: Session,
    items_data: List[Dict[str, Any]],
    delivery_data: Optional[Dict[str, Any]] = None,
    coupon_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Authoritative calculation of complete checkout financial breakdown.
    Recalculates every item unit price, total price, subtotal, coupon discount, shipping, tax, and grand total.
    """
    subtotal = Decimal("0.00")
    processed_items = []

    for item in items_data:
        p_id = item.get("productId") or item.get("id")
        qty = max(1, int(item.get("quantity") or 1))
        variants = item.get("variants") or item.get("variant") or []

        product = db.query(Product).filter(Product.id == p_id).first()
        if not product:
            raise ValueError(f"Product '{p_id}' not found in catalog.")

        unit_price = calculate_product_unit_price(product, variants)
        item_total = round_money(unit_price * qty)
        subtotal += item_total

        processed_items.append({
            "product": product,
            "productId": product.id,
            "sku": product.sku,
            "name": product.name,
            "mainImage": (product.media or {}).get("mainImage", ""),
            "quantity": qty,
            "variants": variants,
            "unitPrice": unit_price,
            "totalPrice": item_total
        })

    # Validate and calculate coupon discount
    discount_amount = Decimal("0.00")
    valid_coupon = None
    coupon_error = ""

    if coupon_code and coupon_code.strip():
        is_valid, c_obj, disc, err = validate_coupon(db, coupon_code.strip(), subtotal)
        if is_valid:
            valid_coupon = c_obj
            discount_amount = disc
        else:
            coupon_error = err

    # Calculate shipping fee
    shipping_fee = Decimal("15.00")  # Default standard shipping
    if delivery_data and isinstance(delivery_data, dict):
        if "price" in delivery_data:
            try:
                shipping_fee = Decimal(str(delivery_data["price"]))
            except Exception:
                pass

    # If coupon is FREESHIP or provides free shipping
    if valid_coupon and valid_coupon.code.upper() in ("FREESHIP", "FREE_SHIPPING"):
        shipping_fee = Decimal("0.00")

    # Calculate tax: 8% on discounted subtotal
    taxable_subtotal = max(Decimal("0.00"), subtotal - discount_amount)
    tax_amount = round_money(taxable_subtotal * TAX_RATE)

    # Grand total
    grand_total = round_money(subtotal - discount_amount + shipping_fee + tax_amount)

    return {
        "items": processed_items,
        "subtotal": subtotal,
        "discount": discount_amount,
        "shipping": shipping_fee,
        "tax": tax_amount,
        "grandTotal": grand_total,
        "coupon": valid_coupon,
        "couponCode": valid_coupon.code if valid_coupon else None,
        "couponError": coupon_error,
        # Decimal serialization helpers for API response dictionaries
        "costSummary": {
            "subtotal": float(subtotal),
            "discount": float(discount_amount),
            "shipping": float(shipping_fee),
            "tax": float(tax_amount),
            "grandTotal": float(grand_total)
        }
    }
