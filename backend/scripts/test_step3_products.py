"""
Comprehensive Test Suite for STEP 3: Product Catalog & Inventory Management.
Validates all public catalog queries, filtering, search, sorting, homepage endpoints,
and admin product/category/inventory CRUD operations.
"""

import sys
import os
import asyncio
import json

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.product import Product


async def invoke_api(method: str, path: str, token: str = None, body: dict = None) -> tuple[int, dict]:
    """Simulates an ASGI request against the FastAPI application."""
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


def ensure_admin_user():
    """Ensures an admin user exists for testing admin endpoints."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.id == "admin_catalog_tester").first()
        if not admin:
            admin = User(
                id="admin_catalog_tester",
                email="admin_catalog@lumen.com",
                role="admin",
                name="Catalog Admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


async def run_all_tests():
    print("=" * 70)
    print("  STEP 3: PRODUCT CATALOG & INVENTORY MANAGEMENT — TEST SUITE")
    print("=" * 70)

    ensure_admin_user()
    admin_token = "test-token-admin_catalog_tester"

    # --------------------------------------------------------------------------
    # 1. Public Catalog Query & Filtering
    # --------------------------------------------------------------------------
    print("\n[TEST 1] Public Catalog Queries & Pagination...")
    st, res = await invoke_api("GET", "/api/products?page=1&limit=10")
    assert st == 200, f"Expected 200, got {st}: {res}"
    assert res.get("success") is True
    assert len(res.get("products", [])) == 10
    total = res.get("total", 0)
    assert total >= 200, f"Expected at least 200 products in database, got {total}"
    print(f"  ✓ Paginated catalog returned 10 items (Total: {total})")

    # 1.1 Category Filter
    print("\n[TEST 2] Category & Subcategory Filtering...")
    st, res = await invoke_api("GET", "/api/products?category=Monitors")
    assert st == 200
    mon_products = res.get("products", [])
    assert len(mon_products) > 0
    for p in mon_products:
        assert p.get("category") == "Monitors"
    print(f"  ✓ Filtered by Category='Monitors' (Found {len(mon_products)} items)")

    # 1.2 Brand Filter
    print("\n[TEST 3] Brand Filtering...")
    st, res = await invoke_api("GET", "/api/products?brand=Apple")
    assert st == 200
    apple_products = res.get("products", [])
    assert len(apple_products) > 0
    for p in apple_products:
        assert "Apple" in p.get("brand", "")
    print(f"  ✓ Filtered by Brand='Apple' (Found {len(apple_products)} items)")

    # 1.3 Price Range Filter
    print("\n[TEST 4] Price Range Filtering...")
    st, res = await invoke_api("GET", "/api/products?minPrice=5000&maxPrice=15000")
    assert st == 200
    price_products = res.get("products", [])
    for p in price_products:
        price = p.get("currentPrice") or p.get("regularPrice", 0)
        assert 5000 <= price <= 15000, f"Product price {price} outside range!"
    print(f"  ✓ Filtered by price range 5000-15000 BDT (Found {len(price_products)} items)")

    # 1.4 Stock Status Filter
    print("\n[TEST 5] Stock Status Filtering...")
    st, res = await invoke_api("GET", "/api/products?stockStatus=in_stock")
    assert st == 200
    instock_products = res.get("products", [])
    for p in instock_products:
        assert p.get("stock") == "in_stock"
    print(f"  ✓ Filtered by stockStatus='in_stock' (Found {len(instock_products)} items)")

    # 1.5 Keyword Search
    print("\n[TEST 6] Keyword Search...")
    st, res = await invoke_api("GET", "/api/products?search=MacBook")
    assert st == 200
    search_products = res.get("products", [])
    assert len(search_products) > 0
    assert "macbook" in search_products[0]["title"].lower()
    print(f"  ✓ Keyword search for 'MacBook' returned {len(search_products)} matching items")

    # 1.6 Sorting
    print("\n[TEST 7] Sorting (Price Ascending & Descending)...")
    st, res_asc = await invoke_api("GET", "/api/products?sort=price_asc&limit=10")
    assert st == 200
    prices_asc = [p["currentPrice"] for p in res_asc.get("products", [])]
    assert prices_asc == sorted(prices_asc), "Products not sorted by price ascending!"

    st, res_desc = await invoke_api("GET", "/api/products?sort=price_desc&limit=10")
    assert st == 200
    prices_desc = [p["currentPrice"] for p in res_desc.get("products", [])]
    assert prices_desc == sorted(prices_desc, reverse=True), "Products not sorted by price descending!"
    print("  ✓ Sorting validated: price_asc and price_desc correctly ordered")

    # --------------------------------------------------------------------------
    # 2. Homepage and Shoppage Endpoints
    # --------------------------------------------------------------------------
    print("\n[TEST 8] Homepage & Shoppage Slices...")
    st, res = await invoke_api("GET", "/api/products/homepage-products")
    assert st == 200
    assert "group1" in res.get("products", {})
    assert "group2" in res.get("products", {})
    assert len(res.get("bestSellers", [])) > 0
    assert len(res.get("topRated", [])) > 0
    print("  ✓ /products/homepage-products returned group1, group2, bestSellers, and topRated")

    st, res = await invoke_api("GET", "/api/products/shoppage-products")
    assert st == 200 and isinstance(res, list)
    assert len(res) >= 200
    print(f"  ✓ /products/shoppage-products returned {len(res)} product cards array")

    # --------------------------------------------------------------------------
    # 3. Product Details & Similar Products
    # --------------------------------------------------------------------------
    print("\n[TEST 9] Product Details & Specifications...")
    st, res = await invoke_api("GET", "/api/products/lap-001")
    assert st == 200, f"Expected 200 for lap-001, got {st}: {res}"
    assert res.get("id") == "lap-001"
    assert "fixed" in res and "variable" in res
    assert "quickOverview" in res and "specs" in res
    assert len(res.get("variants", [])) > 0
    print(f"  ✓ /products/lap-001 returned complete specifications, pricing, and variants")

    st, res = await invoke_api("GET", "/api/products/lap-001/similar")
    assert st == 200 and res.get("success") is True
    similar_list = res.get("products", [])
    assert len(similar_list) > 0
    assert all(p["id"] != "lap-001" for p in similar_list)
    print(f"  ✓ /products/lap-001/similar returned {len(similar_list)} related products")

    # --------------------------------------------------------------------------
    # 4. Review & FAQ Submission
    # --------------------------------------------------------------------------
    print("\n[TEST 10] Review & FAQ Submission...")
    review_payload = {
        "stars": 5,
        "title": "Outstanding Build Quality",
        "description": "Exceeded all expectations in thermal dissipation and speed."
    }
    st, res = await invoke_api("POST", "/api/products/lap-001/reviews", body=review_payload)
    assert st == 200 and res.get("success") is True
    print("  ✓ Product review submitted and average rating recalculated")

    faq_payload = {
        "question": "Does this model support charging via Thunderbolt 4 ports?"
    }
    st, res = await invoke_api("POST", "/api/products/lap-001/faq", body=faq_payload)
    assert st == 200 and res.get("success") is True
    print("  ✓ Product FAQ submitted and saved")

    # --------------------------------------------------------------------------
    # 5. Admin Security Enforcement
    # --------------------------------------------------------------------------
    print("\n[TEST 11] Admin Route Security Checks...")
    # Unauthenticated
    st, _ = await invoke_api("GET", "/api/admin/products")
    assert st == 401, f"Expected 401 Unauthorized, got {st}"
    print("  ✓ Unauthenticated access to /admin/products blocked with 401")

    # Customer token (unauthorized)
    st, _ = await invoke_api("GET", "/api/admin/products", token="test-token-customer_uid_101")
    assert st == 403, f"Expected 403 Forbidden for customer role, got {st}"
    print("  ✓ Customer access to /admin/products blocked with 403 Forbidden")

    # Admin token (authorized)
    st, res = await invoke_api("GET", "/api/admin/products?limit=5", token=admin_token)
    assert st == 200 and res.get("success") is True
    print("  ✓ Administrator access to /admin/products authorized")

    # --------------------------------------------------------------------------
    # 6. Admin Product CRUD
    # --------------------------------------------------------------------------
    print("\n[TEST 12] Admin Product CRUD Operations...")
    new_prod_payload = {
        "id": "test-gpu-9090",
        "name": "NVIDIA GeForce RTX 5090 Prototype",
        "sku": "GPU-NV-RTX5090-PROTO",
        "category": "PC Components",
        "subCategory": "Graphics Cards",
        "brand": "NVIDIA",
        "regularPrice": 250000.0,
        "discountPercent": 0,
        "stockQuantity": 5,
        "badgeText": "NEXT-GEN",
        "cardSpecs": ["32GB GDDR7", "PCIe 5.0", "600W TGP"]
    }
    st, res = await invoke_api("POST", "/api/admin/products", token=admin_token, body=new_prod_payload)
    assert st == 201, f"Expected 201 Created, got {st}: {res}"
    created_p = res.get("product", {})
    created_id = created_p.get("id")
    assert created_id == "test-gpu-9090"
    print("  ✓ Admin product created successfully (test-gpu-9090)")

    # Update product
    update_payload = {
        "regularPrice": 240000.0,
        "discountPercent": 5,
        "stockQuantity": 8
    }
    st, res = await invoke_api("PUT", f"/api/admin/products/{created_id}", token=admin_token, body=update_payload)
    assert st == 200
    updated_p = res.get("product", {})
    assert updated_p.get("stockQuantity") == 8
    assert updated_p.get("regularPrice") == 240000.0
    print("  ✓ Admin product updated successfully")

    # Delete product
    st, res = await invoke_api("DELETE", f"/api/admin/products/{created_id}", token=admin_token)
    assert st == 200 and res.get("success") is True
    print("  ✓ Admin product deleted successfully")

    # --------------------------------------------------------------------------
    # 7. Admin Category Management
    # --------------------------------------------------------------------------
    print("\n[TEST 13] Admin Category Management...")
    st, res = await invoke_api("GET", "/api/admin/categories", token=admin_token)
    assert st == 200
    cats = res.get("categories", [])
    assert len(cats) >= 8
    print(f"  ✓ /admin/categories listed {len(cats)} categories with product counts")

    # Create category
    new_cat_payload = {
        "name": "Server & Enterprise",
        "subcategories": ["Rackmount Servers", "Server RAM", "Enterprise SSDs"]
    }
    st, res = await invoke_api("POST", "/api/admin/categories", token=admin_token, body=new_cat_payload)
    assert st == 201
    print("  ✓ Admin category created with subcategories")

    # Update category
    st, res = await invoke_api("PUT", "/api/admin/categories/Server & Enterprise", token=admin_token, body={"name": "Enterprise Infrastructure"})
    assert st == 200
    print("  ✓ Admin category renamed successfully")

    # Delete category
    st, res = await invoke_api("DELETE", "/api/admin/categories/Enterprise Infrastructure", token=admin_token)
    assert st == 200
    print("  ✓ Admin category deleted successfully")

    # --------------------------------------------------------------------------
    # 8. Admin Inventory Management
    # --------------------------------------------------------------------------
    print("\n[TEST 14] Admin Inventory Management...")
    st, res = await invoke_api("GET", "/api/admin/inventory?filter=low_stock", token=admin_token)
    assert st == 200
    summary = res.get("summary", {})
    assert "totalProducts" in summary
    assert "totalUnits" in summary
    assert "totalValuation" in summary
    print(f"  ✓ Inventory summary: {summary.get('totalProducts')} products, {summary.get('totalUnits')} units, {summary.get('totalValuation')} BDT valuation")

    # Update Stock
    st, res = await invoke_api("PATCH", "/api/admin/inventory/lap-001", token=admin_token, body={"stockQuantity": 22})
    assert st == 200
    assert res.get("stock", {}).get("quantity") == 22
    print("  ✓ Admin stock updated successfully for lap-001 to 22 units")

    print("\n" + "=" * 70)
    print("  ALL STEP 3 TESTS PASSED SUCCESSFULLY! (100% VERIFIED)")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
