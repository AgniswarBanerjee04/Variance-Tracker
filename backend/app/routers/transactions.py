"""
Transactions API Router.

Handles CSV file upload ingestion, paginated querying, and category listings.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.category import CategoryResponse
from app.schemas.transaction import (
    TransactionResponse,
    PaginatedTransactionsResponse,
    CSVIngestionSummary,
    TransactionCreate,
)
from app.services.transaction_service import (
    ingest_csv_data,
    list_transactions,
    seed_default_categories,
    get_or_create_category,
)
from app.services.nlp_service import analyze_transaction

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/upload-csv", response_model=CSVIngestionSummary)
@router.post("/upload-csv/", response_model=CSVIngestionSummary)
async def upload_csv(
    file: UploadFile = File(..., description="CSV bank or UPI transaction statement"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CSVIngestionSummary:
    """
    Ingest a bank/UPI statement CSV file.
    
    - Parses irregular merchant records.
    - Runs NLP normalization and anomaly scoring.
    - Classifies transactions into normalized 3NF categories.
    - Flags micro-expenditure anomalies under ₹500.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a .csv file.",
        )
        
    try:
        content = await file.read()
        summary = await ingest_csv_data(db, user_id=str(current_user.id), csv_bytes=content)
        return summary
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV statement: {str(e)}",
        )


@router.get("", response_model=PaginatedTransactionsResponse)
@router.get("/", response_model=PaginatedTransactionsResponse)
async def get_transactions(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=50, ge=1, le=200, description="Page limit"),
    variance_only: bool = Query(default=False, description="Filter only flagged micro-anomalies"),
    category_id: Optional[int] = Query(default=None, description="Filter by 3NF category ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedTransactionsResponse:
    """Retrieve paginated transactions for current user with filtering."""
    items, total = await list_transactions(
        db,
        user_id=str(current_user.id),
        page=page,
        limit=limit,
        variance_only=variance_only,
        category_id=category_id,
    )
    
    return PaginatedTransactionsResponse(
        total=total,
        page=page,
        limit=limit,
        items=[TransactionResponse.model_validate(tx) for tx in items],
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_single_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    """Manually insert an individual transaction with automatic NLP categorization."""
    nlp_res = await analyze_transaction(tx_in.raw_description, amount=tx_in.amount)
    cat_entity = await get_or_create_category(db, nlp_res.get("category", "Miscellaneous"))
    
    tx = Transaction(
        user_id=str(current_user.id),
        category_id=cat_entity.id,
        date=tx_in.date,
        amount=tx_in.amount,
        raw_description=tx_in.raw_description,
        clean_merchant=nlp_res.get("clean_merchant", "Manual Entry"),
        variance_flag=bool(nlp_res.get("variance_flag", False)),
        anomaly_reason=nlp_res.get("reason"),
        reference_no=tx_in.reference_no,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    
    # Reload with category relationship
    stmt = select(Transaction).where(Transaction.id == tx.id)
    res = await db.execute(stmt)
    loaded_tx = res.scalar_one()
    return TransactionResponse.model_validate(loaded_tx)


@router.get("/categories", response_model=List[CategoryResponse])
@router.get("/categories/", response_model=List[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> List[CategoryResponse]:
    """Retrieve all available 3NF categories."""
    await seed_default_categories(db)
    stmt = select(Category).order_by(Category.name)
    result = await db.execute(stmt)
    cats = result.scalars().all()
    return [CategoryResponse.model_validate(c) for c in cats]
