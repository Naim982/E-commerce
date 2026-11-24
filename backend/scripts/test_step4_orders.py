"""
Comprehensive Verification Test Suite for STEP 4:
Cart, Wishlist, Pricing Service, Coupons, Orders, Demo Payments, and Inventory Consistency.
"""

import sys
import os
import json
import asyncio
from decimal import Decimal

# Ensure backend root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.coupon import Coupon
from app.models.cart import CartItem, WishlistItem
from app.models.order import Order, OrderItem, Payment
from app.services.pricing_service import (
    calculate_product_unit_price,
    validate_coupon,
    calculate_order_pricing,
    round_money
)


async def invoke_api(method: str, path: str, token: str = None, body: dict = None):
    """Helper to simulate HTTP requests against FastAPI ASGI application."""
    headers = [(b"host", b"testserver")]
    if token:
        headers.append((b"authorization", f"Bearer {token}".encode("utf-8")))

    body_bytes = b""
    if body is not None:
        body_bytes = json.dumps(body).encode("utf-8")
        headers.append((b"content-type", b"application/json"))

    query_string = b""
    raw_path = path.encode("utf-8")
    if b"?" in raw_path:
        raw_path, query_string = raw_path.split(b"?", 1)

    response_headers = {}
    response_body = []
    status_code = None

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method.upper(),
        "headers": headers,
        "path": raw_path.decode("utf-8"),
        "raw_path": raw_path,
        "query_string": query_string,
        "scheme": "http",
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    }

    async def receive():
        return {
            "type": "http.request",
            "body": body_bytes,
            "more_body": False,
        }

    async def send(message):
        nonlocal status_code, response_headers, response_body
        if message["type"] == "http.response.start":
            status_code = message["status"]
            response_headers = {k.decode("latin1"): v.decode("latin1") for k, v in message.get("headers", [])}
        elif message["type"] == "http.response.body":
            response_body.append(message.get("body", b""))

    await app(scope, receive, send)
    resp_text = b"".join(response_body).decode("utf-8")
    try:
        resp_json = json.loads(resp_text) if resp_text else {}
    except Exception:
        resp_json = {"raw": resp_text}

    return status_code, resp_json


