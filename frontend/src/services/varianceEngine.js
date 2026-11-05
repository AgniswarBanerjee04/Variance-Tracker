/**
 * Variance Tracker — In-Browser Client-Side Analytics & Anomaly Engine.
 *
 * Micro-Expenditure & Anomaly Detection System (MCA Minor Project)
 *
 * Supports multi-file batch upload, PapaParse concurrent parsing (Promise.all),
 * automated cross-file entity deduplication, and consolidated vendor analytics.
 */

import Papa from 'papaparse';

// Storage keys
export const CLIENT_USER_KEY = 'vt_auth_user';
export const CLIENT_TOKEN_KEY = 'vt_auth_token';

// Legacy keys cleanup to eliminate any unscoped cross-user data leakage
try {
  localStorage.removeItem('vt_client_transactions');
  localStorage.removeItem('vt_misc_spend_limit');
} catch {}

// Default Limits
export const MICRO_SPEND_THRESHOLD = 500.0;
export const DEFAULT_MISC_LIMIT = 2000.0;

function roundTwoDecimals(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Resolves the active user ID for scoping local storage.
 * Prioritizes passed user object/string, then authenticated session in localStorage.
 */
export function resolveCurrentUserId(user = null) {
  if (user && typeof user === 'string') {
    return user.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  if (user?.id) {
    return String(user.id).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  if (user?.email) {
    return String(user.email).trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  try {
    const raw = localStorage.getItem(CLIENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return String(parsed.id).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      if (parsed?.email) return String(parsed.email).trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    }
  } catch {}
  return 'default_usr';
}

/**
 * User-scoped storage keys enforcing complete tenant data isolation.
 * Keys: `variance_data_${user.id}` and `variance_limit_${user.id}`
 */
export function getUserTransactionsKey(user = null) {
  const uid = resolveCurrentUserId(user);
  return `variance_data_${uid}`;
}

export function getUserMiscLimitKey(user = null) {
  const uid = resolveCurrentUserId(user);
  return `variance_limit_${uid}`;
}

export function hasSavedMiscSpendLimit(user = null) {
  try {
    const key = getUserMiscLimitKey(user);
    const val = localStorage.getItem(key);
    return Boolean(val && !isNaN(parseFloat(val)) && parseFloat(val) > 0);
  } catch {
    return false;
  }
}

/**
 * Persisted user-defined maximum spend limit for miscellaneous / micro-anomaly items.
 * Strictly scoped to the authenticated user ID.
 */
export function getMiscSpendLimit(user = null) {
  try {
    const key = getUserMiscLimitKey(user);
    const val = localStorage.getItem(key);
    if (!val) return DEFAULT_MISC_LIMIT;
    const num = parseFloat(val);
    return isNaN(num) || num <= 0 ? DEFAULT_MISC_LIMIT : num;
  } catch {
    return DEFAULT_MISC_LIMIT;
  }
}

export function setMiscSpendLimit(limit, user = null) {
  try {
    const num = parseFloat(limit);
    const validLimit = isNaN(num) || num <= 0 ? DEFAULT_MISC_LIMIT : roundTwoDecimals(num);
    const key = getUserMiscLimitKey(user);
    localStorage.setItem(key, String(validLimit));
    return validLimit;
  } catch (err) {
    console.warn('[Variance Tracker] Failed to save misc spend limit:', err);
    return DEFAULT_MISC_LIMIT;
  }
}

// Standard 3NF Category Entities
export const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: 'Food/Beverage',
    description: 'Dining, street food, tea/coffee, fast food, quick groceries, snacks',
    default_threshold: 500.0,
    is_essential: false,
  },
  {
    id: 2,
    name: 'Transit',
    description: 'Cab, auto, metro, rail, bus, fuel, FASTag tolls',
    default_threshold: 500.0,
    is_essential: true,
  },
  {
    id: 3,
    name: 'Utility',
    description: 'Electricity, mobile recharge, gas, broadband, rent',
    default_threshold: 1000.0,
    is_essential: true,
  },
  {
    id: 4,
    name: 'Subscription',
    description: 'Streaming services, digital cloud, memberships',
    default_threshold: 500.0,
    is_essential: false,
  },
  {
    id: 5,
    name: 'Retail',
    description: 'Shopping, stationery, clothing, general merchandise',
    default_threshold: 1000.0,
    is_essential: false,
  },
  {
    id: 6,
    name: 'Miscellaneous',
    description: 'Unclassified personal transactions and cash withdrawals',
    default_threshold: 500.0,
    is_essential: false,
  },
];

export const NON_ESSENTIAL_CATEGORIES = new Set(['Food/Beverage', 'Retail', 'Subscription']);

// Standardized Merchant & Category Mapping Heuristics
export const KNOWN_MERCHANT_PATTERNS = [
  // Food & Beverage
  [/(swiggy|bundl\s*tech)/i, 'Swiggy', 'Food/Beverage'],
  [/(zomato)/i, 'Zomato', 'Food/Beverage'],
  [/(chai\s*point|chaayos|tea|chai|tapri)/i, 'Local Tea/Chai Point', 'Food/Beverage'],
  [/(pan\s*shop|paan|cigarette|cigar)/i, 'Local Kiosk/Pan Shop', 'Food/Beverage'],
  [/(snack|samosa|canteen|bakery|mithai|sweets)/i, 'Snacks & Bakery Corner', 'Food/Beverage'],
  [/(dairy|milk|amul|mother\s*dairy)/i, 'Local Dairy/Milk Store', 'Food/Beverage'],
  [/(starbucks|tata\s*starbucks)/i, 'Starbucks', 'Food/Beverage'],
  [/(ccd|cafe\s*coffee\s*day)/i, 'Cafe Coffee Day', 'Food/Beverage'],
  [/(mcdonalds|hardcastle|burger\s*king|kfc|dominos|pizza\s*hut)/i, 'Fast Food QSR', 'Food/Beverage'],
  [/(blinkit|grofers|zepto|instamart|bigbasket)/i, 'Quick Commerce Grocery', 'Food/Beverage'],

  // Transit
  [/(uber|ubr)/i, 'Uber', 'Transit'],
  [/(ola|ani\s*technologies)/i, 'Ola Cabs', 'Transit'],
  [/(rapido|roppen)/i, 'Rapido', 'Transit'],
  [/(auto|rickshaw|cab|taxi)/i, 'Local Auto/Cab Fare', 'Transit'],
  [/(bus|transport)/i, 'City Bus Transit', 'Transit'],
  [/(irctc|indian\s*rail)/i, 'IRCTC Railway', 'Transit'],
  [/(metro|dmrc|bmrc|kmrc)/i, 'Metro Transit', 'Transit'],
  [/(indian\s*oil|bharat\s*petrol|hpcl|bpcl|shell|fuel|petrol)/i, 'Fuel Station', 'Transit'],
  [/(fastag|nhai|toll)/i, 'Highway FASTag', 'Transit'],

  // Subscriptions & Entertainment
  [/(netflix)/i, 'Netflix', 'Subscription'],
  [/(spotify)/i, 'Spotify', 'Subscription'],
  [/(prime\s*video|amazon\s*prime)/i, 'Amazon Prime', 'Subscription'],
  [/(hotstar|disney)/i, 'Disney+ Hotstar', 'Subscription'],
  [/(youtube|google\s*yt)/i, 'YouTube Premium', 'Subscription'],
  [/(apple\.com|itunes|icloud)/i, 'Apple Services', 'Subscription'],

  // Utilities & Telecom
  [/(airtel|bharti\s*airtel)/i, 'Airtel Telecom', 'Utility'],
  [/(jio|reliance\s*jio)/i, 'Jio Telecom', 'Utility'],
  [/(vodafone|idea|vi)/i, 'Vodafone Idea', 'Utility'],
  [/(electricity|power|bescom|tneb|cesc|wbsedcl)/i, 'Electricity Utility', 'Utility'],
  [/(gas|indane|bharat\s*gas|hp\s*gas)/i, 'LPG Gas Utility', 'Utility'],
  [/(rent|landlord|maintenance)/i, 'House Rent', 'Utility'],

  // Retail & E-Commerce
  [/(stationery|book|pen|xerox|print)/i, 'Stationery & Printing', 'Retail'],
  [/(amzn|amazon)/i, 'Amazon Retail', 'Retail'],
  [/(flipkart)/i, 'Flipkart', 'Retail'],
  [/(myntra)/i, 'Myntra', 'Retail'],
  [/(dmart|avenue\s*supermarts)/i, 'DMart', 'Retail'],
  [/(reliance\s*retail|reliance\s*fresh|smart\s*point)/i, 'Reliance Retail', 'Retail'],
  [/(nykaa|purplle|meesho|ajio)/i, 'Apparel/Cosmetics Retail', 'Retail'],

  // Miscellaneous
  [/(atm|cash\s*wdl|cash\s*withdrawal)/i, 'ATM Cash Withdrawal', 'Miscellaneous'],
];

/**
 * Flexible Date Parser supporting Indian bank formats (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
 */
export function parseFlexibleDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const trimmed = String(dateStr).trim();

  // Match DD-MM-YYYY or DD/MM/YYYY with optional HH:MM(:SS)
  const dmyMatch = trimmed.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = parseInt(dmyMatch[4] || 0, 10);
    const min = parseInt(dmyMatch[5] || 0, 10);
    const sec = parseInt(dmyMatch[6] || 0, 10);
    const d = new Date(Date.UTC(year, month, day, hour, min, sec));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // Fallback to standard JS ISO date parser
  const parsed = new Date(trimmed);
  return !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
}

/**
 * Deterministic NLP rule engine for parsing unstructured Indian UPI statements.
 * Identifies merchant identifiers and flags micro-spend anomalies <= ₹500 in non-essential categories.
 */
export function analyzeTransaction(rawUpiString, amount = 100.0, threshold = MICRO_SPEND_THRESHOLD) {
  const cleanedInput = (rawUpiString || '').trim();
  let matchedMerchant = null;
  let matchedCategory = 'Retail';

  // 1. Check known merchant patterns
  for (const [pattern, merchantName, cat] of KNOWN_MERCHANT_PATTERNS) {
    if (pattern.test(cleanedInput)) {
      matchedMerchant = merchantName;
      matchedCategory = cat;
      break;
    }
  }

  // 2. Fallback token extraction for unclassified UPI identifiers
  if (!matchedMerchant) {
    const stripped = cleanedInput.replace(/^(UPI|IMPS|NEFT|POS|REV|CR|DR)[\/\-_:]+/i, '');
    const tokens = stripped.split(/[\/\*@_:\-]/).map((t) => t.trim()).filter(Boolean);
    const bankCodes = new Set(['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'PAYTM', 'YESB', 'PNB', 'BOB', 'INDUSIND']);
    const candidate = tokens.find(
      (t) => !/^\d+$/.test(t) && t.length > 2 && !bankCodes.has(t.toUpperCase()) && !/^[0-9A-Z]{12,}$/i.test(t)
    );

    matchedMerchant = candidate
      ? candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase()
      : 'Digital Merchant';
    matchedCategory = 'Retail';
  }

  // 3. Determine variance_flag and academic explanation
  const effectiveAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 100.0;
  const isMicroSpend = effectiveAmount <= threshold;
  const isNonEssential = NON_ESSENTIAL_CATEGORIES.has(matchedCategory);
  const isAnomaly = isMicroSpend && isNonEssential;

  const reason = isAnomaly
    ? `Micro-expenditure anomaly: Recurring non-essential spend of Rs. ${effectiveAmount.toFixed(2)} (<= Rs. ${threshold.toFixed(0)}) in '${matchedCategory}' category draining daily cash reserves.`
    : isMicroSpend
    ? `Low-value transaction of Rs. ${effectiveAmount.toFixed(2)}, classified as essential '${matchedCategory}'.`
    : `Standard expenditure of Rs. ${effectiveAmount.toFixed(2)} above anomaly threshold.`;

  return {
    clean_merchant: matchedMerchant,
    category: matchedCategory,
    variance_flag: isAnomaly,
    reason,
  };
}

/**
 * Storage helpers for in-browser client database.
 * Returns an empty array by default so the application starts with a clean empty state.
 * Scoped to user ID via key: `variance_data_${user.id}`.
 */
export function getStoredTransactions(user = null) {
  try {
    const key = getUserTransactionsKey(user);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Purge any legacy seed transactions to ensure clean empty initial state
    const realTransactions = parsed.filter(
      (t) => !String(t.id || '').startsWith('seed-tx-') && t.source_file !== 'seed_statement.csv'
    );
    if (realTransactions.length !== parsed.length) {
      saveStoredTransactions(realTransactions, user);
    }
    return realTransactions;
  } catch {
    return [];
  }
}

export function saveStoredTransactions(txs, user = null) {
  try {
    const key = getUserTransactionsKey(user);
    localStorage.setItem(key, JSON.stringify(txs));
  } catch (err) {
    console.warn('[Variance Tracker] Storage warning:', err);
  }
}

export function clearStoredTransactions(user = null) {
  try {
    const key = getUserTransactionsKey(user);
    localStorage.removeItem(key);
    const limitKey = getUserMiscLimitKey(user);
    localStorage.removeItem(limitKey);
  } catch (err) {
    console.warn('[Variance Tracker] Storage warning:', err);
  }
}

/**
 * Explicitly clears all variance tracking keys and legacy keys from browser storage.
 */
export function clearAllAppStorage() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith('variance_data_') ||
          k.startsWith('variance_limit_') ||
          k.startsWith('vt_') ||
          k === 'vt_client_transactions' ||
          k === 'vt_misc_spend_limit')
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('[Variance Tracker] Failed to clear all app storage:', err);
  }
}

