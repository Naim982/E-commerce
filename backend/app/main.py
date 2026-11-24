"""Main FastAPI application entry point for LUMEN Hardware Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
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

# Ensure all SQLAlchemy models are registered in Base.metadata
import app.models  # noqa: F401

# Initialize FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="LUMEN Hardware E-Commerce REST API powered by FastAPI, Pydantic, and PostgreSQL.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS Middleware for Frontend Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api prefix (matches frontend expectations)
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(admin_products_router, prefix=settings.API_V1_STR)
app.include_router(cart_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(admin_orders_router, prefix=settings.API_V1_STR)
app.include_router(admin_dashboard_router, prefix=settings.API_V1_STR)
app.include_router(admin_reviews_router, prefix=settings.API_V1_STR)
app.include_router(support_router, prefix=settings.API_V1_STR)
app.include_router(site_router, prefix=settings.API_V1_STR)
app.include_router(pc_builder_router, prefix=settings.API_V1_STR)

# Also mount at root level for direct path compatibility
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(admin_products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(admin_orders_router)
app.include_router(admin_dashboard_router)
app.include_router(admin_reviews_router)
app.include_router(support_router)
app.include_router(site_router)
app.include_router(pc_builder_router)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint welcoming clients and directing to documentation."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
