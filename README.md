# LUMEN Hardware — E-Commerce Platform

A full-stack hardware e-commerce platform built with React, FastAPI, PostgreSQL 18, and Firebase Authentication.

## Tech Stack

- **Frontend:** React 19, React Router v7, FontAwesome, Create React App
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Synchronous), Uvicorn
- **Database:** PostgreSQL 18 (ACID-compliant relational schema with JSONB support for flexible hardware specifications)
- **Authentication:** Firebase Admin SDK (ID token verification, RBAC for `user` and `admin` roles)

## Project Structure

```
.
├── .env.example              # Combined environment template for frontend and backend
├── .env                      # Active local environment configuration (git-ignored)
├── frontend/                 # React storefront and administrative user interface
│   ├── public/               # Public assets and HTML entry point
│   ├── src/                  # React source code (components, context, api clients)
│   └── package.json          # Node dependencies and scripts
├── backend/                  # FastAPI REST API and PostgreSQL models
│   ├── app/
│   │   ├── main.py           # FastAPI application factory and router registration
│   │   ├── core/             # Configuration, database session, Firebase, and security guards
│   │   ├── models/           # SQLAlchemy models (21 relational database tables)
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic (pricing, catalog, PC builder compatibility)
│   │   └── api/routes/       # Storefront and admin endpoint routers
│   ├── scripts/              # Database initialization, JSON migration, and test suites
│   ├── data/json/            # Canonical hardware catalog, users, coupons, and site data
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Python virtual environment
└── .agents/                  # Architecture and planning documentation
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 14+ installed and running locally on port 5432

## Environment Configuration

Copy `.env.example` in the project root to `.env`:

```bash
cp .env.example .env
```

Adjust the database credentials in `.env` to match your local PostgreSQL cluster:

```ini
# Server & CORS
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=5000
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5000"]

# PostgreSQL Database
POSTGRES_SERVER=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=lumen_db
DATABASE_URL=postgresql+psycopg2://postgres:your_password@127.0.0.1:5432/lumen_db

# Firebase Authentication
FIREBASE_PROJECT_ID=e-commerce-d60a7
FIREBASE_CREDENTIALS_PATH=

# Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_PROJECT_ID=e-commerce-d60a7
```

## Running the Application

### 1. Ensure PostgreSQL is Active
```bash
sudo systemctl status postgresql
# Start if inactive:
sudo systemctl start postgresql
```

### 2. Start the FastAPI Backend (Port 5000)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```
*Or run directly from the project root:*
```bash
PYTHONPATH=backend backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### 3. Start the React Frontend (Port 3000)
Open a separate terminal:
```bash
cd frontend
npm start
```

## Database Setup & Data Migration

Run these commands if initializing a clean database:

```bash
# 1. Create tables in PostgreSQL (lumen_db)
PYTHONPATH=backend backend/venv/bin/python backend/scripts/init_db.py

# 2. Import products, taxonomy, reviews, and FAQs
PYTHONPATH=backend backend/venv/bin/python backend/scripts/import_products.py

# 3. Import users, addresses, carts, wishlists, orders, coupons, CMS content, and support tickets
PYTHONPATH=backend backend/venv/bin/python backend/scripts/import_users_and_content.py
```

## Access in pgAdmin 4

To inspect the database in pgAdmin 4:
1. Register a new server with Host `127.0.0.1`, Port `5432`, Maintenance Database `lumen_db`, Username `postgres`, and your password.
2. Navigate to **Servers** ➔ **Databases** ➔ **`lumen_db`** ➔ **Schemas** ➔ **`public`** ➔ **Tables**.

## Core Endpoints Reference

All endpoints are accessible via `/api/...` and direct root paths. Interactive Swagger documentation is available at `http://localhost:5000/docs`.

### System & Health
- `GET /api/health` — System health check, database ping, latency, and registered tables list.
- `GET /api/auth/me` — Current authenticated user identity and role context (`user` or `admin`).

### Storefront Catalog
- `GET /api/products` — Paginated hardware catalog with multi-filtering (category, subcategory, brand, price, rating, stock status, search, sort).
- `GET /api/products/homepage-products` — Aggregated homepage slices (featured deals, top sellers, best rated).
- `GET /api/products/shoppage-products` — Flat product list for instant frontend filtering.
- `GET /api/products/{id_or_slug}` — Complete product details with specifications, warranty assurances, reviews, and FAQs.
- `POST /api/products/{id}/reviews` — Submit verified customer review and star rating.

### Cart, Checkout & Orders
- `GET /api/users/{user_id}/cart` — Customer shopping cart with database-calculated unit prices and subtotal.
- `POST /api/users/{user_id}/cart` — Add product and variant configuration to cart.
- `POST /api/users/{user_id}/orders` — Transactional checkout with PostgreSQL row-locking (`with_for_update()`), inventory deduction, and payment logging.
- `GET /api/users/{user_id}/orders` — Customer order history.
- `POST /api/coupons/validate` — Validate promotional discount coupons against cart subtotal.

### PC Builder Compatibility Engine
- `POST /api/pc-builder/validate` — Validate CPU socket, RAM type, PSU wattage headroom, and GPU case clearance.
- `POST /api/pc-builder/add-to-cart` — Transfer validated custom build components directly into the customer cart.

### Admin Portal (`require_admin`)
- `GET /api/admin/dashboard` — Commercial revenue metrics, total orders, sales trends, category distribution, and low-stock alerts.
- `GET /api/admin/products` — Product catalog management with CRUD operations.
- `GET /api/admin/orders` — Order fulfillment management, status workflow, and tracking timeline updates.
- `GET /api/admin/reviews` — Customer review moderation (approve, reject, or delete with automatic rating average recalculation).
- `GET /api/admin/coupons` — Promotional discount coupon management.
- `GET /api/admin/support` — Customer helpdesk ticket management and administrative replies.