/**
 * Builds deterministic deduplication lookup keys for a transaction.
 * Detects identical transactions via Ref_No or composite key (Date + Amount + Narration).
 */
function getDeduplicationKeys(tx) {
  const keys = [];

  // 1. Unique Reference Number match (if valid and not a generated prefix)
  const ref = (tx.reference_no || '').trim().toLowerCase();
  if (ref && !ref.startsWith('auto-') && !ref.startsWith('txn-') && !ref.startsWith('ref-')) {
    keys.push(`ref:${ref}`);
  }

  // 2. Composite key: Calendar Day (YYYY-MM-DD) + Normalized Amount + Normalized Description
  const dateStr = (tx.date || '').slice(0, 10);
  const amtStr = Number(tx.amount || 0).toFixed(2);
  const descStr = (tx.raw_description || '').trim().toLowerCase().replace(/\s+/g, ' ');

  keys.push(`comp:${dateStr}|${amtStr}|${descStr}`);

  return keys;
}

/**
 * Parses a single CSV file or Blob in the browser using PapaParse.
 */
function parseSingleCSVFile(fileOrBlob) {
  return new Promise((resolve, reject) => {
    Papa.parse(fileOrBlob, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (results) => {
        try {
          const rows = results.data || [];
          const fileName = fileOrBlob.name || 'statement.csv';
          resolve({ fileName, rows });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(new Error(`PapaParse error in ${fileOrBlob.name || 'statement'}: ${err.message}`));
      },
    });
  });
}

