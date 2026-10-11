# Project Context
System Name: Variance Tracker (Micro-Expenditure & Anomaly Detection System).
Academic Context: Semester Minor Project for Master of Computer Applications (MCA) at Meghnad Saha Institute of Technology.
Tech Stack: FastAPI (Python) backend, React/Tailwind frontend, PostgreSQL database.

# Standards
- Backend: Use strict Pydantic models for all API endpoints. Ensure robust error boundaries and include docstrings for all functions suitable for academic evaluation.
- Frontend: Use modular components. All data visualizations (histograms, variance heatmaps) must use Chart.js or Recharts.
- Database: Use asynchronous SQLAlchemy (asyncpg). Ensure 3NF (Third Normal Form) normalization for the relational schema.

# Constraints
- Execution: Set terminal permissions to 'Ask for Review' for all database migrations and package installations.
- Architecture: Maintain strict separation of concerns (MVC pattern). Do not mix routing logic with database operations.
