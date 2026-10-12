"""
Analytics API Router.

Serves data endpoints for Dashboard Analytics Panels:
- Daily Burn Rate Trends
- Categorical Variance Heatmap / Breakdown
- Identified Anomalies List
- Summary KPI Cards
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.analytics import (
    DailyBurnRateResponse,
    CategoricalVarianceResponse,
    AnomalyListResponse,
    SummaryMetricsResponse,
)
from app.services.analytics_service import (
    get_daily_burn_rate,
    get_categorical_variance,
    get_anomalies_list,
    get_summary_metrics,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=SummaryMetricsResponse)
@router.get("/summary/", response_model=SummaryMetricsResponse)
async def summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SummaryMetricsResponse:
    """Fetch high-level KPI metrics (total spend, anomaly drain, burn rate)."""
    return await get_summary_metrics(db, str(current_user.id))


@router.get("/daily-burn-rate", response_model=DailyBurnRateResponse)
@router.get("/daily-burn-rate/", response_model=DailyBurnRateResponse)
async def daily_burn_rate(
    days: int = Query(default=30, ge=1, le=365, description="Number of past days to aggregate"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DailyBurnRateResponse:
    """
    Returns time-series burn rate data:
    - Normal vs Anomaly spend partitions.
    - Average daily burn rate.
    - Highest spend spike date.
    """
    return await get_daily_burn_rate(db, str(current_user.id), days=days)


@router.get("/categorical-variance", response_model=CategoricalVarianceResponse)
@router.get("/categorical-variance/", response_model=CategoricalVarianceResponse)
async def categorical_variance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CategoricalVarianceResponse:
    """
    Returns categorical spend distribution:
    - Total spend per 3NF category.
    - Anomaly spend within category.
    - Variance percentage representing micro-spend leakage.
    """
    return await get_categorical_variance(db, str(current_user.id))


@router.get("/anomalies", response_model=AnomalyListResponse)
@router.get("/anomalies/", response_model=AnomalyListResponse)
async def anomalies(
    limit: int = Query(default=50, ge=1, le=200, description="Max anomaly rows to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnomalyListResponse:
    """
    Returns identified micro-expenditure anomalies with clean merchant names
    and analytical diagnostic reasons.
    """
    return await get_anomalies_list(db, str(current_user.id), limit=limit)
