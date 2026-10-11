"""
NLP & Anomaly Detection Service.

Processes unstructured Indian UPI and banking transaction strings,
normalizes irregular merchant identifiers, classifies expenditures,
and flags micro-expenditure anomalies under ₹500 draining daily cash flow.
"""

import json
import logging
import re
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


# Standardized Merchant & Category Mapping Heuristics
KNOWN_MERCHANT_PATTERNS = [
    # Food & Beverage
    (r"(swiggy|bundl\s*tech)", "Swiggy", "Food/Beverage"),
    (r"(zomato)", "Zomato", "Food/Beverage"),
    (r"(chai\s*point|chaayos|tea|chai|tapri)", "Local Tea/Chai Point", "Food/Beverage"),
    (r"(starbucks|tata\s*starbucks)", "Starbucks", "Food/Beverage"),
    (r"(ccd|cafe\s*coffee\s*day)", "Cafe Coffee Day", "Food/Beverage"),
    (r"(mcdonalds|hardcastle|burger\s*king|kfc|dominos|pizza\s*hut)", "Fast Food QSR", "Food/Beverage"),
    (r"(blinkit|grofers|zepto|instamart|bigbasket)", "Quick Commerce Grocery", "Food/Beverage"),
    
    # Transit
    (r"(uber|ubr)", "Uber", "Transit"),
    (r"(ola|ani\s*technologies)", "Ola Cabs", "Transit"),
    (r"(rapido|roppen)", "Rapido", "Transit"),
    (r"(irctc|indian\s*rail)", "IRCTC Railway", "Transit"),
    (r"(metro|dmrc|bmrc|kmrc)", "Metro Transit", "Transit"),
    (r"(indian\s*oil|bharat\s*petrol|hpcl|bpcl|shell|fuel|petrol)", "Fuel Station", "Transit"),
    (r"(fastag|nhai|toll)", "Highway FASTag", "Transit"),

    # Subscriptions & Entertainment
    (r"(netflix)", "Netflix", "Subscription"),
    (r"(spotify)", "Spotify", "Subscription"),
    (r"(prime\s*video|amazon\s*prime)", "Amazon Prime", "Subscription"),
    (r"(hotstar|disney)", "Disney+ Hotstar", "Subscription"),
    (r"(youtube|google\s*yt)", "YouTube Premium", "Subscription"),
    (r"(apple\.com|itunes|icloud)", "Apple Services", "Subscription"),

    # Utilities & Telecom
    (r"(airtel|bharti\s*airtel)", "Airtel Telecom", "Utility"),
    (r"(jio|reliance\s*jio)", "Jio Telecom", "Utility"),
    (r"(vodafone|idea|vi)", "Vodafone Idea", "Utility"),
    (r"(electricity|power|bescom|tneb|cesc|wbsedcl)", "Electricity Utility", "Utility"),
    (r"(gas|indane|bharat\s*gas|hp\s*gas)", "LPG Gas Utility", "Utility"),

    # Retail & E-Commerce
    (r"(amzn|amazon)", "Amazon Retail", "Retail"),
    (r"(flipkart)", "Flipkart", "Retail"),
    (r"(myntra)", "Myntra", "Retail"),
    (r"(dmart|avenue\s*supermarts)", "DMart", "Retail"),
    (r"(reliance\s*retail|reliance\s*fresh|smart\s*point)", "Reliance Retail", "Retail"),
    (r"(nykaa|purplle|meesho|ajio)", "Apparel/Cosmetics Retail", "Retail"),
]

NON_ESSENTIAL_CATEGORIES = {"Food/Beverage", "Retail", "Subscription"}


async def _execute_antigravity_agent(raw_upi_string: str) -> Optional[Dict[str, Any]]:
    """
    Invokes the Google Antigravity Agent SDK if available.
    Adheres strictly to the user's ML/AI prompt configuration.
    """
    try:
        from google.antigravity import Agent, LocalAgentConfig
        
        config = LocalAgentConfig(
            vertex=True,
            system_instructions="""
            You are a financial data parsing API designed for an MCA data analytics project. 
            You will receive an unstructured Indian UPI/Bank transaction string (e.g., 'UPI/40123/PAYTM*QR_Tea/HDFC'). 
            
            Your task:
            1. Extract the normalized merchant name.
            2. Assign a broad expenditure category (Food/Beverage, Transit, Utility, Subscription, Retail).
            3. Determine 'variance_flag' (Boolean: True if the transaction represents a recurring, low-value, non-essential anomaly under ₹500 that drains daily cash flow, otherwise False).
            4. Provide a brief analytical 'reason'.
            
            Output ONLY valid JSON. No markdown, no backticks, no conversational text.
            Schema: {"clean_merchant": "string", "category": "string", "variance_flag": boolean, "reason": "string"}
            """
        )
        
        async with Agent(config) as agent:
            response = await agent.chat(raw_upi_string)
            raw_text = await response.text()
            # Clean possible markdown fence wraps
            clean_text = raw_text.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_text)
            return parsed
    except ImportError:
        logger.info("google.antigravity SDK not installed in environment, falling back to NLP rule engine.")
        return None
    except Exception as e:
        logger.warning(f"Antigravity Agent execution error: {e}. Falling back to rule engine.")
        return None


