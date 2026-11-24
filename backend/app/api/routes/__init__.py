"""API routes package initialization."""
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.products import router as products_router
from app.api.routes.admin_products import router as admin_products_router
from app.api.routes.cart import router as cart_router
from app.api.routes.orders import router as orders_router
from app.api.routes.admin_orders import router as admin_orders_router
from app.api.routes.admin_dashboard import router as admin_dashboard_router
from app.api.routes.admin_reviews import router as admin_reviews_router
from app.api.routes.support import router as support_router
from app.api.routes.site import router as site_router
from app.api.routes.pc_builder import router as pc_builder_router

__all__ = [
    "health_router",
    "auth_router",
    "users_router",
    "products_router",
    "admin_products_router",
    "cart_router",
    "orders_router",
    "admin_orders_router",
    "admin_dashboard_router",
    "admin_reviews_router",
    "support_router",
    "site_router",
    "pc_builder_router",
]
