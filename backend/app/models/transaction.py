"""
SQLAlchemy Transaction Relational Model.

Represents an ingested financial transaction with NLP categorization
and micro-expenditure anomaly flags.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Transaction(Base):
    """Core transaction ledger entry."""
    
    __tablename__ = "transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    date = Column(DateTime, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    raw_description = Column(Text, nullable=False)
    clean_merchant = Column(String(128), nullable=False, index=True)
    variance_flag = Column(Boolean, default=False, nullable=False, index=True)
    anomaly_reason = Column(Text, nullable=True)
    reference_no = Column(String(64), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    
    __table_args__ = (
        Index("idx_transactions_user_date", "user_id", "date"),
        Index("idx_transactions_user_variance", "user_id", "variance_flag"),
    )
