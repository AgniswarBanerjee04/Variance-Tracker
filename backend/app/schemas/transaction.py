"""
Pydantic Schemas for Transactions and Ingestion.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.category import CategoryResponse


class NLPTransactionResult(BaseModel):
    """Normalized NLP output schema specified by the academic prompt."""
    clean_merchant: str
    category: str
    variance_flag: bool
    reason: str


class RawUPIParseRequest(BaseModel):
    """Payload to parse an arbitrary UPI string directly."""
    raw_upi_string: str = Field(..., example="UPI/40123/PAYTM*QR_Tea/HDFC")
    amount: Optional[float] = Field(default=None, example=45.0)


class TransactionBase(BaseModel):
    date: datetime
    amount: float = Field(..., gt=0, description="Transaction monetary amount")
    raw_description: str
    clean_merchant: str
    variance_flag: bool = False
    anomaly_reason: Optional[str] = None
    reference_no: Optional[str] = None


class TransactionCreate(BaseModel):
    date: datetime
    amount: float = Field(..., gt=0)
    raw_description: str
    reference_no: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    category_id: int
    category: Optional[CategoryResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedTransactionsResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[TransactionResponse]


class CSVIngestionSummary(BaseModel):
    """Summary metrics of processed CSV statements."""
    total_rows_processed: int
    inserted_count: int
    skipped_count: int
    anomalies_flagged_count: int
    total_anomaly_spend: float
    categories_distribution: dict
