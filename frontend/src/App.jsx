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
import ErrorBoundary from './components/ErrorBoundary';
import { api, authStorage } from './services/api';
import { GraduationCap, CheckCircle2, X, UploadCloud, Upload } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  
  // Mandatory Onboarding Guard: If authenticated but no spend limit is configured in localStorage,
  // enforce onboarding view mode before allowing access to the main dashboard.
  const [viewMode, setViewMode] = useState(() => {
    const token = authStorage.getToken();
    if (!token) return 'auth';
    if (!api.hasSavedMiscSpendLimit()) return 'onboarding';
    return 'dashboard';
  });

  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Miscellaneous spend limit and prominent alert modal state
  const [miscLimit, setMiscLimit] = useState(() => api.getMiscSpendLimit());
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

  // Check auth status on load
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      api.getMe()
        .then((user) => {
          setCurrentUser(user);
          authStorage.setUser(user);
          // If no budget limit has been saved, prompt onboarding
          if (!api.hasSavedMiscSpendLimit()) {
            setViewMode('onboarding');
          }
        })
        .catch(() => {
          authStorage.removeToken();
          setCurrentUser(null);
          setViewMode('auth');
        });
    }
  }, []);

  // Fetch all dashboard data
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
        api.getSummary().catch(() => null),
        api.getDailyBurnRate(30).catch(() => null),
        api.getCategoricalVariance().catch(() => null),
        api.getAnomalies(50).catch(() => null),
        api.getTransactions(targetPage, 20, targetVariance, targetCat).catch(() => ({ items: [], total: 0 })),
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
  }, [page, varianceOnly, selectedCategory]);

  useEffect(() => {
    if (viewMode === 'dashboard') {
      loadDashboardData();
    }
  }, [viewMode, loadDashboardData]);

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
    loadDashboardData();
  }, [loadDashboardData]);

  // Transition from Auth: Enforce onboarding if no limit exists
  const handleAuthSuccess = (user) => {
    const verifiedUser = user || authStorage.getUser() || { full_name: 'User Profile' };
    setCurrentUser(verifiedUser);
    if (!api.hasSavedMiscSpendLimit()) {
      setViewMode('onboarding');
    } else {
      setViewMode('dashboard');
      loadDashboardData();
    }
  };

  // Transition from Mandatory Onboarding to Main Dashboard
  const handleOnboardingComplete = (savedLimit) => {
    setMiscLimit(savedLimit);
    setViewMode('dashboard');
    loadDashboardData();
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setViewMode('auth');
  };

  // View Mode: Authentication Portal
  if (viewMode === 'auth') {
    return (
      <ErrorBoundary>
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          onBypass={() => {
            if (!api.hasSavedMiscSpendLimit()) {
              setViewMode('onboarding');
            } else {
              setViewMode('dashboard');
            }
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
  const hasData = totalTransactions > 0;

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
        
        {/* Metric Cards Banner with Framer Motion & CountUp */}
        <MetricCards metrics={metrics} />

        {/* Clean "No Data" Empty State: Shown until user ingests real statement files */}
        {!hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="obsidian-card rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 border border-dashed border-white/[0.12] my-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 shadow-[0_0_20px_-3px_rgba(56,189,248,0.25)]">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                No Statement Ingested Yet
              </h3>
              <p className="text-sm text-slate-400 font-medium">
                Upload a CSV to view your analytics.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="mt-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2 cursor-pointer transform-gpu active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Ingest Statement CSV</span>
            </button>
          </motion.div>
        ) : (
          <>
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
        onLimitSaved={(newLimit) => {
          setMiscLimit(newLimit);
          loadDashboardData();
        }}
      />

      </div>
    </ErrorBoundary>
  );
}
