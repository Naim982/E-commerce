"""
SQLAlchemy Models Package.
Exports all 21 models to ensure complete metadata registration for Base.metadata.create_all().
"""

from app.core.database import Base

# User and Identity models
from app.models.user import User, Address, Notification

# Catalog taxonomy models
from app.models.category import Category, Subcategory
from app.models.brand import Brand, ProductBrand

# Product catalog & review models
from app.models.product import (
    Product,
    ProductVariant,
    VariantOption,
    Review,
    ProductFAQ
)

# Shopping session models
from app.models.cart import CartItem, WishlistItem

# Order & checkout models
from app.models.order import Order, OrderItem, Payment
from app.models.coupon import Coupon

# Customer support and CMS models
from app.models.support import SupportTicket
from app.models.site import SiteContent, StoreSettings

__all__ = [
    "Base",
    # 1. users
    "User",
    # 2. addresses
    "Address",
    # 3. categories
    "Category",
    # 4. subcategories
    "Subcategory",
    # 5. brands
    "Brand",
    # 6. product_brands
    "ProductBrand",
    # 7. products
    "Product",
    # 8. product_variants
    "ProductVariant",
    # 9. variant_options
    "VariantOption",
    # 10. cart_items
    "CartItem",
    # 11. wishlist_items
    "WishlistItem",
    # 12. orders
    "Order",
    # 13. order_items
    "OrderItem",
    # 14. payments
    "Payment",
    # 15. coupons
    "Coupon",
    # 16. reviews
    "Review",
    # 17. product_faqs
    "ProductFAQ",
    # 18. support_tickets
    "SupportTicket",
    # 19. notifications
    "Notification",
    # 20. site_content
    "SiteContent",
    # 21. store_settings
    "StoreSettings",
]