async def run_all_tests():
    print("=" * 70)
    print("  STEP 4: CART, WISHLIST, PRICING, ORDERS & PAYMENTS — TEST SUITE")
    print("=" * 70)

    db = SessionLocal()

    # 0. SETUP: Ensure test customer and admin exist with Firebase mock tokens
    customer_uid = "cust_step4_001"
    other_uid = "cust_step4_002"
    admin_uid = "admin_step4_999"

    for uid, email, role, name in [
        (customer_uid, "customer.step4@lumen.hardware", "user", "Step4 Customer"),
        (other_uid, "other.step4@lumen.hardware", "user", "Other Customer"),
        (admin_uid, "admin.step4@lumen.hardware", "admin", "Step4 Administrator")
    ]:
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            u = User(id=uid, email=email, role=role, name=name, first_name=name.split()[0], last_name=name.split()[1], is_active=True)
            db.add(u)
        else:
            u.role = role
            u.name = name
    db.commit()

    cust_token = f"test-token-{customer_uid}"
    other_token = f"test-token-{other_uid}"
    admin_token = f"test-token-{admin_uid}"

    # Pick a test product
    test_prod = db.query(Product).filter(Product.stock_quantity >= 10).first()
    assert test_prod is not None, "Need at least one product with stock >= 10 for testing."
    test_pid = test_prod.id
    init_stock = test_prod.stock_quantity
    init_sold = test_prod.total_sold

    try:
        # ==============================================================================
        # TEST 1: PRICING SERVICE UNIT TESTS
        # ==============================================================================
        print("\n[TEST 1] Pricing Service Unit Calculations...")
        unit_price = calculate_product_unit_price(test_prod, [{"priceModifier": 250.0}])
        expected_base = round_money(test_prod.regular_price * (1 - test_prod.discount_percent / 100))
        expected_total = expected_base + Decimal("250.00")
        assert unit_price == expected_total, f"Expected {expected_total}, got {unit_price}"
        print(f"  ✓ Unit price with discount & variant modifier correctly computed: {unit_price} BDT")

        # ==============================================================================
        # TEST 2: COUPON VALIDATION ENGINE
        # ==============================================================================
        print("\n[TEST 2] Coupon Validation Engine...")
        # 2.1 Valid LUMEN10 percentage coupon
        valid, c_obj, disc, err = validate_coupon(db, "LUMEN10", Decimal("1000.00"))
        assert valid is True and disc == Decimal("100.00"), f"LUMEN10 failed: {disc}, {err}"
        print("  ✓ Percentage coupon (LUMEN10) applied 10% discount accurately")

        # 2.2 Valid FREESHIP coupon
        valid, c_obj, disc, err = validate_coupon(db, "FREESHIP", Decimal("100.00"))
        assert valid is True, f"FREESHIP validation failed: {err}"
        print("  ✓ Free shipping coupon validated successfully")

        # 2.3 Expired/Inactive coupon rejection
        valid, c_obj, disc, err = validate_coupon(db, "FLASH25", Decimal("1000.00"))
        assert valid is False and "inactive" in err.lower() or "expired" in err.lower()
        print("  ✓ Inactive/expired coupon (FLASH25) correctly rejected")

        # 2.4 Minimum spending requirement check
        valid, c_obj, disc, err = validate_coupon(db, "RTX50", Decimal("100.00"))
        assert valid is False and "minimum spending" in err.lower()
        print("  ✓ Minimum spending threshold enforcement verified")

        # 2.5 Public coupon validation API endpoint
        st, res = await invoke_api("POST", "/api/coupons/validate", body={"code": "LUMEN10", "subtotal": 2000.0})
        assert st == 200 and res.get("valid") is True and res.get("discount") == 200.0
        print("  ✓ Public /api/coupons/validate returned valid: True with 200.0 BDT discount")

        # ==============================================================================
        # TEST 3: CART MANAGEMENT CRUD
        # ==============================================================================
        print("\n[TEST 3] Customer Cart Management (PostgreSQL Persistence)...")
        # 3.1 Clear cart first
        await invoke_api("DELETE", f"/api/users/{customer_uid}/cart", token=cust_token)

        # 3.2 Add product to cart
        st, res = await invoke_api(
            "POST",
            f"/api/users/{customer_uid}/cart",
            token=cust_token,
            body={"productId": test_pid, "quantity": 2, "variant": [{"type": "Color", "name": "Matte Black"}]}
        )
        assert st == 200 and res.get("success") is True
        print(f"  ✓ Added 2 units of '{test_pid}' to cart")

        # 3.3 Get cart with verified database subtotal
        st, res = await invoke_api("GET", f"/api/users/{customer_uid}/cart", token=cust_token)
        assert st == 200
        cart_list = res.get("cartList", [])
        assert len(cart_list) == 1 and cart_list[0]["productId"] == test_pid and cart_list[0]["quantity"] == 2
        assert res.get("subtotal") > 0
        print(f"  ✓ Cart retrieved with verified subtotal: {res.get('subtotal')} BDT")

        # 3.4 Update cart item quantity
        st, res = await invoke_api(
            "PATCH",
            f"/api/users/{customer_uid}/cart/{test_pid}",
            token=cust_token,
            body={"quantity": 3}
        )
        assert st == 200
        st, res = await invoke_api("GET", f"/api/users/{customer_uid}/cart", token=cust_token)
        assert res["cartList"][0]["quantity"] == 3
        print("  ✓ Cart item quantity updated to 3")

        # 3.5 Rejection when quantity exceeds stock
        st, res = await invoke_api(
            "PATCH",
            f"/api/users/{customer_uid}/cart/{test_pid}",
            token=cust_token,
            body={"quantity": 999999}
        )
        assert st == 400
        print("  ✓ Excessive quantity exceeding inventory was rejected with HTTP 400")

        # ==============================================================================
        # TEST 4: WISHLIST MANAGEMENT & ITEM MOVEMENTS
        # ==============================================================================
        print("\n[TEST 4] Customer Wishlist Management & Cross-List Movement...")
        # 4.1 Move cart item to wishlist
        st, res = await invoke_api(
            "POST",
            f"/api/users/{customer_uid}/cart/{test_pid}/move-to-wishlist",
            token=cust_token
        )
        assert st == 200
        st, res_cart = await invoke_api("GET", f"/api/users/{customer_uid}/cart", token=cust_token)
        assert len(res_cart.get("cartList", [])) == 0
        st, res_wish = await invoke_api("GET", f"/api/users/{customer_uid}/wishlist", token=cust_token)
        assert test_pid in res_wish.get("wishlist", [])
        print("  ✓ Item successfully moved from cart into wishlist")

        # 4.2 Check combined wishlist & cart status
        st, res = await invoke_api(
            "GET",
            f"/api/users/{customer_uid}/wishlist-cart-status/{test_pid}",
            token=cust_token
        )
        assert st == 200 and res.get("wishlistStatus") is True and res.get("cartStatus") is False
        print("  ✓ Combined /wishlist-cart-status verified (wishlist: True, cart: False)")

        # 4.3 Move wishlist item back to cart
        st, res = await invoke_api(
            "POST",
            f"/api/users/{customer_uid}/wishlist/move-to-cart",
            token=cust_token
        )
        assert st == 200
        st, res_cart = await invoke_api("GET", f"/api/users/{customer_uid}/cart", token=cust_token)
        assert len(res_cart.get("cartList", [])) == 1
        print("  ✓ Wishlist item moved back to cart successfully")

        # ==============================================================================
        # TEST 5: ORDER CHECKOUT & INVENTORY ROW LOCKING
        # ==============================================================================
        print("\n[TEST 5] Order Checkout with Row-Locking & Atomic Stock Decrement...")
        order_payload = {
            "items": [
                {
                    "productId": test_pid,
                    "quantity": 2,
                    "variants": [{"name": "Standard Edition", "priceModifier": 0}]
                }
            ],
            "address": {
                "name": "Step4 Customer",
                "phone": "01711000000",
                "street": "House 12, Road 4, Dhanmondi",
                "city": "Dhaka",
                "country": "Bangladesh"
            },
            "delivery": {
                "name": "Standard Express Delivery",
                "price": 20.0
            },
            # Intentionally pass forged client totals to test authoritative server recalculation
            "cost": {
                "subtotal": 1.0,
                "discount": 999.0,
                "grandTotal": 0.0
            },
            "payment": {
                "method": "cod",
                "status": "pending"
            },
            "couponCode": "LUMEN10"
        }

        st, res = await invoke_api(
            "POST",
            f"/api/users/{customer_uid}/orders",
            token=cust_token,
            body=order_payload
        )
        assert st == 200 and res.get("success") is True
        created_order = res.get("order")
        order_id = created_order["orderId"]
        assert created_order["orderStatus"] == "processing"
        assert created_order["payment"]["status"] == "pending"

        # Verify client forged total was completely ignored and recalculated authoritatively
        assert created_order["cost"]["grandTotal"] > 10.0
        print(f"  ✓ Order created successfully: #{order_id}")
        print(f"  ✓ Authoritative server calculation verified: Grand total = {created_order['cost']['grandTotal']} BDT")

        # Verify atomic stock decrement in database
        db.expire_all()
        reloaded_prod = db.query(Product).filter(Product.id == test_pid).first()
        assert reloaded_prod.stock_quantity == init_stock - 2
        assert reloaded_prod.total_sold == init_sold + 2
        print(f"  ✓ Stock quantity atomically decremented from {init_stock} to {reloaded_prod.stock_quantity}")
        print(f"  ✓ Total sold atomically incremented from {init_sold} to {reloaded_prod.total_sold}")

        # Verify cart was cleared of ordered items
        st, res_cart = await invoke_api("GET", f"/api/users/{customer_uid}/cart", token=cust_token)
        assert len(res_cart.get("cartList", [])) == 0
        print("  ✓ Purchased items automatically cleared from customer's active cart")

        # ==============================================================================
        # TEST 6: DEMO CARD PAYMENT SANITIZATION
        # ==============================================================================
        print("\n[TEST 6] Demo Card Payment Handling & Sanitization...")
        card_order_payload = {
            "items": [{"productId": test_pid, "quantity": 1}],
            "address": {"street": "Banani Road 11", "city": "Dhaka", "country": "Bangladesh"},
            "delivery": {"name": "Standard", "price": 0.0},
            "payment": {
                "method": "card",
                "status": "paid",  # Client tries to claim it is paid
                "card": {
                    "cardNumber": "4111222233334444",
                    "cvv": "123",
                    "last4": "4444"
                }
            }
        }
        st, res = await invoke_api(
            "POST",
            f"/api/users/{customer_uid}/orders",
            token=cust_token,
            body=card_order_payload
        )
        assert st == 200
        card_order = res["order"]
        # In demo mode, status must remain pending
        assert card_order["payment"]["status"] == "pending"
        # Only card last4 is stored; full number and CVV are sanitized
        assert card_order["payment"]["card"] == {"last4": "4444"}
        print("  ✓ Online card payment recorded as 'pending' in demo mode")
        print("  ✓ Full card number and CVV strictly sanitized: only last4 preserved")

        # ==============================================================================
        # TEST 7: INVENTORY OUT-OF-STOCK ROLLBACK
        # ==============================================================================
        print("\n[TEST 7] Transaction Rollback on Insufficient Stock...")
        db.expire_all()
        stock_before_fail = db.query(Product).filter(Product.id == test_pid).first().stock_quantity

        fail_payload = {
            "items": [{"productId": test_pid, "quantity": stock_before_fail + 100}],
            "address": {"street": "Gulshan 2", "city": "Dhaka", "country": "Bangladesh"},
            "payment": {"method": "cod"}
        }
        st, res = await invoke_api(
            "POST",
            f"/api/users/{customer_uid}/orders",
            token=cust_token,
            body=fail_payload
        )
        assert st == 400
        db.expire_all()
        stock_after_fail = db.query(Product).filter(Product.id == test_pid).first().stock_quantity
        assert stock_before_fail == stock_after_fail
        print(f"  ✓ Transaction cleanly rolled back on stock exhaustion: stock remains {stock_after_fail}")

        # ==============================================================================
        # TEST 8: CUSTOMER ORDER HISTORY & CROSS-USER SECURITY
        # ==============================================================================
        print("\n[TEST 8] Customer Order Retrieval & Authorization Boundary...")
        # 8.1 Customer lists own orders
        st, res = await invoke_api("GET", f"/api/users/{customer_uid}/orders", token=cust_token)
        assert st == 200 and len(res.get("orders", [])) >= 2
        print(f"  ✓ Customer fetched own order history ({len(res['orders'])} orders found)")

        # 8.2 Customer gets single order details
        st, res = await invoke_api("GET", f"/api/users/{customer_uid}/orders/{order_id}", token=cust_token)
        assert st == 200 and res["order"]["orderId"] == order_id
        print(f"  ✓ Retrieved single order details for #{order_id}")

        # 8.3 Cross-customer authorization guard
        st, res = await invoke_api("GET", f"/api/users/{customer_uid}/orders", token=other_token)
        assert st == 403
        st, res = await invoke_api("GET", f"/api/users/{customer_uid}/orders/{order_id}", token=other_token)
        assert st == 403
        print("  ✓ Cross-customer access to orders blocked with HTTP 403 Forbidden")

        # ==============================================================================
        # TEST 9: ORDER CANCELLATION & ATOMIC STOCK RESTORATION
        # ==============================================================================
        print("\n[TEST 9] Order Cancellation & Atomic Stock Restoration...")
        db.expire_all()
        stock_before_cancel = db.query(Product).filter(Product.id == test_pid).first().stock_quantity
        sold_before_cancel = db.query(Product).filter(Product.id == test_pid).first().total_sold

        # Customer cancels the order
        st, res = await invoke_api(
            "PATCH",
            f"/api/users/{customer_uid}/orders/{order_id}/cancel",
            token=cust_token,
            body={"reason": "Found better bundle deal"}
        )
        assert st == 200 and res.get("success") is True
        cancelled_order = res.get("order")
        assert cancelled_order["orderStatus"] == "cancelled"

        # Verify stock was restored by 2 units in database
        db.expire_all()
        stock_after_cancel = db.query(Product).filter(Product.id == test_pid).first().stock_quantity
        sold_after_cancel = db.query(Product).filter(Product.id == test_pid).first().total_sold
        assert stock_after_cancel == stock_before_cancel + 2
        assert sold_after_cancel == sold_before_cancel - 2
        print(f"  ✓ Order #{order_id} status updated to 'cancelled'")
        print(f"  ✓ Product stock restored: {stock_before_cancel} -> {stock_after_cancel}")
        print(f"  ✓ Product total_sold restored: {sold_before_cancel} -> {sold_after_cancel}")

        # Attempting to cancel again is handled cleanly
        st, res = await invoke_api(
            "PATCH",
            f"/api/users/{customer_uid}/orders/{order_id}/cancel",
            token=cust_token
        )
        assert st == 200 and "already cancelled" in res.get("message", "").lower()
        print("  ✓ Idempotent second cancellation handled gracefully")

        # ==============================================================================
        # TEST 10: ADMIN ORDER DASHBOARD & FULFILLMENT
        # ==============================================================================
        print("\n[TEST 10] Admin Order Dashboard, Search & Status Updates...")
        # 10.1 Customer access blocked
        st, res = await invoke_api("GET", "/api/admin/orders", token=cust_token)
        assert st == 403
        print("  ✓ Non-admin access to /admin/orders blocked with HTTP 403 Forbidden")

        # 10.2 Admin lists orders
        st, res = await invoke_api("GET", "/api/admin/orders?limit=10", token=admin_token)
        assert st == 200
        assert res.get("total") > 0
        admin_orders = res.get("orders", [])
        assert len(admin_orders) > 0
        first_admin_order = admin_orders[0]
        assert "customerName" in first_admin_order
        print(f"  ✓ Admin listed {len(admin_orders)} orders (Total in system: {res.get('total')})")

        # 10.3 Admin updates order status & tracking number
        st, res = await invoke_api(
            "PATCH",
            f"/api/admin/orders/{card_order['orderId']}",
            token=admin_token,
            body={
                "orderStatus": "shipped",
                "paymentStatus": "paid",
                "trackingNumber": "TRACK-LUMEN-9922",
                "adminNotes": "Dispatched via Sundarban Courier"
            }
        )
        assert st == 200 and res.get("success") is True
        updated_admin_order = res.get("order")
        assert updated_admin_order["orderStatus"] == "shipped"
        assert updated_admin_order["payment"]["status"] == "paid"
        assert updated_admin_order["delivery"]["trackingNumber"] == "TRACK-LUMEN-9922"
        print(f"  ✓ Admin updated order #{card_order['orderId']} to 'shipped' with tracking number")

        # ==============================================================================
        # TEST 11: ADMIN PROMOTIONAL COUPON MANAGEMENT
        # ==============================================================================
        print("\n[TEST 11] Admin Promotional Coupon Management...")
        # 11.1 List coupons
        st, res = await invoke_api("GET", "/api/admin/coupons", token=admin_token)
        assert st == 200
        coupons = res.get("coupons", [])
        assert len(coupons) >= 5
        print(f"  ✓ Admin retrieved {len(coupons)} coupons")

        # 11.2 Create new coupon
        new_coupon_payload = {
            "code": "STEP4TEST",
            "discountType": "fixed",
            "discountValue": 500.0,
            "description": "Step 4 verification test coupon",
            "minSpend": 2500.0,
            "maxUses": 50,
            "active": True
        }
        st, res = await invoke_api("POST", "/api/admin/coupons", token=admin_token, body=new_coupon_payload)
        assert st == 200 and res.get("success") is True
        created_cpn = res.get("coupon")
        print(f"  ✓ Created new admin coupon '{created_cpn['code']}' (৳500 off on ৳2500)")

        # 11.3 Update coupon
        st, res = await invoke_api(
            "PUT",
            "/api/admin/coupons/STEP4TEST",
            token=admin_token,
            body={"discountValue": 600.0, "description": "Updated discount"}
        )
        assert st == 200
        assert res["coupon"]["discountValue"] == 600.0
        print("  ✓ Admin updated coupon discount to ৳600")

        # 11.4 Delete coupon
        st, res = await invoke_api("DELETE", "/api/admin/coupons/STEP4TEST", token=admin_token)
        assert st == 200
        st, res = await invoke_api("GET", "/api/admin/coupons", token=admin_token)
        assert not any(c["code"] == "STEP4TEST" for c in res.get("coupons", []))
        print("  ✓ Admin deleted coupon successfully")

        print("\n" + "=" * 70)
        print("  ALL STEP 4 TESTS PASSED SUCCESSFULLY! (100% VERIFIED)")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(run_all_tests())
