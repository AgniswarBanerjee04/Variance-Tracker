/**
 * Variance Tracker — 100% Client-Side API & Data Service.
 *
 * Micro-Expenditure & Anomaly Detection System (MCA Minor Project)
 *
 * All external HTTP/Fetch/Axios calls to FastAPI backend have been completely removed.
 * Ingestion, string normalization, and micro-spend anomaly detection execute entirely
 * in the browser using PapaParse and local persistence.
 */

import {
  parseStatementCSV,
  analyzeTransaction,
  getSummaryMetrics,
  getDailyBurnRate as computeDailyBurnRate,
  getCategoricalVariance as computeCategoricalVariance,
  getAnomaliesList as computeAnomaliesList,
  listTransactions as computeListTransactions,
  getMiscSpendLimit,
  setMiscSpendLimit,
  hasSavedMiscSpendLimit,
  clearStoredTransactions,
  clearAllAppStorage,
  DEFAULT_CATEGORIES,
  CLIENT_USER_KEY,
  CLIENT_TOKEN_KEY,
} from './varianceEngine';

export const authStorage = {
  getToken: () => localStorage.getItem(CLIENT_TOKEN_KEY),
  setToken: (token) => localStorage.setItem(CLIENT_TOKEN_KEY, token),
  removeToken: () => {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
    localStorage.removeItem(CLIENT_USER_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: null }));
    }
  },
  getUser: () => {
    try {
      const u = localStorage.getItem(CLIENT_USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: user }));
    }
  },
};

/**
 * 100% Client-Side API Service Interface.
 * All methods return Promises matching the original async API contracts.
 * Fully supports user-scoped persistence to prevent any state leakage between sessions.
 */
export const api = {
  // Authentication (Client-side authenticated session)
  async login(email, password) {
    const rawEmail = (email || '').trim().toLowerCase();
    const fallbackUsername = rawEmail.includes('@') ? rawEmail.split('@')[0] : (rawEmail || 'User');
    const safeId = rawEmail ? rawEmail.replace(/[^a-zA-Z0-9_-]/g, '_') : 'user_' + Date.now();
    const userId = `usr_${safeId}`;
    const verifiedUser = {
      id: userId,
      email: rawEmail || 'user@example.com',
      displayName: fallbackUsername,
      name: fallbackUsername,
      full_name: fallbackUsername,
      created_at: new Date().toISOString(),
    };
    const token = 'vt-client-jwt-' + Date.now();
    authStorage.setToken(token);
    authStorage.setUser(verifiedUser);
    return {
      access_token: token,
      token_type: 'bearer',
      user: verifiedUser,
    };
  },

  async signup(email, password, fullName) {
    const rawEmail = (email || '').trim().toLowerCase();
    const emailFallback = rawEmail.includes('@') ? rawEmail.split('@')[0] : 'User';
    const chosenName = (fullName && fullName.trim()) ? fullName.trim() : emailFallback;
    const safeId = rawEmail ? rawEmail.replace(/[^a-zA-Z0-9_-]/g, '_') : 'user_' + Date.now();
    const userId = `usr_${safeId}`;
    const newUser = {
      id: userId,
      email: rawEmail || 'user@example.com',
      displayName: chosenName,
      name: chosenName,
      full_name: chosenName,
      created_at: new Date().toISOString(),
    };
    const token = 'vt-client-jwt-' + Date.now();
    authStorage.setToken(token);
    authStorage.setUser(newUser);
    return newUser;
  },

  async getMe() {
    const user = authStorage.getUser();
    if (user) return user;
    return null;
  },

  logout(user = null) {
    authStorage.removeToken();
    if (user) {
      clearStoredTransactions(user);
    }
    clearAllAppStorage();
  },

  // Miscellaneous Spend Limit (Scoped per user ID in localStorage)
  hasSavedMiscSpendLimit(user = null) {
    return hasSavedMiscSpendLimit(user);
  },

  getMiscSpendLimit(user = null) {
    return getMiscSpendLimit(user);
  },

  setMiscSpendLimit(limit, user = null) {
    return setMiscSpendLimit(limit, user);
  },

  // Top-Level KPI Summary (Scoped to user)
  async getSummary(user = null) {
    return getSummaryMetrics(user);
  },

  // Daily Burn Rate Time-Series (Scoped to user)
  async getDailyBurnRate(days = 30, user = null) {
    return computeDailyBurnRate(days, user);
  },

  // Categorical Variance Distribution (Scoped to user)
  async getCategoricalVariance(user = null) {
    return computeCategoricalVariance(user);
  },

  // Identified Anomalies List (Scoped to user)
  async getAnomalies(limit = 100, user = null) {
    return computeAnomaliesList(limit, user);
  },

  // Paginated Transactions Ledger (Scoped to user)
  async getTransactions(page = 1, limit = 50, varianceOnly = false, categoryId = null, user = null) {
    return computeListTransactions(page, limit, varianceOnly, categoryId, user);
  },

  // 3NF Categories Listing
  async getCategories() {
    return DEFAULT_CATEGORIES;
  },

  // In-Browser CSV Ingestion via PapaParse (Scoped to user)
  async uploadCSV(file, user = null) {
    return await parseStatementCSV(file, user);
  },

  // Direct UPI NLP Sandbox Tester
  async parseRawUPI(rawUPIString, amount = 100.0) {
    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 100.0;
    return analyzeTransaction(rawUPIString, parsedAmount);
  },
};
