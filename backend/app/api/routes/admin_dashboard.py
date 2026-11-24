"""
Administrative Dashboard Analytics and Customer Management Endpoints.
Guarded by require_admin dependency.
Calculates revenue, order volumes, inventory alerts, and customer activity directly from PostgreSQL.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc, func, extract
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User, Address
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.category import Category
from app.api.routes.orders import format_order

router = APIRouter(tags=["Admin Dashboard & Customers"])


# ==============================================================================
# 1. ADMIN DASHBOARD METRICS
# ==============================================================================

@router.get("/admin/dashboard", summary="Get comprehensive store operations dashboard metrics")
def get_dashboard_metrics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Computes live business intelligence metrics directly from PostgreSQL:
    - Gross revenue from non-cancelled orders
    - Total orders & pending orders count
    - Total catalog products & total registered customers
    - Monthly revenue sales trend
    - Product category distribution percentages
    - Recent store orders (last 5)
    - Low-stock inventory alerts (stock <= 5)
    """
    # 1. Revenue & Order Counts
    non_cancelled_statuses = ["pending", "processing", "shipped", "delivered"]
    
    total_rev_query = db.query(func.coalesce(func.sum(Order.total_amount), Decimal("0.00"))).filter(
        Order.status.in_(non_cancelled_statuses)
    ).scalar()
    total_revenue = float(total_rev_query or 0.0)

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    pending_orders = db.query(func.count(Order.id)).filter(
        Order.status.in_(["pending", "processing"])
    ).scalar() or 0

    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_customers = db.query(func.count(User.id)).filter(User.role == "user").scalar() or 0

    # 2. Low-stock inventory count & alerts (stock <= 5)
    LOW_STOCK_THRESHOLD = 5
    low_stock_query = db.query(Product).options(
        joinedload(Product.category)
    ).filter(
        Product.stock_quantity <= LOW_STOCK_THRESHOLD
    ).order_by(asc(Product.stock_quantity))

    low_stock_count = low_stock_query.count()
    low_stock_alerts_records = low_stock_query.limit(10).all()

    low_stock_alerts = [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category.name if p.category else "Hardware",
            "quantity": p.stock_quantity,
            "status": "out_of_stock" if p.stock_quantity == 0 else "low_stock"
        }
        for p in low_stock_alerts_records
    ]

    # 3. Monthly Sales Trend (Group by Year & Month)
    # Using SQL extract for PostgreSQL
    sales_trend_rows = db.query(
        extract("year", Order.created_at).label("yr"),
        extract("month", Order.created_at).label("mo"),
        func.sum(Order.total_amount).label("rev"),
        func.count(Order.id).label("cnt")
    ).filter(
        Order.status.in_(non_cancelled_statuses)
    ).group_by(
        "yr", "mo"
    ).order_by(
        "yr", "mo"
    ).all()

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    sales_trend = []
    for row in sales_trend_rows:
        yr = int(row.yr)
        mo = int(row.mo)
        label = f"{month_names[mo - 1]} {yr}"
        period = f"{yr:04d}-{mo:02d}"
        sales_trend.append({
            "period": period,
            "label": label,
            "revenue": round(float(row.rev or 0.0), 2),
            "orders": int(row.cnt or 0)
        })

    # If no orders yet, provide reasonable placeholder structure
    if not sales_trend:
        sales_trend = [
            {"period": "2026-11", "label": "Nov 2026", "revenue": 0.0, "orders": 0}
        ]

    # 4. Category Distribution
    cat_counts = db.query(
        Category.name,
        func.count(Product.id).label("prod_count")
    ).join(
        Product, Product.category_id == Category.id
    ).group_by(
        Category.name
    ).order_by(
        desc("prod_count")
    ).all()

    category_distribution = []
    if total_products > 0:
        for cat_name, cnt in cat_counts:
            pct = round((cnt / total_products) * 100, 1)
            category_distribution.append({
                "category": cat_name,
                "count": cnt,
                "percentage": pct
            })

    # 5. Recent Orders (last 5)
    recent_orders_records = db.query(Order).options(
        joinedload(Order.user)
    ).order_by(
        desc(Order.created_at)
    ).limit(5).all()

    recent_orders = []
    for o in recent_orders_records:
        user_name = "Customer"
        user_email = ""
        if o.user:
            user_name = o.user.name or f"{o.user.first_name or ''} {o.user.last_name or ''}".strip() or "Customer"
            user_email = o.user.email or ""

        recent_orders.append({
            "orderId": o.order_number or o.id,
            "customerName": user_name,
            "customerEmail": user_email,
            "orderDate": o.created_at.isoformat() if o.created_at else "",
            "cost": {
                "grandTotal": float(o.total_amount)
            },
            "orderStatus": o.status
        })

    return {
        "success": True,
        "metrics": {
            "totalRevenue": total_revenue,
            "totalOrders": total_orders,
            "pendingOrders": pending_orders,
            "totalProducts": total_products,
            "totalCustomers": total_customers,
            "lowStockCount": low_stock_count
        },
        "salesTrend": sales_trend,
        "categoryDistribution": category_distribution,
        "recentOrders": recent_orders,
        "lowStockAlerts": low_stock_alerts
    }


