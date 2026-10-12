"""
Variance Tracker API - Vercel Serverless Function Entrypoint.

Meghnad Saha Institute of Technology - MCA Minor Project.
Micro-Expenditure & Anomaly Detection System.
"""

import os
import sys

# Add backend directory to sys.path so app modules are discoverable
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.middleware.cors import CORSMiddleware
from app.main import app

# Update CORS policy for Vercel deployment:
# Note: When allow_credentials=True is set, "*" wildcard origins cannot be used per CORS spec.
# The app is configured with:
# allow_origins=["https://variance-tracker-x56m.vercel.app", "http://localhost:5173"]
# allow_methods=["*"]
# allow_headers=["*"]
# allow_credentials=True

__all__ = ["app"]
