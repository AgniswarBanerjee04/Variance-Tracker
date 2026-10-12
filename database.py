"""
Variance Tracker Database Module.

Cloud PostgreSQL connection strictly configured via os.getenv("DATABASE_URL").
"""

import os
import sys

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.core.database import (
    DATABASE_URL,
    engine,
    Base,
    AsyncSessionLocal,
    get_db,
)

__all__ = ["DATABASE_URL", "engine", "Base", "AsyncSessionLocal", "get_db"]
