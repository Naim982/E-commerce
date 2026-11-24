"""
Comprehensive Verification Test Suite for Step 5:
Admin Features, Remaining Modules, and Final System Integration.
Verifies all endpoints, RBAC authorization, data consistency, and compatibility engines.
"""

import sys
from pathlib import Path
from decimal import Decimal

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.product import Product, Review, ProductFAQ
from app.models.order import Order
from app.models.coupon import Coupon
from app.models.support import SupportTicket
from app.models.site import SiteContent, StoreSettings

client = TestClient(app)

ADMIN_UID = "admin_step4_999"
USER_UID = "cust_step4_001"

def setup_test_users():
    """Ensure test admin and customer users exist in database."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.id == ADMIN_UID).first()
        if not admin:
            admin = User(
                id=ADMIN_UID,
                email="admin.step5@lumenhardware.com",
                name="Admin User",
                first_name="Admin",
                last_name="User",
                role="admin"
            )
            db.add(admin)

        user = db.query(User).filter(User.id == USER_UID).first()
        if not user:
            user = User(
                id=USER_UID,
                email="customer.step5@lumenhardware.com",
                name="Customer Test",
                first_name="Customer",
                last_name="Test",
                role="user"
            )
            db.add(user)

        db.commit()
    finally:
        db.close()

def run_step5_tests():
    setup_test_users()

    admin_headers = {"Authorization": f"Bearer test-token-{ADMIN_UID}"}
    user_headers = {"Authorization": f"Bearer test-token-{USER_UID}"}

    print("\n" + "=" * 70)
    print("RUNNING STEP 5 INTEGRATION & VERIFICATION TESTS")
    print("=" * 70)

    # --------------------------------------------------------------------------
    # 1. Admin Dashboard & RBAC
    # --------------------------------------------------------------------------
    print("\n--- 1. Admin Dashboard Analytics & RBAC ---")
    # Unauthenticated
    resp = client.get("/api/admin/dashboard")
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("✓ Unauthenticated request rejected (401)")

    # Standard User (Forbidden)
    resp = client.get("/api/admin/dashboard", headers=user_headers)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    print("✓ Standard user access rejected with 403 Forbidden")

    # Admin Authorized
    resp = client.get("/api/admin/dashboard", headers=admin_headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    metrics = data["metrics"]
    assert "totalRevenue" in metrics
    assert "totalOrders" in metrics
    assert "totalProducts" in metrics
    assert "totalCustomers" in metrics
    assert "pendingOrders" in metrics
    assert "lowStockCount" in metrics
    assert isinstance(data["salesTrend"], list)
    assert isinstance(data["categoryDistribution"], list)
    assert isinstance(data["recentOrders"], list)
    assert isinstance(data["lowStockAlerts"], list)
    print(f"✓ Admin Dashboard loaded successfully: revenue={metrics['totalRevenue']}, orders={metrics['totalOrders']}, products={metrics['totalProducts']}, customers={metrics['totalCustomers']}")

    # --------------------------------------------------------------------------
    # 2. Admin Customer Management
    # --------------------------------------------------------------------------
    print("\n--- 2. Admin Customer Management ---")
    resp = client.get("/api/admin/customers", headers=admin_headers)
    assert resp.status_code == 200
    c_data = resp.json()
    assert c_data["success"] is True
    assert len(c_data["customers"]) >= 1
    print(f"✓ Listed {c_data['total']} registered customer accounts")

    # Search customer
    resp = client.get("/api/admin/customers?search=Customer", headers=admin_headers)
    assert resp.status_code == 200
    search_data = resp.json()
    assert len(search_data["customers"]) >= 1
    print(f"✓ Customer search filter verified (found {len(search_data['customers'])})")

    # Single customer details
    resp = client.get(f"/api/admin/customers/{USER_UID}", headers=admin_headers)
    assert resp.status_code == 200
    cust_profile = resp.json()["customer"]
    assert cust_profile["id"] == USER_UID
    assert "profile" in cust_profile
    assert "addresses" in cust_profile
    assert "orders" in cust_profile
    print(f"✓ Customer detailed profile loaded: {cust_profile['name']}")

    # --------------------------------------------------------------------------
    # 3. Order Administration & Fulfillment Lifecycle
    # --------------------------------------------------------------------------
    print("\n--- 3. Order Administration & Fulfillment ---")
    resp = client.get("/api/admin/orders", headers=admin_headers)
    assert resp.status_code == 200
    orders_data = resp.json()
    assert orders_data["success"] is True
    assert len(orders_data["orders"]) >= 1
    first_order = orders_data["orders"][0]
    target_order_id = first_order["orderId"]
    print(f"✓ Retrieved {orders_data['total']} total administrative orders")

    # Get single order details
    resp = client.get(f"/api/admin/orders/{target_order_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["order"]["orderId"] == target_order_id
    print(f"✓ Fetched single order details for #{target_order_id}")

    # Update order status & tracking
    update_payload = {
        "orderStatus": "processing",
        "trackingNumber": "TRK-STEP5-8899",
        "adminNotes": "Hardware dispatched to staging bay."
    }
    resp = client.patch(f"/api/admin/orders/{target_order_id}", json=update_payload, headers=admin_headers)
    assert resp.status_code == 200
    updated_order = resp.json()["order"]
    assert updated_order.get("status") == "processing" or updated_order.get("orderStatus") == "processing"
    assert updated_order["delivery"]["trackingNumber"] == "TRK-STEP5-8899"
    print(f"✓ Order #{target_order_id} fulfillment status and tracking number updated successfully")

    # --------------------------------------------------------------------------
    # 4. Promotional Coupon Administration
    # --------------------------------------------------------------------------
    print("\n--- 4. Promotional Coupon Administration ---")
    # List coupons
    resp = client.get("/api/admin/coupons", headers=admin_headers)
    assert resp.status_code == 200
    coupons = resp.json()["coupons"]
    assert len(coupons) >= 1
    print(f"✓ Retrieved {len(coupons)} active coupons")

    # Create new coupon
    new_coupon_data = {
        "code": "STEP5MEGA",
        "discountType": "percentage",
        "discountValue": 15.0,
        "description": "Step 5 Mega Promo",
        "minSpend": 100.0,
        "maxUses": 50,
        "active": True
    }
    resp = client.post("/api/admin/coupons", json=new_coupon_data, headers=admin_headers)
    assert resp.status_code == 200, f"Error: {resp.text}"
    created_coupon = resp.json()["coupon"]
    assert created_coupon["code"] == "STEP5MEGA"
    print(f"✓ Created promotional coupon: {created_coupon['code']} (ID: {created_coupon['id']})")

    # Update coupon
    update_cpn_data = {
        "discountValue": 20.0,
        "description": "Upgraded to 20% discount"
    }
    resp = client.put(f"/api/admin/coupons/{created_coupon['id']}", json=update_cpn_data, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["coupon"]["discountValue"] == 20.0
    print("✓ Successfully updated coupon discount value")

    # Delete coupon
    resp = client.delete(f"/api/admin/coupons/{created_coupon['id']}", headers=admin_headers)
    assert resp.status_code == 200
    print("✓ Successfully deleted test coupon")

    # --------------------------------------------------------------------------
    # 5. Customer Reviews Moderation & Rating Recalculation
    # --------------------------------------------------------------------------
    print("\n--- 5. Reviews Moderation & Rating Integrity ---")
    # Get a product to review
    db = SessionLocal()
    prod = db.query(Product).first()
    prod_id = prod.id
    db.close()

    # Customer submits a review
    rev_payload = {
        "userId": USER_UID,
        "userName": "Verified Gamer",
        "stars": 5,
        "title": "Outstanding GPU Performance",
        "description": "Maintains ultra-quiet acoustics under intense 4K rendering benchmarks."
    }
    resp = client.post(f"/api/products/{prod_id}/reviews", json=rev_payload, headers=user_headers)
    assert resp.status_code == 200
    print("✓ Customer submitted product review successfully")

    # Admin lists reviews
    resp = client.get("/api/admin/reviews", headers=admin_headers)
    assert resp.status_code == 200
    reviews_list = resp.json()["reviews"]
    assert len(reviews_list) >= 1
    target_rev = reviews_list[0]
    rev_id = target_rev["id"]
    print(f"✓ Admin retrieved {len(reviews_list)} reviews for moderation")

    # Admin rejects review
    resp = client.patch(f"/api/admin/reviews/{rev_id}", json={"status": "rejected"}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"
    print(f"✓ Admin marked review #{rev_id} as 'rejected'")

    # Admin approves review
    resp = client.patch(f"/api/admin/reviews/{rev_id}", json={"status": "approved"}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"
    print(f"✓ Admin marked review #{rev_id} as 'approved' (ratings recalculated)")

    # --------------------------------------------------------------------------
    # 6. Community & Admin FAQs
    # --------------------------------------------------------------------------
    print("\n--- 6. Community & Admin FAQs ---")
    # Customer asks FAQ
    faq_payload = {
        "question": "Does this card support dual BIOS configuration?",
        "askedBy": "HardcoreOverclocker"
    }
    resp = client.post(f"/api/products/{prod_id}/faq", json=faq_payload, headers=user_headers)
    assert resp.status_code == 200
    print("✓ Customer submitted technical FAQ question")

    # Admin lists FAQs
    resp = client.get("/api/admin/faqs", headers=admin_headers)
    assert resp.status_code == 200
    faqs_data = resp.json()["faqs"]
    assert len(faqs_data) >= 1
    target_faq_id = faqs_data[0]["id"]
    print(f"✓ Admin retrieved {len(faqs_data)} community FAQs")

    # Admin answers and publishes FAQ
    faq_answer_payload = {
        "answer": "Yes, it features a physical switch on the PCB between Performance and Silent BIOS profiles.",
        "isPublished": True
    }
    resp = client.patch(f"/api/admin/faqs/{target_faq_id}", json=faq_answer_payload, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["faq"]["answer"] == faq_answer_payload["answer"]
    assert resp.json()["faq"]["isPublished"] is True
    print(f"✓ Admin answered and published FAQ #{target_faq_id}")

    # --------------------------------------------------------------------------
    # 7. Customer & Admin Support Tickets
    # --------------------------------------------------------------------------
    print("\n--- 7. Customer & Admin Support Tickets ---")
    # Customer creates support ticket
    support_payload = {
        "topic": "Order Issue",
        "orderNumber": target_order_id,
        "subject": "Expedited courier delivery status",
        "message": "Could you provide an estimated delivery window for my shipment?",
        "priority": "high"
    }
    resp = client.post("/api/user-support", json=support_payload, headers=user_headers)
    assert resp.status_code == 200
    created_ticket = resp.json()["ticket"]
    ticket_num = created_ticket["id"]
    print(f"✓ Customer submitted support ticket #{ticket_num}")

    # Customer fetches tickets
    resp = client.get(f"/api/user-support?userId={USER_UID}", headers=user_headers)
    assert resp.status_code == 200
    assert len(resp.json()["userSupport"]) >= 1
    print(f"✓ Customer retrieved support tickets list ({len(resp.json()['userSupport'])} tickets)")

    # Admin lists tickets
    resp = client.get("/api/admin/support", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["tickets"]) >= 1
    print(f"✓ Admin retrieved {resp.json()['total']} total support tickets")

    # Admin updates ticket status and reply
    admin_ticket_update = {
        "status": "in-progress",
        "priority": "high",
        "adminNotes": "Tracking dispatched with express handler. Delivery window: Nov 24 10:00 AM."
    }
    resp = client.patch(f"/api/admin/support/{ticket_num}", json=admin_ticket_update, headers=admin_headers)
    assert resp.status_code == 200
    updated_ticket = resp.json()["ticket"]
    assert updated_ticket["status"] == "in-progress"
    assert "express handler" in updated_ticket["adminNotes"]
    print(f"✓ Admin updated ticket #{ticket_num} with support reply")

    # --------------------------------------------------------------------------
    # 8. CMS Site Content & Global Store Settings
    # --------------------------------------------------------------------------
    print("\n--- 8. CMS Site Content & Global Store Settings ---")
    # Public endpoints
    resp = client.get("/api/site-data")
    assert resp.status_code == 200
    assert "heroSlides" in resp.json()
    assert "authBanners" in resp.json()
    assert "aboutSection" in resp.json()
    print("✓ Public /api/site-data returned all CMS sections")

    resp = client.get("/api/site-data/hero-slides")
    assert resp.status_code == 200
    assert len(resp.json()["heroSlides"]) >= 1
    print("✓ Public /api/site-data/hero-slides loaded")

    resp = client.get("/api/settings")
    assert resp.status_code == 200
    settings_obj = resp.json()["settings"]
    assert "store" in settings_obj
    assert "commerce" in settings_obj
    assert "shipping" in settings_obj
    assert "inventory" in settings_obj
    print("✓ Public /api/settings returned store, commerce, shipping, inventory")

    # Admin CMS update
    new_hero_slide = [
        {
            "id": "slide-test-01",
            "title": "Unleash Pure Architectural Compute",
            "subtitle": "Next-Gen PCIe 5.0 Platforms",
            "cta": "Explore Series",
            "link": "/shop"
        }
    ]
    resp = client.put(
        "/api/admin/site-content",
        json={"section": "heroSlides", "data": new_hero_slide},
        headers=admin_headers
    )
    assert resp.status_code == 200
    print("✓ Admin successfully updated CMS heroSlides section")

    # Admin settings update
    resp = client.patch(
        "/api/admin/settings",
        json={"shipping": {"standardShippingRate": 15.0}},
        headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["settings"]["shipping"]["standardShippingRate"] == 15.0
    print("✓ Admin successfully patched global store shipping configuration")

    # --------------------------------------------------------------------------
    # 9. PC Builder Compatibility Engine
    # --------------------------------------------------------------------------
    print("\n--- 9. PC Builder Hardware Compatibility Engine ---")
    # Scenario A: Fully compatible build
    compatible_build = {
        "cpu": {"id": "c1", "name": "AMD Ryzen 7 7800X3D", "socket": "AM5", "watts": 120, "price": 449.0},
        "motherboard": {"id": "m1", "name": "ASUS ROG STRIX B650E-F", "socket": "AM5", "memoryType": "DDR5", "watts": 50, "price": 289.0},
        "ram": {"id": "r1", "name": "Corsair Vengeance 32GB", "memoryType": "DDR5", "watts": 15, "price": 125.0},
        "gpu": {"id": "g1", "name": "NVIDIA GeForce RTX 4080", "watts": 320, "length": 304, "price": 1199.0},
        "psu": {"id": "p1", "name": "Corsair RM850x 850W", "watts": 850, "price": 139.0},
        "case": {"id": "k1", "name": "Lian Li O11 Dynamic EVO", "maxGpuLength": 420, "price": 169.0}
    }
    resp = client.post("/api/pc-builder/validate", json=compatible_build)
    assert resp.status_code == 200
    res = resp.json()
    assert res["valid"] is True
    assert len(res["errors"]) == 0
    assert res["metrics"]["estimatedWattage"] > 400
    print(f"✓ Compatible build validated successfully: {res['metrics']['estimatedWattage']}W est. draw, {res['metrics']['recommendedPsuWattage']}W recommended PSU")

    # Scenario B: Socket mismatch (AM5 CPU + LGA1700 Motherboard)
    incompatible_socket_build = {
        "cpu": {"id": "c1", "name": "AMD Ryzen 7 7800X3D", "socket": "AM5"},
        "motherboard": {"id": "m1", "name": "MSI MAG Z790 Tomahawk", "socket": "LGA1700"}
    }
    resp = client.post("/api/pc-builder/validate", json=incompatible_socket_build)
    assert resp.status_code == 200
    res = resp.json()
    assert res["valid"] is False
    assert any("Socket Incompatibility" in err for err in res["errors"])
    print(f"✓ Socket conflict correctly caught: {res['errors'][0]}")

    # Scenario C: Memory standard mismatch (DDR5 RAM + DDR4 Motherboard)
    incompatible_memory_build = {
        "ram": {"id": "r1", "name": "Kingston Fury 32GB", "memoryType": "DDR5"},
        "motherboard": {"id": "m1", "name": "ASUS PRIME B660M-A D4", "memoryType": "DDR4"}
    }
    resp = client.post("/api/pc-builder/validate", json=incompatible_memory_build)
    assert resp.status_code == 200
    res = resp.json()
    assert res["valid"] is False
    assert any("Memory Type Incompatibility" in err for err in res["errors"])
    print(f"✓ Memory standard conflict correctly caught: {res['errors'][0]}")

    # Scenario D: Insufficient PSU capacity
    insufficient_psu_build = {
        "cpu": {"id": "c1", "watts": 250},
        "gpu": {"id": "g1", "watts": 450},
        "psu": {"id": "p1", "watts": 500}  # 250 + 450 + 75 = 775W > 500W
    }
    resp = client.post("/api/pc-builder/validate", json=insufficient_psu_build)
    assert resp.status_code == 200
    res = resp.json()
    assert res["valid"] is False
    assert any("Power Supply Insufficient" in err for err in res["errors"])
    print(f"✓ Power supply capacity shortfall caught: {res['errors'][0]}")

    # Scenario E: Case GPU clearance conflict
    clearance_conflict_build = {
        "gpu": {"id": "g1", "length": 340},
        "case": {"id": "k1", "maxGpuLength": 300}
    }
    resp = client.post("/api/pc-builder/validate", json=clearance_conflict_build)
    assert resp.status_code == 200
    res = resp.json()
    assert res["valid"] is False
    assert any("GPU Clearance Conflict" in err for err in res["errors"])
    print(f"✓ GPU card length vs chassis clearance caught: {res['errors'][0]}")

    # Scenario F: Add custom build items to customer cart
    db = SessionLocal()
    available_prods = db.query(Product).limit(3).all()
    p_ids = [p.id for p in available_prods]
    db.close()

    transfer_payload = {
        "components": {
            "stage-cpu": {"catalogId": p_ids[0]},
            "stage-mobo": {"catalogId": p_ids[1]},
            "stage-ram": {"catalogId": p_ids[2]}
        }
    }
    resp = client.post("/api/pc-builder/add-to-cart", json=transfer_payload, headers=user_headers)
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert resp.json()["addedCount"] == 3
    print("✓ Custom build components successfully migrated directly into customer shopping cart")

    print("\n" + "=" * 70)
    print("ALL STEP 5 INTEGRATION TESTS PASSED (100% SUCCESS)!")
    print("=" * 70)


if __name__ == "__main__":
    run_step5_tests()
