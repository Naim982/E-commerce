"""
Comprehensive Test Suite for STEP 2: Firebase Authentication & User Management.
Validates all endpoints, security constraints, role boundaries, and address CRUD operations.
"""

import sys
import os
import asyncio
import json

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, Address, Notification
from sqlalchemy import text


async def invoke_api(method: str, path: str, token: str = None, body: dict = None) -> tuple[int, dict]:
    """Helper to simulate an ASGI request against the FastAPI application."""
    headers = [[b"host", b"localhost:5000"]]
    if token:
        headers.append([b"authorization", f"Bearer {token}".encode("utf-8")])
    if body is not None:
        headers.append([b"content-type", b"application/json"])

    body_bytes = json.dumps(body).encode("utf-8") if body is not None else b""

    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": method.upper(),
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"" if "?" not in path else path.split("?")[1].encode("utf-8"),
        "headers": headers,
    }

    # Adjust path if query string present
    if "?" in scope["path"]:
        scope["path"] = scope["path"].split("?")[0]

    response = {"status": None, "headers": [], "body": b""}

    async def receive():
        return {"type": "http.request", "body": body_bytes, "more_body": False}

    async def send(message):
        if message["type"] == "http.response.start":
            response["status"] = message["status"]
            response["headers"] = message["headers"]
        elif message["type"] == "http.response.body":
            response["body"] += message.get("body", b"")

    await app(scope, receive, send)

    try:
        resp_json = json.loads(response["body"].decode("utf-8")) if response["body"] else {}
    except Exception:
        resp_json = {"raw": response["body"].decode("utf-8", errors="ignore")}

    return response["status"], resp_json


def setup_test_users():
    """Seeds test user and admin in PostgreSQL."""
    db = SessionLocal()
    try:
        # Clean previous test entities
        db.execute(text("TRUNCATE users, addresses, notifications CASCADE;"))
        db.commit()

        # Seed admin user
        admin_user = User(
            id="admin_uid_999",
            email="admin@lumenhardware.com",
            role="admin",
            name="System Administrator",
            first_name="System",
            last_name="Admin",
            is_active=True
        )
        db.add(admin_user)

        # Seed initial customer
        cust_user = User(
            id="customer_uid_101",
            email="customer@example.com",
            role="user",
            name="Alice Customer",
            first_name="Alice",
            last_name="Customer",
            phone="+8801700000001",
            is_active=True
        )
        db.add(cust_user)
        db.commit()
        print("[SETUP] Seeded test admin (admin_uid_999) and customer (customer_uid_101).")
    finally:
        db.close()


