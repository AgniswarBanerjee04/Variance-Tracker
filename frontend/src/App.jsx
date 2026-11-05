import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import DailyBurnRatePanel from './components/DailyBurnRatePanel';
import CategoricalVariancePanel from './components/CategoricalVariancePanel';
import AnomalyListPanel from './components/AnomalyListPanel';
import TransactionLedgerTable from './components/TransactionLedgerTable';
import DropZone from './components/DropZone';
import NLPSandboxModal from './components/NLPSandboxModal';
import AuthPage from './components/AuthPage';
import OnboardingLimitModal from './components/OnboardingLimitModal';
import MiscSpendAlertModal from './components/MiscSpendAlertModal';
import BudgetLimitModal from './components/BudgetLimitModal';
import EmptyStateDropZone from './components/EmptyStateDropZone';
import ErrorBoundary from './components/ErrorBoundary';
import { api, authStorage } from './services/api';
import { GraduationCap, CheckCircle2, X, UploadCloud, Upload } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  
  // Mandatory Onboarding Guard: If authenticated but no spend limit is configured in localStorage,
  // enforce onboarding view mode before allowing access to the main dashboard.
  const [viewMode, setViewMode] = useState(() => {
    const token = authStorage.getToken();
    const user = authStorage.getUser();
    if (!token || !user) return 'auth';
    if (!api.hasSavedMiscSpendLimit(user)) return 'onboarding';
    return 'dashboard';
  });

  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Miscellaneous spend limit and prominent alert modal state
  const [miscLimit, setMiscLimit] = useState(() => api.getMiscSpendLimit(currentUser));
  const [miscAlertData, setMiscAlertData] = useState({
    isOpen: false,
    limit: 2000,
    totalSpend: 0,
  });

  // Analytics states (strictly 0 and [] on initial render - Hard Delete of all Mock Data)
  const [metrics, setMetrics] = useState({
    total_transactions: 0,
    total_expenditure: 0,
    total_anomalies_flagged: 0,
    total_anomaly_drain: 0,
    average_burn_rate: 0,
    anomaly_drain_ratio: 0,
  });
  const [burnRateData, setBurnRateData] = useState({
    items: [],
    average_daily_burn: 0,
    highest_spend_date: null,
  });
  const [categoricalData, setCategoricalData] = useState({
    items: [],
    dominant_category: null,
  });
  const [anomaliesData, setAnomaliesData] = useState({
    items: [],
    total_anomalies: 0,
    total_anomaly_drain: 0,
  });

  // Transactions ledger state (strictly empty initially)
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const [varianceOnly, setVarianceOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  // Complete state reset function to guarantee blank canvas on user switch or logout
  const resetDashboardState = useCallback(() => {
    setMetrics({
      total_transactions: 0,
      total_expenditure: 0,
      total_anomalies_flagged: 0,
      total_anomaly_drain: 0,
      average_burn_rate: 0,
      anomaly_drain_ratio: 0,
    });
    setBurnRateData({
      items: [],
      average_daily_burn: 0,
      highest_spend_date: null,
    });
    setCategoricalData({
      items: [],
      dominant_category: null,
    });
    setAnomaliesData({
      items: [],
      total_anomalies: 0,
      total_anomaly_drain: 0,
    });
    setTransactions([]);
    setTotalTransactions(0);
    setCategories([]);
    setPage(1);
    setVarianceOnly(false);
    setSelectedCategory(null);
  }, []);

  // Clear State on Auth Change: Whenever currentUser changes or logs out,
  // immediately reset all transaction arrays to [] and all metric totals to 0.
  useEffect(() => {
    resetDashboardState();
    if (currentUser?.id || currentUser?.email) {
      setMiscLimit(api.getMiscSpendLimit(currentUser));
    }
  }, [currentUser?.id, currentUser?.email, resetDashboardState]);

  // Check auth status on load
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      api.getMe()
        .then((user) => {
          if (user) {
            setCurrentUser(user);
            authStorage.setUser(user);
            // If no budget limit has been saved for this user, prompt onboarding
            if (!api.hasSavedMiscSpendLimit(user)) {
              setViewMode('onboarding');
            }
          } else {
            handleLogout();
          }
        })
        .catch(() => {
          handleLogout();
        });
    } else {
      setCurrentUser(null);
      setViewMode('auth');
    }
  }, []);

  // Fetch all dashboard data (strictly scoped to currentUser)
  const loadDashboardData = useCallback(async (forcedPage, forcedVariance, forcedCat) => {
    setLoading(true);
    try {
      const targetPage = forcedPage !== undefined ? forcedPage : page;
      const targetVariance = forcedVariance !== undefined ? forcedVariance : varianceOnly;
      const targetCat = forcedCat !== undefined ? forcedCat : selectedCategory;

      const [
        summaryRes,
        burnRes,
        catRes,
        anomRes,
        txsRes,
        catsRes,
      ] = await Promise.all([
        api.getSummary(currentUser).catch(() => null),
        api.getDailyBurnRate(30, currentUser).catch(() => null),
        api.getCategoricalVariance(currentUser).catch(() => null),
        api.getAnomalies(50, currentUser).catch(() => null),
        api.getTransactions(targetPage, 20, targetVariance, targetCat, currentUser).catch(() => ({ items: [], total: 0 })),
        api.getCategories().catch(() => []),
      ]);

      if (summaryRes) setMetrics({ ...summaryRes });
      if (burnRes) setBurnRateData({ ...burnRes });
      if (catRes) setCategoricalData({ ...catRes });
      if (anomRes) setAnomaliesData({ ...anomRes });
      if (txsRes) {
        setTransactions([...(txsRes.items || [])]);
        setTotalTransactions(txsRes.total || 0);
      }
      if (catsRes) setCategories([...catsRes]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, varianceOnly, selectedCategory, currentUser]);

  // Re-fetch transactions only when page/filters change AND real statement data exists
  useEffect(() => {
    if (totalTransactions > 0) {
      loadDashboardData();
    }
  }, [page, varianceOnly, selectedCategory, totalTransactions, loadDashboardData]);

  // Synchronize dashboard, check budget limits, and auto-close modal on upload success
  const handleUploadSuccess = useCallback(async (summary) => {
    // 1. Reset pagination and filters to show newest transactions
    setPage(1);
    setVarianceOnly(false);
    setSelectedCategory(null);

    // 2. Immediately reload full dashboard state
    await loadDashboardData(1, false, null);

    // 3. Check if miscellaneous / micro-anomaly spending exceeds user's defined limit
    if (summary?.misc_limit_exceeded) {
      setMiscAlertData({
        isOpen: true,
        limit: summary.misc_spend_limit || miscLimit,
        totalSpend: summary.misc_spend_total || 0,
      });
    }

    // 4. Trigger sleek status notification toast
    const inserted = summary?.inserted_count ?? summary?.total_processed ?? 0;
    const anomalies = summary?.anomalies_flagged_count ?? summary?.anomalies_detected ?? 0;
    setToastMessage({
      title: 'Batch Ingestion Complete',
      description: `${inserted} transactions processed & synchronized into ledger (${anomalies} micro-drain anomalies flagged).`,
    });
    setTimeout(() => setToastMessage(null), 5000);
  }, [loadDashboardData, miscLimit]);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  // Transition from Auth: Enforce onboarding if no limit exists
  const handleAuthSuccess = (user) => {
    const verifiedUser = user || authStorage.getUser() || { full_name: 'User' };
    setCurrentUser(verifiedUser);
    resetDashboardState();
    if (!api.hasSavedMiscSpendLimit(verifiedUser)) {
      setViewMode('onboarding');
    } else {
      setViewMode('dashboard');
    }
  };

  // Transition from Mandatory Onboarding to Main Dashboard
  const handleOnboardingComplete = (savedLimit) => {
    setMiscLimit(savedLimit);
    setViewMode('dashboard');
  };

  // Logout Wipe: Explicitly clears localStorage, removes app keys, resets all React state,
  // and redirects cleanly to authentication screen
  const handleLogout = () => {
    resetDashboardState();
    setCurrentUser(null);
    setToastMessage(null);
    setIsUploadOpen(false);
    setIsSandboxOpen(false);
    setIsBudgetModalOpen(false);
    setMiscAlertData({
      isOpen: false,
      limit: 2000,
      totalSpend: 0,
    });
    setMiscLimit(2000);

    api.logout(currentUser);

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.warn('[Variance Tracker] Failed to clear storage on logout:', err);
    }

    setViewMode('auth');
  };

  // View Mode: Authentication Portal
  if (viewMode === 'auth') {
    return (
      <ErrorBoundary>
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          onBypass={() => {
            const demoUser = {
              id: 'usr_demo_guest',
              email: 'guest@example.com',
              displayName: 'Guest User',
              name: 'Guest User',
              full_name: 'Guest User',
              created_at: new Date().toISOString(),
            };
            authStorage.setUser(demoUser);
            authStorage.setToken('vt-guest-jwt-' + Date.now());
            handleAuthSuccess(demoUser);
          }}
        />
      </ErrorBoundary>
    );
  }

  // View Mode: Mandatory Onboarding Limit Setter
  if (viewMode === 'onboarding') {
    return (
      <ErrorBoundary>
        <OnboardingLimitModal
          onComplete={handleOnboardingComplete}
          initialUser={currentUser}
        />
      </ErrorBoundary>
    );
  }

  // Only consider data present if real transactions have been parsed & ingested
  const hasData = Array.isArray(transactions) && transactions.length > 0;

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Subtle, fixed top-center radial glow */}
      <div className="obsidian-radial-glow" />

      {/* Floating Ingestion Confirmation Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="fixed top-20 right-6 z-50 max-w-md bg-[#0D121D]/95 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)] backdrop-blur-xl flex items-start gap-3"
          >
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold text-slate-50 block mb-0.5 tracking-tight">
                {toastMessage.title}
              </span>
              <span className="text-slate-300 font-medium">
                {toastMessage.description}
              </span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Glassmorphic Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenBudgetLimit={() => setIsBudgetModalOpen(true)}
        miscLimit={miscLimit}
        onRefresh={() => loadDashboardData()}
        loading={loading}
        onOpenAuth={() => setViewMode('auth')}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transform-gpu">
        
        {/* Standout Animated Centerpiece Empty State */}
        {!hasData ? (
          <EmptyStateDropZone
            onOpenUpload={() => setIsUploadOpen(true)}
            onUploadSuccess={handleUploadSuccess}
            currentUser={currentUser}
          />
        ) : (
          <>
            {/* Metric Cards Banner with Framer Motion & CountUp */}
            <MetricCards metrics={metrics} />

            {/* 2-Column Grid: Daily Burn Rate & Categorical Variance Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DailyBurnRatePanel
                data={burnRateData}
                averageBurn={burnRateData?.average_daily_burn}
                highestSpendDay={burnRateData?.highest_spend_date}
              />
              <CategoricalVariancePanel data={categoricalData} />
            </div>

            {/* Identified Anomalies List Panel */}
            <AnomalyListPanel anomaliesData={anomaliesData} />

            {/* 3NF Transaction Ledger Table */}
            <TransactionLedgerTable
              transactions={transactions}
              total={totalTransactions}
              page={page}
              limit={20}
              onPageChange={setPage}
              varianceOnly={varianceOnly}
              onToggleVariance={(val) => {
                setVarianceOnly(val);
                setPage(1);
              }}
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(val) => {
                setSelectedCategory(val);
                setPage(1);
              }}
            />
          </>
        )}

        {/* Academic Project Subheader / Watermark */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full pt-2"
        >
          <div className="obsidian-card p-4 sm:p-5 relative text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-indigo-400 shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide">
                Variance Tracker &bull; Micro-Expenditure &amp; Anomaly Detection System &bull; MCA Minor Project
              </p>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#07090E]/80 py-4 text-center text-xs text-slate-400 font-medium backdrop-blur-md">
        <p>
          Client-Side Engine &bull; In-Browser 3NF Ledger &bull; React & Tailwind &bull; Framer Motion &bull; Recharts &bull; NLP Anomaly Model
        </p>
      </footer>

      {/* Ingestion DropZone Modal */}
      <DropZone
        isOpen={isUploadOpen}
        onClose={handleCloseUploadModal}
        onUploadSuccess={handleUploadSuccess}
        currentUser={currentUser}
      />

      {/* NLP Sandbox Modal */}
      <NLPSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
      />

      {/* Prominent Miscellaneous Spend Limit Alert Modal */}
      <MiscSpendAlertModal
        isOpen={miscAlertData.isOpen}
        onClose={() => setMiscAlertData((prev) => ({ ...prev, isOpen: false }))}
        limit={miscAlertData.limit}
        totalSpend={miscAlertData.totalSpend}
      />

      {/* Budget Limit Configuration Modal */}
      <BudgetLimitModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentLimit={miscLimit}
        currentUser={currentUser}
        onLimitSaved={(newLimit) => {
          setMiscLimit(newLimit);
          loadDashboardData();
        }}
      />

      </div>
    </ErrorBoundary>
  );
}
