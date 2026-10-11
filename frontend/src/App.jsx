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
import ErrorBoundary from './components/ErrorBoundary';
import { api, authStorage } from './services/api';
import { GraduationCap, ShieldCheck, Cpu, Database, Edit3 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  const [viewMode, setViewMode] = useState(() => (authStorage.getToken() ? 'dashboard' : 'auth'));
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);



  // Analytics states
  const [metrics, setMetrics] = useState(null);
  const [burnRateData, setBurnRateData] = useState(null);
  const [categoricalData, setCategoricalData] = useState(null);
  const [anomaliesData, setAnomaliesData] = useState(null);

  // Transactions ledger state
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
        })
        .catch(() => {
          // Token expired or invalid
          authStorage.removeToken();
          setCurrentUser(null);
        });
    }
  }, []);

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
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
        api.getTransactions(page, 20, varianceOnly, selectedCategory).catch(() => ({ items: [], total: 0 })),
        api.getCategories().catch(() => []),
      ]);

      if (summaryRes) setMetrics(summaryRes);
      if (burnRes) setBurnRateData(burnRes);
      if (catRes) setCategoricalData(catRes);
      if (anomRes) setAnomaliesData(anomRes);
      if (txsRes) {
        setTransactions(txsRes.items || []);
        setTotalTransactions(txsRes.total || 0);
      }
      if (catsRes) setCategories(catsRes);
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

  const handleAuthSuccess = (user) => {
    const verifiedUser = user || authStorage.getUser() || { full_name: 'MCA Scholar' };
    setCurrentUser(verifiedUser);
    setViewMode('dashboard');
    loadDashboardData();
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setViewMode('auth');
  };

  // If in Auth mode, show full-screen animated Auth Portal
  if (viewMode === 'auth') {
    return (
      <ErrorBoundary>
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          onBypass={() => setViewMode('dashboard')}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Deep Animated Gradient Mesh Background */}
      <div className="animated-mesh-bg">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Top Glassmorphic Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onRefresh={loadDashboardData}
        loading={loading}
        onOpenAuth={() => setViewMode('auth')}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
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

        {/* SLEEK GLASS-PANELED ACADEMIC WATERMARK (TASK 3 DIRECTIVE) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full pt-2"
        >
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl p-4 sm:p-5 relative text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300 shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm font-normal text-white/50 tracking-wide">
                Developed by Agniswar Banerjee &amp; Abhirup Dasgupta | Program: MCA | Department of Computer Applications | Meghnad Saha Institute of Technology
              </p>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-transparent py-4 text-center text-xs text-white/50 backdrop-blur-xl">
        <p>
          FastAPI Backend &bull; Async PostgreSQL (3NF) &bull; React & Tailwind &bull; Framer Motion &bull; Recharts &bull; NLP Anomaly Model
        </p>
      </footer>

      {/* Modals */}
      <DropZone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={loadDashboardData}
      />

      <NLPSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
      />
      </div>
    </ErrorBoundary>
  );
}
