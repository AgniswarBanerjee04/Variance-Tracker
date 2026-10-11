"""
Pydantic Schemas for Financial Analytics and Anomaly Reporting.
"""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


class DailyBurnRateItem(BaseModel):
    """Daily spend breakdown for burn rate analysis."""
    date: str
    total_spend: float
    normal_spend: float
    anomaly_spend: float
    transaction_count: int


class DailyBurnRateResponse(BaseModel):
    items: List[DailyBurnRateItem]
    average_daily_burn: float
    highest_spend_date: Optional[str] = None


class CategoricalVarianceItem(BaseModel):
    """Categorical spend distribution vs anomaly variance."""
    category_id: int
    category_name: str
    total_spend: float
    anomaly_spend: float
    transaction_count: int
    variance_percentage: float  # Percentage of category spend flagged as anomaly


class CategoricalVarianceResponse(BaseModel):
    items: List[CategoricalVarianceItem]
    dominant_category: Optional[str] = None


class AnomalyItem(BaseModel):
    """Detailed anomaly record for review panel."""
    id: str
    date: datetime
    amount: float
    clean_merchant: str
    category: str
    raw_description: str
    reason: str


class AnomalyListResponse(BaseModel):
    total_anomalies: int
    total_anomaly_drain: float
    items: List[AnomalyItem]


class SummaryMetricsResponse(BaseModel):
    """Top-level analytical KPIs for the dashboard."""
    total_transactions: int
    total_expenditure: float
    total_anomalies_flagged: int
    total_anomaly_drain: float
    average_burn_rate: float
    anomaly_drain_ratio: float  # % of total spend leaking into anomalies
