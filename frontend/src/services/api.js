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
  },
  getUser: () => {
    try {
      const u = localStorage.getItem(CLIENT_USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(user)),
};

/**
 * 100% Client-Side API Service Interface.
 * All methods return Promises matching the original async API contracts.
 */
export const api = {
  // Authentication (Client-side authenticated session)
  async login(email, password) {
    const verifiedUser = {
      id: 'user-profile-2026',
      email: email || 'user@example.com',
      full_name: 'User Profile',
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
    const newUser = {
      id: 'user-' + Date.now(),
      email: email || 'user@example.com',
      full_name: fullName || 'User Profile',
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
    return {
      id: 'user-profile-2026',
      email: 'user@example.com',
      full_name: 'User Profile',
      created_at: new Date().toISOString(),
    };
  },

  logout() {
    authStorage.removeToken();
  },

  // Miscellaneous Spend Limit (Persistent in localStorage)
  hasSavedMiscSpendLimit() {
    return hasSavedMiscSpendLimit();
  },

  getMiscSpendLimit() {
    return getMiscSpendLimit();
  },

  setMiscSpendLimit(limit) {
    return setMiscSpendLimit(limit);
  },

  // Top-Level KPI Summary
  async getSummary() {
    return getSummaryMetrics();
  },

  // Daily Burn Rate Time-Series
  async getDailyBurnRate(days = 30) {
    return computeDailyBurnRate(days);
  },

  // Categorical Variance Distribution
  async getCategoricalVariance() {
    return computeCategoricalVariance();
  },

  // Identified Anomalies List
  async getAnomalies(limit = 100) {
    return computeAnomaliesList(limit);
  },

  // Paginated Transactions Ledger
  async getTransactions(page = 1, limit = 50, varianceOnly = false, categoryId = null) {
    return computeListTransactions(page, limit, varianceOnly, categoryId);
  },

  // 3NF Categories Listing
  async getCategories() {
    return DEFAULT_CATEGORIES;
  },

  // In-Browser CSV Ingestion via PapaParse
  async uploadCSV(file) {
    return await parseStatementCSV(file);
  },

  // Direct UPI NLP Sandbox Tester
  async parseRawUPI(rawUPIString, amount = 100.0) {
    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 100.0;
    return analyzeTransaction(rawUPIString, parsedAmount);
  },
};