/**
 * Multi-File Batch Processor & Entity Deduplicator.
 *
 * 1. Parses multiple statement CSV files concurrently with Promise.all.
 * 2. Flattens raw statement rows.
 * 3. Normalizes descriptors and assigns 3NF categories.
 * 4. Deduplicates identical transactions across files and existing state.
 * 5. Consolidates common vendors across different statements/months.
 * 6. Persists the clean master dataset into localStorage.
 */
export async function parseBatchCSVStatements(filesArray, user = null) {
  if (!filesArray || !filesArray.length) {
    throw new Error('No statement files provided for ingestion.');
  }

  // Step 1: Concurrent PapaParse across all files via Promise.all
  const parsedFiles = await Promise.all(
    filesArray.map((file) => parseSingleCSVFile(file))
  );

  let totalRows = 0;
  let inserted = 0;
  let skipped = 0;
  let duplicatesSkipped = 0;
  let anomalies = 0;
  let totalAnomalySpend = 0.0;
  let totalSpend = 0.0;
  const categoryCounts = {};
  const vendorCounts = {};

  // Retrieve existing stored transactions to avoid double-counting on re-upload (scoped to user)
  const existingTransactions = getStoredTransactions(user);
  const seenKeys = new Set();

  // Populate seenKeys from existing stored transactions
  for (const existingTx of existingTransactions) {
    const keys = getDeduplicationKeys(existingTx);
    for (const k of keys) {
      seenKeys.add(k);
    }
  }

  const newTransactions = [];

  // Step 2 & 3: Iterate through all parsed files
  parsedFiles.forEach(({ fileName, rows }, fileIdx) => {
    if (!rows.length) return;

    // Detect column names case-insensitively
    const sampleRow = rows[0] || {};
    const keys = Object.keys(sampleRow);
    const dateKey = keys.find((k) => /date|time|timestamp|txn_date/i.test(k));
    const descKey = keys.find((k) => /narration|desc|particular|merchant|remark|raw/i.test(k));
    const amtKey = keys.find((k) => /withdrawal|debit|spend|amount|amt|value/i.test(k));
    const refKey = keys.find((k) => /ref_no|ref|utr|id|reference|txn_id/i.test(k));

    const resolvedDescKey = descKey || keys[1] || keys[0];
    const resolvedAmtKey = amtKey || keys[2] || keys[1];

    rows.forEach((row, rowIdx) => {
      totalRows++;
      const rawDesc = String(row[resolvedDescKey] || '').trim();
      const rawAmt = String(row[resolvedAmtKey] || '').replace(/[₹,]/g, '').trim();
      const amount = Math.abs(parseFloat(rawAmt));

      if (!rawDesc || isNaN(amount) || amount <= 0) {
        skipped++;
        return;
      }

      const rawDate = dateKey ? row[dateKey] : '';
      const parsedDate = parseFlexibleDate(rawDate);
      const refNo = (refKey && row[refKey]) ? String(row[refKey]).trim() : `AUTO-${Date.now()}-${fileIdx}-${rowIdx}`;

      // Normalize via NLP classification
      const nlp = analyzeTransaction(rawDesc, amount);
      const catName = nlp.category;
      const vendorName = nlp.clean_merchant;

      // Construct candidate transaction
      const candidateTx = {
        id: `tx-${Date.now()}-${fileIdx}-${rowIdx}`,
        user_id: 'user-profile',
        date: parsedDate,
        amount: roundTwoDecimals(amount),
        raw_description: rawDesc,
        clean_merchant: vendorName,
        variance_flag: nlp.variance_flag,
        anomaly_reason: nlp.reason,
        reference_no: refNo,
        source_file: fileName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Step 4: Deduplication Check
      const dedupeKeys = getDeduplicationKeys(candidateTx);
      const isDuplicate = dedupeKeys.some((k) => seenKeys.has(k));

      if (isDuplicate) {
        duplicatesSkipped++;
        return;
      }

      // Mark keys as seen
      for (const k of dedupeKeys) {
        seenKeys.add(k);
      }

      // Link 3NF category
      const catEntity = DEFAULT_CATEGORIES.find((c) => c.name === catName) || {
        id: DEFAULT_CATEGORIES.length + 1,
        name: catName,
        description: 'Auto-classified transaction category',
        default_threshold: 500.0,
        is_essential: !NON_ESSENTIAL_CATEGORIES.has(catName),
      };
      candidateTx.category_id = catEntity.id;
      candidateTx.category = catEntity;

      // Aggregate consolidated analytics
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      vendorCounts[vendorName] = (vendorCounts[vendorName] || 0) + 1;
      totalSpend += amount;

      if (nlp.variance_flag) {
        anomalies++;
        totalAnomalySpend += amount;
      }

      newTransactions.push(candidateTx);
      inserted++;
    });
  });

  // Step 5: Merge deduplicated transactions with master dataset
  const mergedDataset = [...newTransactions, ...existingTransactions];
  saveStoredTransactions(mergedDataset, user);

  // Consolidated top vendors
  const topVendors = Object.entries(vendorCounts)
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Step 6: Calculate sum of miscellaneous / micro-anomaly spending & check user budget limit
  const currentMiscLimit = getMiscSpendLimit(user);
  let cumulativeMiscSpend = 0.0;
  for (const tx of mergedDataset) {
    const isMisc = tx.category_id === 6 || tx.category?.name === 'Miscellaneous';
    const isAnomaly = Boolean(tx.variance_flag);
    if (isMisc || isAnomaly) {
      cumulativeMiscSpend += Number(tx.amount || 0);
    }
  }
  cumulativeMiscSpend = roundTwoDecimals(cumulativeMiscSpend);
  const isMiscLimitExceeded = cumulativeMiscSpend > currentMiscLimit;

  return {
    total_files_processed: filesArray.length,
    total_rows_processed: totalRows,
    inserted_count: inserted,
    skipped_count: skipped,
    duplicates_skipped_count: duplicatesSkipped,
    anomalies_flagged_count: anomalies,
    total_anomaly_spend: roundTwoDecimals(totalAnomalySpend),
    categories_distribution: categoryCounts,
    top_vendors_consolidated: topVendors,
    // DropZone feedback metrics
    total_processed: inserted,
    anomalies_detected: anomalies,
    normal_spends: inserted - anomalies,
    total_expenditure_parsed: roundTwoDecimals(totalSpend),
    // Miscellaneous spend limit metrics
    misc_spend_total: cumulativeMiscSpend,
    misc_spend_limit: currentMiscLimit,
    misc_limit_exceeded: isMiscLimitExceeded,
  };
}

/**
 * Backward compatibility alias for single file or batch array.
 */
export async function parseStatementCSV(fileOrFiles, user = null) {
  const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  return parseBatchCSVStatements(files, user);
}

/**
 * Analytics aggregator functions (Ported from analytics_service.py).
 */
export function getSummaryMetrics(user = null) {
  const txs = getStoredTransactions(user);
  let totalSpend = 0;
  let anomCount = 0;
  let anomSpend = 0;
  const activeDates = new Set();

  for (const t of txs) {
    totalSpend += t.amount;
    const d = (t.date || '').slice(0, 10);
    if (d) activeDates.add(d);
    if (t.variance_flag) {
      anomCount++;
      anomSpend += t.amount;
    }
  }

  const activeDays = Math.max(activeDates.size, 1);
  return {
    total_transactions: txs.length,
    total_expenditure: roundTwoDecimals(totalSpend),
    total_anomalies_flagged: anomCount,
    total_anomaly_drain: roundTwoDecimals(anomSpend),
    average_burn_rate: roundTwoDecimals(totalSpend / activeDays),
    anomaly_drain_ratio: totalSpend > 0 ? roundTwoDecimals((anomSpend / totalSpend) * 100) : 0,
  };
}

export function getDailyBurnRate(days = 30, user = null) {
  const txs = getStoredTransactions(user);
  const dayBuckets = {};

  for (const t of txs) {
    const dateStr = (t.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    if (!dayBuckets[dateStr]) {
      dayBuckets[dateStr] = { total: 0, normal: 0, anom: 0, count: 0 };
    }
    dayBuckets[dateStr].total += t.amount;
    dayBuckets[dateStr].count++;
    if (t.variance_flag) {
      dayBuckets[dateStr].anom += t.amount;
    } else {
      dayBuckets[dateStr].normal += t.amount;
    }
  }

  const sortedDates = Object.keys(dayBuckets).sort();
  let maxSpend = 0;
  let maxDate = null;
  let totalSum = 0;

  const items = sortedDates.slice(-days).map((d) => {
    const bucket = dayBuckets[d];
    totalSum += bucket.total;
    if (bucket.total > maxSpend) {
      maxSpend = bucket.total;
      maxDate = d;
    }
    return {
      date: d,
      total_spend: roundTwoDecimals(bucket.total),
      normal_spend: roundTwoDecimals(bucket.normal),
      anomaly_spend: roundTwoDecimals(bucket.anom),
      transaction_count: bucket.count,
    };
  });

  return {
    items,
    average_daily_burn: items.length ? roundTwoDecimals(totalSum / items.length) : 0,
    highest_spend_date: maxDate,
  };
}

export function getCategoricalVariance(user = null) {
  const txs = getStoredTransactions(user);
  const catBuckets = {};

  for (const t of txs) {
    const catName = t.category?.name || 'Retail';
    const catId = t.category_id || 1;
    if (!catBuckets[catName]) {
      catBuckets[catName] = { id: catId, name: catName, total: 0, anom: 0, count: 0 };
    }
    catBuckets[catName].total += t.amount;
    catBuckets[catName].count++;
    if (t.variance_flag) {
      catBuckets[catName].anom += t.amount;
    }
  }

  let dominant = null;
  let maxSpend = 0;

  const items = Object.values(catBuckets)
    .map((c) => {
      if (c.total > maxSpend) {
        maxSpend = c.total;
        dominant = c.name;
      }
      const varPct = c.total > 0 ? roundTwoDecimals((c.anom / c.total) * 100) : 0;
      return {
        category_id: c.id,
        category_name: c.name,
        total_spend: roundTwoDecimals(c.total),
        anomaly_spend: roundTwoDecimals(c.anom),
        transaction_count: c.count,
        variance_percentage: varPct,
      };
    })
    .sort((a, b) => b.total_spend - a.total_spend);

  return {
    items,
    dominant_category: dominant,
  };
}

export function getAnomaliesList(limit = 100, user = null) {
  const txs = getStoredTransactions(user);
  const anomalies = txs
    .filter((t) => t.variance_flag)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalDrain = anomalies.reduce((acc, curr) => acc + curr.amount, 0);

  const items = anomalies.slice(0, limit).map((t) => ({
    id: t.id,
    date: t.date,
    amount: roundTwoDecimals(t.amount),
    clean_merchant: t.clean_merchant,
    category: t.category?.name || 'Unclassified',
    raw_description: t.raw_description,
    reason: t.anomaly_reason || 'Recurring micro-expenditure anomaly under Rs. 500.',
    source_file: t.source_file,
  }));

  return {
    total_anomalies: anomalies.length,
    total_anomaly_drain: roundTwoDecimals(totalDrain),
    items,
  };
}

export function listTransactions(page = 1, limit = 50, varianceOnly = false, categoryId = null, user = null) {
  let items = getStoredTransactions(user).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (varianceOnly) {
    items = items.filter((t) => t.variance_flag);
  }
  if (categoryId) {
    items = items.filter((t) => t.category_id === categoryId);
  }

  const total = items.length;
  const offset = (page - 1) * limit;
  const paged = items.slice(offset, offset + limit);

  return {
    total,
    page,
    limit,
    items: paged,
  };
}
