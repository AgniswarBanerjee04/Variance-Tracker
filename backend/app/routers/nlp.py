"""
NLP API Router.

Provides real-time evaluation endpoint for unstructured Indian UPI
and digital banking statement strings.
"""

from fastapi import APIRouter
from app.schemas.transaction import RawUPIParseRequest, NLPTransactionResult
from app.services.nlp_service import analyze_transaction

router = APIRouter(prefix="/nlp", tags=["Natural Language Processing"])


@router.post("/parse-raw", response_model=NLPTransactionResult)
@router.post("/parse-raw/", response_model=NLPTransactionResult)
async def parse_raw_upi(
    payload: RawUPIParseRequest,
) -> NLPTransactionResult:
    """
    Directly analyze an unstructured UPI or banking string using the NLP pipeline.
    
    Accepts:
    - `raw_upi_string`: e.g. 'UPI/40123/PAYTM*QR_Tea/HDFC'
    - `amount`: optional transaction value to test variance threshold
    
    Returns:
    - `clean_merchant`: Normalized merchant name
    - `category`: Broad expenditure classification
    - `variance_flag`: Boolean anomaly flag (<= ₹500 recurring drain)
    - `reason`: Analytical explanation
    """
    result = await analyze_transaction(
        raw_upi_string=payload.raw_upi_string,
        amount=payload.amount,
    )
    return NLPTransactionResult(**result)
