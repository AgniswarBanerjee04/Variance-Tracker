/**
 * API Client for Variance Tracker Backend
 * Supports JWT authentication, statement ingestion, and analytics endpoints.
 */

// Base API URL strictly configured from Vite environment variable with safe fallback for Vercel
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://variance-tracker-chi.vercel.app';

const TOKEN_KEY = 'vt_auth_token';
const USER_KEY = 'vt_auth_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

async function safeFetch(url, options = {}) {
  try {
    // Normalize target URL to ensure /api/v1 prefix is routed correctly when calling API_BASE
    let targetUrl = url;
    if (
      targetUrl.startsWith(API_BASE) &&
      !API_BASE.endsWith('/api/v1') &&
      !targetUrl.includes('/api/v1/') &&
      !targetUrl.endsWith('/api/v1')
    ) {
      const cleanBase = API_BASE.replace(/\/+$/, '');
      targetUrl = targetUrl.replace(cleanBase, `${cleanBase}/api/v1`);
    }

    const response = await fetch(targetUrl, options);
    if (!response.ok) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error('Cannot connect to backend server. Is FastAPI running?');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    const msg = err.message || '';
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('network error') ||
      msg.includes('Load failed') ||
      msg.includes('502') ||
      msg.includes('Bad Gateway')
    ) {
      throw new Error('Cannot connect to backend server. Is FastAPI running?');
    }
    throw err;
  }
}

function getAuthHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(email, password) {
    const data = await safeFetch(`${API_BASE}/auth/login-json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      authStorage.setToken(data.access_token);
      if (data.user) {
        authStorage.setUser(data.user);
      }
    }
    return data;
  },

  async signup(email, password, fullName) {
    return safeFetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
  },

  async getMe() {
    return safeFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(false),
    });
  },

  logout() {
    authStorage.removeToken();
  },

  // Analytical KPIs
  async getSummary() {
    return safeFetch(`${API_BASE}/analytics/summary`, {
      headers: getAuthHeaders(false),
    });
  },

  // Daily Burn Rate Time-Series
  async getDailyBurnRate(days = 30) {
    return safeFetch(`${API_BASE}/analytics/daily-burn-rate?days=${days}`, {
      headers: getAuthHeaders(false),
    });
  },

  // Categorical Variance Distribution
  async getCategoricalVariance() {
    return safeFetch(`${API_BASE}/analytics/categorical-variance`, {
      headers: getAuthHeaders(false),
    });
  },

  // Identified Anomalies List
  async getAnomalies(limit = 100) {
    return safeFetch(`${API_BASE}/analytics/anomalies?limit=${limit}`, {
      headers: getAuthHeaders(false),
    });
  },

  // Transactions Ledger
  async getTransactions(page = 1, limit = 50, varianceOnly = false, categoryId = null) {
    let url = `${API_BASE}/transactions/?page=${page}&limit=${limit}&variance_only=${varianceOnly}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    return safeFetch(url, {
      headers: getAuthHeaders(false),
    });
  },

  // Categories Listing
  async getCategories() {
    return safeFetch(`${API_BASE}/transactions/categories`, {
      headers: getAuthHeaders(false),
    });
  },

  // Drag-and-Drop CSV Ingestion
  async uploadCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = authStorage.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return safeFetch(`${API_BASE}/transactions/upload-csv`, {
      method: 'POST',
      headers,
      body: formData,
    });
  },

  // Direct UPI NLP Sandbox Tester
  async parseRawUPI(rawUPIString, amount = 100.0) {
    return safeFetch(`${API_BASE}/nlp/parse-raw`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        raw_upi_string: rawUPIString,
        amount: parseFloat(amount) || 0,
      }),
    });
  },
};
