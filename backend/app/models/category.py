"""
SQLAlchemy Category Relational Model.

Enforces 3NF by isolating categorical attributes from transaction records,
eliminating transitive dependencies.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    """Categorical classification for financial expenditures."""
    
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    default_threshold = Column(Float, default=500.0, nullable=False)
    is_essential = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="category")
