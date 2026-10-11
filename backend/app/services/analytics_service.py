"""
Analytics & Anomaly Computation Service.

Executes analytical aggregations for Daily Burn Rate, Categorical Variance,
and Micro-Expenditure Anomaly extraction.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, func, case, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.analytics import (
    DailyBurnRateItem,
    DailyBurnRateResponse,
    CategoricalVarianceItem,
    CategoricalVarianceResponse,
    AnomalyItem,
    AnomalyListResponse,
    SummaryMetricsResponse,
)


async def get_daily_burn_rate(
    db: AsyncSession,
    user_id: str,
    days: int = 30,
) -> DailyBurnRateResponse:
    """
    Computes daily burn rate trends partitioned by normal vs micro-expenditure anomaly spend.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Query all user transactions in date range
    stmt = (
        select(
            func.date(Transaction.date).label("txn_date"),
            func.sum(Transaction.amount).label("total_spend"),
            func.sum(
                case((Transaction.variance_flag == False, Transaction.amount), else_=0.0)
            ).label("normal_spend"),
            func.sum(
                case((Transaction.variance_flag == True, Transaction.amount), else_=0.0)
            ).label("anomaly_spend"),
            func.count(Transaction.id).label("txn_count"),
        )
        .where(Transaction.user_id == user_id, Transaction.date >= cutoff_date)
        .group_by(func.date(Transaction.date))
        .order_by(func.date(Transaction.date).asc())
    )
    
    results = await db.execute(stmt)
    rows = results.all()
    
    items: List[DailyBurnRateItem] = []
    total_spend_all_days = 0.0
    highest_spend_val = 0.0
    highest_spend_date = None
    
    for row in rows:
        d_str = str(row.txn_date)
        tot = round(float(row.total_spend or 0.0), 2)
        norm = round(float(row.normal_spend or 0.0), 2)
        anom = round(float(row.anomaly_spend or 0.0), 2)
        cnt = int(row.txn_count or 0)
        
        total_spend_all_days += tot
        if tot > highest_spend_val:
            highest_spend_val = tot
            highest_spend_date = d_str
            
        items.append(
            DailyBurnRateItem(
                date=d_str,
                total_spend=tot,
                normal_spend=norm,
                anomaly_spend=anom,
                transaction_count=cnt,
            )
        )
        
    avg_burn = round(total_spend_all_days / len(items), 2) if items else 0.0
    
    return DailyBurnRateResponse(
        items=items,
        average_daily_burn=avg_burn,
        highest_spend_date=highest_spend_date,
    )


async def get_categorical_variance(
    db: AsyncSession,
    user_id: str,
) -> CategoricalVarianceResponse:
    """
    Aggregates expenditure across 3NF categories and computes the variance percentage
    attributed to micro-spend anomalies.
    """
    stmt = (
        select(
            Category.id.label("cat_id"),
            Category.name.label("cat_name"),
            func.sum(Transaction.amount).label("total_spend"),
            func.sum(
                case((Transaction.variance_flag == True, Transaction.amount), else_=0.0)
            ).label("anomaly_spend"),
            func.count(Transaction.id).label("txn_count"),
        )
        .join(Category, Transaction.category_id == Category.id)
        .where(Transaction.user_id == user_id)
        .group_by(Category.id, Category.name)
        .order_by(desc("total_spend"))
    )
    
    results = await db.execute(stmt)
    rows = results.all()
    
    items: List[CategoricalVarianceItem] = []
    dominant_cat = None
    max_cat_spend = 0.0
    
    for row in rows:
        tot = round(float(row.total_spend or 0.0), 2)
        anom = round(float(row.anomaly_spend or 0.0), 2)
        cnt = int(row.txn_count or 0)
        var_pct = round((anom / tot * 100.0), 1) if tot > 0 else 0.0
        
        if tot > max_cat_spend:
            max_cat_spend = tot
            dominant_cat = row.cat_name
            
        items.append(
            CategoricalVarianceItem(
                category_id=row.cat_id,
                category_name=row.cat_name,
                total_spend=tot,
                anomaly_spend=anom,
                transaction_count=cnt,
                variance_percentage=var_pct,
            )
        )
        
    return CategoricalVarianceResponse(
        items=items,
        dominant_category=dominant_cat,
    )


async def get_anomalies_list(
    db: AsyncSession,
    user_id: str,
    limit: int = 100,
) -> AnomalyListResponse:
    """
    Retrieves the identified micro-expenditure anomalies with full NLP diagnostic reasoning.
    """
    stmt = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.user_id == user_id, Transaction.variance_flag == True)
        .order_by(desc(Transaction.date))
        .limit(limit)
    )
    
    results = await db.execute(stmt)
    txs = results.scalars().all()
    
    total_drain = sum(t.amount for t in txs)
    
    items = [
        AnomalyItem(
            id=t.id,
            date=t.date,
            amount=round(t.amount, 2),
            clean_merchant=t.clean_merchant,
            category=t.category.name if t.category else "Unclassified",
            raw_description=t.raw_description,
            reason=t.anomaly_reason or "Recurring micro-expenditure anomaly.",
        )
        for t in txs
    ]
    
    return AnomalyListResponse(
        total_anomalies=len(items),
        total_anomaly_drain=round(total_drain, 2),
        items=items,
    )


async def get_summary_metrics(
    db: AsyncSession,
    user_id: str,
) -> SummaryMetricsResponse:
    """
    Computes high-level KPI metrics for the analytics dashboard cards.
    """
    stmt = select(
        func.count(Transaction.id).label("total_txns"),
        func.sum(Transaction.amount).label("total_spend"),
        func.sum(
            case((Transaction.variance_flag == True, 1), else_=0)
        ).label("anomaly_count"),
        func.sum(
            case((Transaction.variance_flag == True, Transaction.amount), else_=0.0)
        ).label("anomaly_spend"),
        func.count(func.distinct(func.date(Transaction.date))).label("active_days"),
    ).where(Transaction.user_id == user_id)
    
    result = await db.execute(stmt)
    row = result.one()
    
    total_txns = int(row.total_txns or 0)
    total_spend = round(float(row.total_spend or 0.0), 2)
    anom_count = int(row.anomaly_count or 0)
    anom_spend = round(float(row.anomaly_spend or 0.0), 2)
    active_days = max(int(row.active_days or 1), 1)
    
    avg_burn = round(total_spend / active_days, 2)
    drain_ratio = round((anom_spend / total_spend * 100.0), 1) if total_spend > 0 else 0.0
    
    return SummaryMetricsResponse(
        total_transactions=total_txns,
        total_expenditure=total_spend,
        total_anomalies_flagged=anom_count,
        total_anomaly_drain=anom_spend,
        average_burn_rate=avg_burn,
        anomaly_drain_ratio=drain_ratio,
    )