def _fallback_nlp_parse(raw_upi_string: str, amount: Optional[float] = None) -> Dict[str, Any]:
    """
    Deterministic NLP rule engine for parsing unstructured Indian UPI statements.
    
    Examples handled:
    - 'UPI/40123/PAYTM*QR_Tea/HDFC' -> 'Local Tea/Chai Point', Food/Beverage
    - 'UPI/CR/391024/Swiggy/ICICI' -> 'Swiggy', Food/Beverage
    - 'POS/481920/AMZN Mktp/SBI' -> 'Amazon Retail', Retail
    - 'UPI/DR/Rapido Bike/Paytm' -> 'Rapido', Transit
    """
    cleaned_input = raw_upi_string.strip()
    upper_input = cleaned_input.upper()
    
    # 1. Check known merchant patterns
    matched_merchant = None
    matched_category = "Retail"
    
    for pattern, merchant_name, cat in KNOWN_MERCHANT_PATTERNS:
        if re.search(pattern, cleaned_input, re.IGNORECASE):
            matched_merchant = merchant_name
            matched_category = cat
            break
            
    # 2. If no pattern match, extract tokens from typical UPI separators (/, *, @, -, _)
    if not matched_merchant:
        # Strip common banking prefixes/suffixes
        stripped = re.sub(r"^(UPI|IMPS|NEFT|POS|REV|CR|DR)[\/\-_:]+", "", cleaned_input, flags=re.IGNORECASE)
        # Split tokens
        tokens = [t.strip() for t in re.split(r"[\/\*@_:\-]", stripped) if t.strip()]
        
        # Filter out numeric reference IDs and common bank codes
        bank_codes = {"HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "PAYTM", "YESB", "PNB", "BOB", "INDUSIND"}
        candidate_tokens = [
            t for t in tokens 
            if not t.isdigit() and len(t) > 2 and t.upper() not in bank_codes and not re.match(r"^[0-9A-Z]{12,}$", t)
        ]
        
        if candidate_tokens:
            matched_merchant = candidate_tokens[0].title()
        else:
            matched_merchant = "Digital Merchant"
            
        matched_category = "Retail"

    # 3. Determine variance_flag and reason
    # A transaction represents an anomaly if <= 500 and in a non-essential or frequent discretionary category
    effective_amount = amount if amount is not None else 100.0
    is_micro_spend = effective_amount <= settings.MICRO_SPEND_THRESHOLD
    is_non_essential = matched_category in NON_ESSENTIAL_CATEGORIES

    if is_micro_spend and is_non_essential:
        variance_flag = True
        reason = (
            f"Micro-expenditure anomaly: Recurring non-essential spend of Rs. {effective_amount:.2f} "
            f"(<= Rs. {settings.MICRO_SPEND_THRESHOLD:.0f}) in '{matched_category}' category draining daily cash reserves."
        )
    elif is_micro_spend:
        variance_flag = False
        reason = (
            f"Low-value transaction of Rs. {effective_amount:.2f}, classified as essential '{matched_category}'."
        )
    else:
        variance_flag = False
        reason = (
            f"Standard expenditure of Rs. {effective_amount:.2f} above anomaly threshold."
        )

    return {
        "clean_merchant": matched_merchant,
        "category": matched_category,
        "variance_flag": variance_flag,
        "reason": reason,
    }


async def analyze_transaction(raw_upi_string: str, amount: Optional[float] = None) -> Dict[str, Any]:
    """
    Main entry point for transaction NLP normalization & anomaly scoring.
    Attempts Google Antigravity Agent invocation; automatically falls back
    to high-performance heuristic parsing.
    """
    agent_result = await _execute_antigravity_agent(raw_upi_string)
    if agent_result and isinstance(agent_result, dict) and "clean_merchant" in agent_result:
        # If amount is provided, refine variance_flag against strict numerical limit
        if amount is not None and amount > settings.MICRO_SPEND_THRESHOLD:
            agent_result["variance_flag"] = False
            agent_result["reason"] = f"Spend of ₹{amount:.2f} exceeds micro-spend anomaly threshold."
        return agent_result
        
    return _fallback_nlp_parse(raw_upi_string, amount=amount)
