"""
Transaction Ingestion and Query Service.

Implements business logic for transaction ledgering, CSV stream parsing,
and 3NF categorical relationship resolution.
"""

import csv
import io
import logging
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, CSVIngestionSummary
from app.services.nlp_service import analyze_transaction

logger = logging.getLogger(__name__)

DEFAULT_CATEGORIES = [
    ("Food/Beverage", "Dining, street food, tea/coffee, fast food, quick groceries", 500.0, False),
    ("Transit", "Cab, auto, metro, rail, fuel, FASTag tolls", 500.0, True),
    ("Utility", "Electricity, mobile recharge, gas, broadband", 1000.0, True),
    ("Subscription", "Streaming services, digital cloud, memberships", 500.0, False),
    ("Retail", "Shopping, clothing, general merchandise", 1000.0, False),
    ("Miscellaneous", "Unclassified personal transactions", 500.0, False),
]


async def seed_default_categories(db: AsyncSession) -> Dict[str, Category]:
    """Ensures standard 3NF category entities exist in the database."""
    category_map = {}
    for name, desc_text, threshold, essential in DEFAULT_CATEGORIES:
        stmt = select(Category).where(Category.name == name)
        result = await db.execute(stmt)
        cat = result.scalar_one_or_none()
        if not cat:
            cat = Category(
                name=name,
                description=desc_text,
                default_threshold=threshold,
                is_essential=essential,
            )
            db.add(cat)
            await db.flush()
        category_map[name] = cat
    await db.commit()
    return category_map


async def get_or_create_category(db: AsyncSession, name: str) -> Category:
    """Retrieve existing category or create a new 3NF record."""
    clean_name = name.strip() or "Miscellaneous"
    stmt = select(Category).where(Category.name == clean_name)
    result = await db.execute(stmt)
    cat = result.scalar_one_or_none()
    if not cat:
        cat = Category(
            name=clean_name,
            description="Auto-classified transaction category",
            default_threshold=500.0,
            is_essential=False,
        )
        db.add(cat)
        await db.commit()
        await db.refresh(cat)
    return cat


def _parse_flexible_date(date_str: str) -> datetime:
    """Parses various date formats common in bank statements."""
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%b-%Y",
        "%d-%b-%Y %H:%M:%S",
    ]
    cleaned = date_str.strip()
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    # Default to current datetime if unparseable
    return datetime.utcnow()


async def ingest_csv_data(
    db: AsyncSession,
    user_id: str,
    csv_bytes: bytes,
) -> CSVIngestionSummary:
    """
    Ingests and parses a raw CSV transaction statement file.
    Executes NLP merchant normalization and micro-expenditure anomaly detection.
    """
    # Ensure default categories exist
    category_cache = await seed_default_categories(db)
    
    text = csv_bytes.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    
    if not reader.fieldnames:
        raise ValueError("Uploaded CSV contains no valid header row.")

    # Match column names case-insensitively
    headers = {h.strip().lower(): h for h in reader.fieldnames if h}
    
    date_col = next((headers[h] for h in headers if any(k in h for k in ["date", "time", "timestamp", "txn_date"])), None)
    desc_col = next((headers[h] for h in headers if any(k in h for k in ["desc", "particular", "merchant", "narration", "raw", "remark"])), None)
    amount_col = next((headers[h] for h in headers if any(k in h for k in ["amount", "debit", "withdrawal", "amt", "spend", "value"])), None)
    ref_col = next((headers[h] for h in headers if any(k in h for k in ["ref", "txn_id", "utr", "id", "reference"])), None)
    
    if not desc_col or not amount_col:
        raise ValueError(
            f"CSV must contain at least a description and amount column. Found columns: {list(reader.fieldnames)}"
        )

    total_rows = 0
    inserted_count = 0
    skipped_count = 0
    anomalies_count = 0
    total_anomaly_spend = 0.0
    category_counts: Dict[str, int] = {}
    
    new_transactions: List[Transaction] = []

    for row in reader:
        total_rows += 1
        raw_desc = (row.get(desc_col) or "").strip()
        raw_amt = (row.get(amount_col) or "").strip().replace(",", "").replace("₹", "")
        
        if not raw_desc or not raw_amt:
            skipped_count += 1
            continue
            
        try:
            amount = abs(float(raw_amt))
            if amount <= 0:
                skipped_count += 1
                continue
        except ValueError:
            skipped_count += 1
            continue

        raw_date = (row.get(date_col) or "").strip() if date_col else ""
        parsed_date = _parse_flexible_date(raw_date) if raw_date else datetime.utcnow()
        ref_no = (row.get(ref_col) or "").strip() if ref_col else None

        # Execute NLP Anomaly & Normalization Logic
        nlp_res = await analyze_transaction(raw_desc, amount=amount)
        cat_name = nlp_res.get("category", "Miscellaneous")
        
        # Link 3NF category
        if cat_name not in category_cache:
            category_cache[cat_name] = await get_or_create_category(db, cat_name)
        cat_entity = category_cache[cat_name]

        is_variance = bool(nlp_res.get("variance_flag", False))
        if is_variance:
            anomalies_count += 1
            total_anomaly_spend += amount

        category_counts[cat_name] = category_counts.get(cat_name, 0) + 1

        tx = Transaction(
            user_id=user_id,
            category_id=cat_entity.id,
            date=parsed_date,
            amount=amount,
            raw_description=raw_desc,
            clean_merchant=nlp_res.get("clean_merchant", "Unknown Merchant"),
            variance_flag=is_variance,
            anomaly_reason=nlp_res.get("reason"),
            reference_no=ref_no,
        )
        new_transactions.append(tx)
        inserted_count += 1

    if new_transactions:
        db.add_all(new_transactions)
        await db.commit()

    return CSVIngestionSummary(
        total_rows_processed=total_rows,
        inserted_count=inserted_count,
        skipped_count=skipped_count,
        anomalies_flagged_count=anomalies_count,
        total_anomaly_spend=round(total_anomaly_spend, 2),
        categories_distribution=category_counts,
    )


async def list_transactions(
    db: AsyncSession,
    user_id: str,
    page: int = 1,
    limit: int = 50,
    variance_only: bool = False,
    category_id: Optional[int] = None,
) -> Tuple[List[Transaction], int]:
    """Retrieve paginated transaction records with analytical filters."""
    query = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.user_id == user_id)
    )
    
    if variance_only:
        query = query.where(Transaction.variance_flag == True)
    if category_id:
        query = query.where(Transaction.category_id == category_id)

    # Count query
    count_query = select(func.count(Transaction.id)).where(Transaction.user_id == user_id)
    if variance_only:
        count_query = count_query.where(Transaction.variance_flag == True)
    if category_id:
        count_query = count_query.where(Transaction.category_id == category_id)
        
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    paginated_query = query.order_by(desc(Transaction.date)).offset(offset).limit(limit)
    
    result = await db.execute(paginated_query)
    items = list(result.scalars().all())
    
    return items, total