# ==============================================================================
# 2. ADMIN CUSTOMER DIRECTORY
# ==============================================================================

@router.get("/admin/customers", summary="List registered customer accounts")
def list_admin_customers(
    search: Optional[str] = Query(None),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns registered users with order aggregates:
    - totalOrders count
    - totalSpent gross sum
    - profile and contact information
    """
    query = db.query(User).filter(User.role == "user")

    if search and search.strip():
        token = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(User.name).ilike(token),
                func.lower(User.email).ilike(token),
                func.lower(User.phone).ilike(token)
            )
        )

    users = query.order_by(desc(User.created_at)).all()

    customers_data = []
    for u in users:
        # Compute order stats for this user
        orders_for_user = db.query(Order).filter(
            Order.user_id == u.id,
            Order.status.in_(["pending", "processing", "shipped", "delivered"])
        ).all()
        
        tot_orders = len(orders_for_user)
        tot_spent = sum(float(o.total_amount) for o in orders_for_user)

        user_display_name = u.name or f"{u.first_name or ''} {u.last_name or ''}".strip() or "Customer"
        joined_str = u.created_at.strftime("%Y-%m-%d") if u.created_at else "2026-01-01"

        customers_data.append({
            "id": u.id,
            "name": user_display_name,
            "email": u.email,
            "phone": u.phone or "",
            "role": u.role,
            "status": "Active",
            "totalOrders": tot_orders,
            "totalSpent": round(tot_spent, 2),
            "joinedDate": joined_str
        })

    return {
        "success": True,
        "customers": customers_data,
        "total": len(customers_data)
    }


@router.get("/admin/customers/{user_id}", summary="Get customer profile details for admin modal")
def get_admin_customer_profile(
    user_id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns single customer profile with address directory and full order history."""
    user = db.query(User).options(
        joinedload(User.addresses)
    ).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer '{user_id}' not found."
        )

    # Fetch customer orders
    orders = db.query(Order).options(
        joinedload(Order.items)
    ).filter(
        Order.user_id == user.id
    ).order_by(
        desc(Order.created_at)
    ).all()

    formatted_orders = [format_order(o) for o in orders]
    formatted_addresses = [addr.to_dict() for addr in user.addresses]
    user_dict = user.to_dict()

    return {
        "success": True,
        "customer": {
            "id": user.id,
            "name": user.name or f"{user.first_name or ''} {user.last_name or ''}".strip() or "Customer",
            "role": user.role,
            "profile": {
                **user_dict.get("profile", {}),
                "role": user.role,
                "status": "Active"
            },
            "addresses": formatted_addresses,
            "orders": formatted_orders
        }
    }
