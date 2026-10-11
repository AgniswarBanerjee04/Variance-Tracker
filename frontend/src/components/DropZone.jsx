import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { api } from '../services/api';

function DropZoneBase({ isOpen, onClose, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const summary = await api.uploadCSV(selectedFile);
      setResult(summary);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.message || 'Failed to process CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleData = async () => {
    setUploading(true);
    setError(null);
    try {
      const sampleCsv = `Date,Description,Amount,Transaction_Type
2026-10-01,UPI/RENT_PAYMENT_OCT/HDFC_BANK,12000.00,Debit
2026-10-02,UPI/PAYTM*QR_CHAI_TAPRI/SBI,40.00,Debit
2026-10-02,UPI/SWIGGY_INSTAMART/ICICI,145.00,Debit
2026-10-03,POS/RELIANCE_SMART_GROCERY/HDFC,2450.00,Debit
2026-10-04,UPI/ZOMATO_FOOD_DLVRY/AXIS,320.00,Debit
2026-10-05,NEFT/ELECTRICITY_BILL_WBSEDCL/SBI,1450.00,Debit
2026-10-05,UPI/PAYTM*QR_CIGARETTE_SHOP/HDFC,90.00,Debit
2026-10-06,UPI/UBER_RIDES_INDIA/ICICI,180.00,Debit
2026-10-07,UPI/NETFLIX_SUBSCRIPTION/AXIS,199.00,Debit
2026-10-08,UPI/PAYTM*QR_SNACKS_CORNER/SBI,65.00,Debit
2026-10-09,POS/APOLLO_PHARMACY/HDFC,850.00,Debit
2026-10-10,UPI/SWIGGY_FOOD/ICICI,410.00,Debit`;

      const blob = new Blob([sampleCsv], { type: 'text/csv' });
      const file = new File([blob], 'test_statement.csv', { type: 'text/csv' });
      const summary = await api.uploadCSV(file);
      setResult(summary);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.message || 'Failed to ingest sample statement.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-xl rounded-2xl sm:rounded-3xl p-7 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-sky-400 backdrop-blur-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Ingest Bank & UPI Statement
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload raw CSV statements to normalize irregular UPI strings and isolate micro-spends.
              </p>
            </div>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragging
              ? 'border-sky-400 bg-sky-500/10'
              : selectedFile
              ? 'border-emerald-400/40 bg-emerald-500/5'
              : 'border-white/10 hover:border-white/20 bg-white/[0.03]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
              {selectedFile ? (
                <FileText className="w-6 h-6 text-emerald-400" />
              ) : (
                <UploadCloud className="w-6 h-6 text-sky-400" />
              )}
            </div>
            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-emerald-300">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-white">
                  Drop statement CSV here, or <span className="text-sky-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports standard UPI, HDFC, SBI, ICICI, and Paytm CSV formats
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fast Action: Quick Ingest Mock Statement */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleLoadSampleData}
            disabled={uploading}
            className="text-sky-300 hover:text-sky-200 font-medium flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Load Evaluation Mock Data (test_statement.csv)</span>
          </button>
          <span className="text-[11px] text-slate-400">12 Mock Records</span>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs"
            >
              <div className="flex items-center gap-2 font-medium text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ingestion Complete & Normalized into 3NF Ledger!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2.5 font-mono text-[11px] text-slate-300">
                <div>Total Ingested: <strong className="text-white">{result.total_processed}</strong></div>
                <div>Anomalies Flagged: <strong className="text-rose-300">{result.anomalies_detected}</strong></div>
                <div>Normal Spends: <strong className="text-emerald-400">{result.normal_spends}</strong></div>
                <div>Parsed Spend: <strong className="text-sky-300">₹{result.total_expenditure_parsed?.toFixed(2)}</strong></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-sky-500/80 hover:bg-sky-500 border border-sky-400/30 transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Normalizing Statement...</span>
              </>
            ) : (
              <span>Start Ingestion & Analysis</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export const DropZone = React.memo(DropZoneBase);
export default DropZone;