async def run_all_tests():
    print("=" * 70)
    print("  STEP 2: FIREBASE AUTH & USER MANAGEMENT — VERIFICATION SUITE")
    print("=" * 70)

    setup_test_users()

    # --------------------------------------------------------------------------
    # Test 1: Account Existence Endpoint
    # --------------------------------------------------------------------------
    print("\n[TEST 1] Account Existence Endpoint...")
    st, res = await invoke_api("GET", "/api/users/account-exists?email=nonexistent@example.com")
    assert st == 200 and res.get("exists") is False, f"Expected exists=False, got {res}"
    print("  ✓ Non-existent email returns exists: False")

    st, res = await invoke_api("GET", "/api/users/account-exists?email=customer@example.com")
    assert st == 200 and res.get("exists") is True, f"Expected exists=True, got {res}"
    print("  ✓ Existing email returns exists: True")

    # --------------------------------------------------------------------------
    # Test 2: User Creation & Privilege Escalation Prevention
    # --------------------------------------------------------------------------
    print("\n[TEST 2] User Creation & Role Enforcement...")
    payload = {
        "firebaseUid": "new_user_uid_202",
        "email": "bob@example.com",
        "role": "admin",  # Malicious attempt to self-assign admin role!
        "profile": {
            "firstName": "Bob",
            "lastName": "Builder",
            "email": "bob@example.com",
            "phone": "+8801800000002"
        }
    }
    st, res = await invoke_api("POST", "/api/users", body=payload)
    assert st == 201, f"Expected 201 Created, got {st}: {res}"
    user_created = res.get("user", {})
    assert user_created.get("id") == "new_user_uid_202"
    assert user_created.get("role") == "user", f"Security violation: role was not forced to 'user'! Got {user_created.get('role')}"
    print("  ✓ User created with role='user'. Malicious admin role assignment was blocked.")

    # --------------------------------------------------------------------------
    # Test 3: Unauthenticated & Invalid Token Rejection
    # --------------------------------------------------------------------------
    print("\n[TEST 3] Token Verification & Rejection...")
    st, res = await invoke_api("GET", "/api/auth/me")
    assert st == 401, f"Expected 401 Unauthorized for missing token, got {st}"
    print("  ✓ Missing token rejected with 401 Unauthorized")

    st, res = await invoke_api("GET", "/api/auth/me", token="invalid-malformed-token-string")
    assert st == 401, f"Expected 401 Unauthorized for invalid token, got {st}"
    print("  ✓ Malformed/invalid token rejected with 401 Unauthorized")

    # --------------------------------------------------------------------------
    # Test 4: Authenticated /auth/me Context
    # --------------------------------------------------------------------------
    print("\n[TEST 4] Authenticated /auth/me for User and Admin...")
    # Customer token
    st, res = await invoke_api("GET", "/api/auth/me", token="test-token-customer_uid_101")
    assert st == 200, f"Expected 200, got {st}: {res}"
    assert res.get("authenticated") is True
    assert res.get("role") == "user"
    assert res.get("isAdmin") is False
    assert res.get("user", {}).get("uid") == "customer_uid_101"
    print("  ✓ Customer /auth/me returned role='user' and isAdmin=False")

    # Admin token
    st, res = await invoke_api("GET", "/api/auth/me", token="test-token-admin_uid_999")
    assert st == 200, f"Expected 200, got {st}: {res}"
    assert res.get("authenticated") is True
    assert res.get("role") == "admin"
    assert res.get("isAdmin") is True
    assert "admin:all" in res.get("user", {}).get("permissions", [])
    print("  ✓ Admin /auth/me returned role='admin', isAdmin=True, and permissions=['admin:all']")

    # --------------------------------------------------------------------------
    # Test 5: Automatic User Synchronization on First Auth
    # --------------------------------------------------------------------------
    print("\n[TEST 5] Automatic Synchronization of Unregistered Firebase User...")
    st, res = await invoke_api("GET", "/api/auth/me", token="test-token-auto_synced_user_303")
    assert st == 200
    assert res.get("user", {}).get("uid") == "auto_synced_user_303"
    assert res.get("role") == "user"

    # Verify user exists in PostgreSQL
    db = SessionLocal()
    synced = db.query(User).filter(User.id == "auto_synced_user_303").first()
    assert synced is not None, "User was not created in PostgreSQL!"
    assert synced.role == "user"
    db.close()
    print("  ✓ New Firebase identity was automatically synchronized into PostgreSQL.")

    # --------------------------------------------------------------------------
    # Test 6: Cross-User Access Isolation (Security Rule)
    # --------------------------------------------------------------------------
    print("\n[TEST 6] Cross-Customer Authorization Boundaries...")
    # Customer 101 attempts to view Customer 202's profile
    st, res = await invoke_api("GET", "/api/users/new_user_uid_202", token="test-token-customer_uid_101")
    assert st == 403, f"Expected 403 Forbidden when accessing another user's profile, got {st}"
    print("  ✓ Cross-customer profile access blocked with 403 Forbidden")

    # Customer 101 viewing own profile
    st, res = await invoke_api("GET", "/api/users/customer_uid_101", token="test-token-customer_uid_101")
    assert st == 200 and res.get("id") == "customer_uid_101", f"Expected 200, got {st}"
    print("  ✓ Customer can view own profile")

    # Admin viewing Customer 202's profile
    st, res = await invoke_api("GET", "/api/users/new_user_uid_202", token="test-token-admin_uid_999")
    assert st == 200 and res.get("id") == "new_user_uid_202", f"Expected 200 for admin, got {st}"
    print("  ✓ Admin is permitted to view any customer profile")

    # --------------------------------------------------------------------------
    # Test 7: Profile Update
    # --------------------------------------------------------------------------
    print("\n[TEST 7] Customer Profile Update...")
    update_payload = {
        "firstName": "AliceUpdated",
        "lastName": "Wonderland",
        "phone": "+8801799999999"
    }
    st, res = await invoke_api("PATCH", "/api/users/customer_uid_101/profile", token="test-token-customer_uid_101", body=update_payload)
    assert st == 200 and res.get("success") is True, f"Expected 200, got {st}: {res}"
    assert res.get("profile", {}).get("firstName") == "AliceUpdated"
    assert res.get("profile", {}).get("avatarInitials") == "AW"
    print("  ✓ Profile updated successfully with avatarInitials recalculation ('AW')")

    # --------------------------------------------------------------------------
    # Test 8: Shipping Address CRUD Operations
    # --------------------------------------------------------------------------
    print("\n[TEST 8] Shipping Address Management...")

    # 8.1 Add First Address (should auto-become default)
    addr1_payload = {
        "label": "Home",
        "recipientName": "Alice Customer",
        "phone": "+8801700000001",
        "street": "Road 12, House 45",
        "apartment": "Flat 3B",
        "city": "Dhanmondi",
        "thana": "Dhanmondi",
        "district": "Dhaka",
        "postalCode": "1209",
        "country": "Bangladesh",
        "isDefault": False  # Should be forced to True as it's the first address
    }
    st, res = await invoke_api("POST", "/api/users/customer_uid_101/addresses", token="test-token-customer_uid_101", body=addr1_payload)
    assert st == 201, f"Expected 201, got {st}: {res}"
    addr1 = res.get("address", {})
    addr1_id = addr1.get("id")
    assert addr1.get("isDefault") is True, "First address did not automatically become default!"
    print(f"  ✓ First address added and auto-set as default (id={addr1_id})")

    # 8.2 Add Second Address with isDefault=True (should unset addr1 default)
    addr2_payload = {
        "label": "Office",
        "recipientName": "Alice Customer (Work)",
        "phone": "+8801700000001",
        "street": "Gulshan Avenue 1",
        "city": "Gulshan",
        "district": "Dhaka",
        "postalCode": "1212",
        "isDefault": True
    }
    st, res = await invoke_api("POST", "/api/users/customer_uid_101/addresses", token="test-token-customer_uid_101", body=addr2_payload)
    assert st == 201
    addr2 = res.get("address", {})
    addr2_id = addr2.get("id")
    assert addr2.get("isDefault") is True

    # Verify addr1 was toggled to False
    st, res = await invoke_api("GET", "/api/users/customer_uid_101/addresses", token="test-token-customer_uid_101")
    addrs = res.get("addresses", [])
    assert len(addrs) == 2
    for a in addrs:
        if a["id"] == addr1_id:
            assert a["isDefault"] is False, "Previous default address was not unset!"
        elif a["id"] == addr2_id:
            assert a["isDefault"] is True
    print("  ✓ Second default address added and previous default was correctly unset")

    # 8.3 Update Address
    update_addr_payload = {
        "phone": "+8801788888888",
        "instructions": "Leave at front desk"
    }
    st, res = await invoke_api("PATCH", f"/api/users/customer_uid_101/addresses/{addr1_id}", token="test-token-customer_uid_101", body=update_addr_payload)
    assert st == 200
    assert res.get("address", {}).get("instructions") == "Leave at front desk"
    print("  ✓ Address updated successfully")

    # 8.4 Set Default Address
    st, res = await invoke_api("PATCH", f"/api/users/customer_uid_101/addresses/{addr1_id}/default", token="test-token-customer_uid_101")
    assert st == 200
    print("  ✓ Default address switched back to addr1")

    # 8.5 Delete Address
    st, res = await invoke_api("DELETE", f"/api/users/customer_uid_101/addresses/{addr2_id}", token="test-token-customer_uid_101")
    assert st == 200
    st, res = await invoke_api("GET", "/api/users/customer_uid_101/addresses", token="test-token-customer_uid_101")
    assert len(res.get("addresses", [])) == 1
    print("  ✓ Address deleted successfully")

    # 8.6 Cross-User Address Modification Prevention
    st, res = await invoke_api("POST", "/api/users/new_user_uid_202/addresses", token="test-token-customer_uid_101", body=addr1_payload)
    assert st == 403, f"Expected 403 when adding address to another customer, got {st}"
    print("  ✓ Cross-customer address addition rejected with 403 Forbidden")

    # --------------------------------------------------------------------------
    # Test 9: Notifications Management
    # --------------------------------------------------------------------------
    print("\n[TEST 9] Notification Status Updates...")
    # Seed notification
    db = SessionLocal()
    notif = Notification(
        user_id="customer_uid_101",
        title="Order Dispatched",
        message="Your package is out for delivery",
        is_read=False
    )
    db.add(notif)
    db.commit()
    notif_id = notif.id
    db.close()

    # Get notifications
    st, res = await invoke_api("GET", "/api/users/customer_uid_101/notifications", token="test-token-customer_uid_101")
    assert st == 200 and len(res.get("notifications", [])) >= 1
    print("  ✓ Customer notifications fetched")

    # Mark all read
    st, res = await invoke_api("PATCH", "/api/users/customer_uid_101/notifications", token="test-token-customer_uid_101", body={"markAllRead": True})
    assert st == 200 and res.get("success") is True
    for n in res.get("notifications", []):
        assert n.get("isRead") is True
    print("  ✓ Notification statuses marked as read")

    print("\n" + "=" * 70)
    print("  ALL STEP 2 TESTS PASSED SUCCESSFULLY! (100% VERIFIED)")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
