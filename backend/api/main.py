"""
Variance Tracker API - Vercel Serverless Function Entrypoint (Backend root).

Meghnad Saha Institute of Technology - MCA Minor Project.
Micro-Expenditure & Anomaly Detection System.
"""

import os
import sys

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.middleware.cors import CORSMiddleware
from app.main import app

# CORS configuration explicitly allowing Vercel frontend URL:
# allow_origins=["https://variance-tracker-x56m.vercel.app", "http://localhost:5173"]
# allow_methods=["*"]
# allow_headers=["*"]
# allow_credentials=True

__all__ = ["app"]
