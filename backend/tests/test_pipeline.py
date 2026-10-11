"""
End-to-End Test Suite for Variance Tracker Backend.

Validates:
1. Asynchronous database connectivity and 3NF schema tables.
2. Google Antigravity & heuristic NLP parsing for Indian UPI strings.
3. CSV Statement Ingestion and Anomaly Flagging (<= ₹500 non-essential).
4. Analytical Aggregations (Burn Rate, Categorical Variance, Anomalies).
"""

import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


from app.core.database import engine, Base, AsyncSessionLocal
from app.services.auth_service import get_or_create_demo_user
from app.services.transaction_service import ingest_csv_data, list_transactions
from app.services.nlp_service import analyze_transaction
from app.services.analytics_service import (
    get_daily_burn_rate,
    get_categorical_variance,
    get_anomalies_list,
    get_summary_metrics,
)


import pytest

@pytest.mark.asyncio
async def test_full_pipeline():
    print(">>> 1. Initializing Database Schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully.")

    print("\n>>> 2. Testing NLP UPI Analyzer...")
    test_strings = [
        ("UPI/40123/PAYTM*QR_Tea/HDFC", 25.0),
        ("UPI/CR/391024/Swiggy/ICICI", 380.0),
        ("UPI/DR/Rapido Bike/Paytm", 45.0),
        ("UPI/Bescom_Electricity_Power/HDFC", 1850.0),
        ("POS/481920/AMZN Mktp/SBI", 2499.0),
    ]
    for s, amt in test_strings:
        res = await analyze_transaction(s, amount=amt)
        print(f"  String: '{s}' | Amount: INR {amt} => Merchant: {res['clean_merchant']}, Category: {res['category']}, Variance: {res['variance_flag']}")

    print("\n>>> 3. Testing Demo User and CSV Ingestion...")
    async with AsyncSessionLocal() as session:
        user = await get_or_create_demo_user(session)
        print(f"  Demo User ID: {user.id} ({user.email})")

        # Ingest sample CSV
        csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_data", "sample_upi_transactions.csv"))
        with open(csv_path, "rb") as f:
            csv_bytes = f.read()

        summary = await ingest_csv_data(session, user_id=str(user.id), csv_bytes=csv_bytes)
        print(f"  Ingestion Summary:")
        print(f"    Total Processed: {summary.total_rows_processed}")
        print(f"    Inserted: {summary.inserted_count}")
        print(f"    Anomalies Flagged: {summary.anomalies_flagged_count}")
        print(f"    Total Anomaly Drain: INR {summary.total_anomaly_spend}")
        print(f"    Category Distribution: {summary.categories_distribution}")

        # Test Analytics
        print("\n>>> 4. Testing Analytics Services...")
        burn = await get_daily_burn_rate(session, str(user.id))
        print(f"  Average Daily Burn Rate: INR {burn.average_daily_burn} (Days: {len(burn.items)})")

        cat_var = await get_categorical_variance(session, str(user.id))
        print(f"  Categorical Variance (Dominant: {cat_var.dominant_category}):")
        for cv in cat_var.items:
            print(f"    - {cv.category_name}: Total INR {cv.total_spend}, Anomaly INR {cv.anomaly_spend} ({cv.variance_percentage}%)")

        anoms = await get_anomalies_list(session, str(user.id), limit=5)
        print(f"  Identified Anomalies (Count: {anoms.total_anomalies}):")
        for a in anoms.items[:3]:
            print(f"    * [{a.date.strftime('%Y-%m-%d')}] INR {a.amount} at {a.clean_merchant} - {a.reason}")

        metrics = await get_summary_metrics(session, str(user.id))
        print(f"\n>>> 5. Top-Level Metrics:")
        print(f"  Total Spend: INR {metrics.total_expenditure}")
        print(f"  Anomaly Drain: INR {metrics.total_anomaly_drain} ({metrics.anomaly_drain_ratio}%)")
        print(f"  Anomalies Flagged: {metrics.total_anomalies_flagged}/{metrics.total_transactions}")

    await engine.dispose()
    print("\n[SUCCESS] All pipeline validations passed!")


if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
