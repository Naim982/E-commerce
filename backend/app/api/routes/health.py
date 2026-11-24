"""Health-check endpoint validating API runtime and PostgreSQL database connectivity."""

import time
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db, Base
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", summary="System Health & Database Status")
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Validates backend API health and verifies active PostgreSQL database connection.
    Executes a ping query ('SELECT 1') and returns database latency and registered tables.
    """
    start_time = time.perf_counter()
    db_connected = False
    db_name = None
    pg_version = None
    error_msg = None

    try:
        # Ping the database
        result = db.execute(text("SELECT current_database(), version();")).fetchone()
        if result:
            db_name = result[0]
            pg_version = result[1]
            db_connected = True
    except Exception as exc:
        error_msg = str(exc)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    registered_tables = sorted(list(Base.metadata.tables.keys()))

    payload = {
        "status": "healthy" if db_connected else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "connected": db_connected,
            "database_name": db_name,
            "latency_ms": elapsed_ms,
            "server_version": pg_version,
            "registered_tables_count": len(registered_tables),
            "tables": registered_tables,
            "error": error_msg
        }
    }

    status_code = status.HTTP_200_OK if db_connected else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=payload)
