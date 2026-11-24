"""
Database Initialization Script for LUMEN Hardware.
Connects to PostgreSQL, executes Base.metadata.create_all(bind=engine),
and verifies that all essential tables exist in the database.
"""

import sys
import os
import argparse

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text, inspect
from app.core.database import engine, Base
from app.core.config import settings

# Import models package to register all 21 tables with Base.metadata
import app.models  # noqa: F401


def init_database(drop_existing: bool = False) -> bool:
    """Creates all defined database tables in PostgreSQL."""
    print("=" * 70)
    print("  LUMEN Hardware — PostgreSQL Database Initialization")
    print("=" * 70)
    print(f"Target Database URL: {settings.SQLALCHEMY_DATABASE_URI.split('@')[-1] if '@' in settings.SQLALCHEMY_DATABASE_URI else settings.SQLALCHEMY_DATABASE_URI}")
    print(f"Environment:         {settings.ENVIRONMENT}")
    print("-" * 70)

    try:
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT current_database(), current_user, version();")).fetchone()
            print(f"[OK] Connected to database: '{result[0]}' as user: '{result[1]}'")
            print(f"[INFO] Server Version: {result[2].split(',')[0]}")
    except Exception as exc:
        print(f"[ERROR] Failed to connect to PostgreSQL: {exc}")
        print("\nPlease check your .env settings or ensure PostgreSQL is running.")
        return False

    registered_tables = list(Base.metadata.tables.keys())
    print(f"[INFO] Registered models in metadata ({len(registered_tables)} tables):")
    for idx, table_name in enumerate(sorted(registered_tables), start=1):
        print(f"   {idx:2d}. {table_name}")

    if drop_existing:
        print("\n[WARNING] --drop flag specified! Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("[OK] All existing tables dropped.")

    print("\n[INFO] Executing Base.metadata.create_all(bind=engine)...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Table creation completed.")

    # Verification against PostgreSQL information schema
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    print("\n" + "=" * 70)
    print("  VERIFICATION REPORT")
    print("=" * 70)
    all_present = True
    for table_name in sorted(registered_tables):
        exists = table_name in existing_tables
        status_str = "[OK] CREATED" if exists else "[FAIL] MISSING"
        if not exists:
            all_present = False
        print(f"  {status_str:15} | table: {table_name}")

    print("-" * 70)
    if all_present:
        print(f"[SUCCESS] All {len(registered_tables)} required tables successfully verified in PostgreSQL!")
    else:
        print("[WARN] Some tables were not detected in information schema. Review logs above.")

    print("=" * 70)
    return all_present


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize LUMEN Hardware PostgreSQL Database.")
    parser.add_argument(
        "--drop",
        action="store_true",
        help="Drop all existing tables before recreating them (DANGER: destroys data)."
    )
    args = parser.parse_args()

    success = init_database(drop_existing=args.drop)
    sys.exit(0 if success else 1)
