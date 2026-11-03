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

from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.main import app

# Ensure CORS explicitly permits all origins and methods for Vercel Serverless environment
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Ensure CORS headers are appended to all responses including preflights and error responses."""
    origin = request.headers.get("origin", "*")
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin if origin != "*" else "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
                "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400",
            },
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = origin if origin != "*" else "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, X-Requested-With"
    return response

__all__ = ["app"]
