import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  Trash2,
  Plus,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

function DropZoneBase({ isOpen, onClose, onUploadSuccess, currentUser }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      appendFiles(Array.from(e.dataTransfer.files));
    }
  };

  const appendFiles = (incomingFiles) => {
    const validCsvs = incomingFiles.filter((f) => f.name.toLowerCase().endsWith('.csv'));
    if (!validCsvs.length) {
      setError('Please select valid .csv bank/UPI statement files.');
      return;
    }

    setError(null);
    setResult(null);

    // Merge without adding duplicate file names in selection
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((p) => p.name));
      const filteredIncoming = validCsvs.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filteredIncoming];
    });
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length) {
      appendFiles(Array.from(e.target.files));
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setResult(null);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setError(null);
    try {
      // Pass full array of files for concurrent in-browser PapaParse & deduplication (scoped to currentUser)
      const summary = await api.uploadCSV(selectedFiles, currentUser);
      setResult(summary);
      
      // Update global/parent state immediately
      if (onUploadSuccess) {
        await onUploadSuccess(summary);
      }
      
      // Reset files queue
      setSelectedFiles([]);
      
      // Auto-close modal immediately upon successful ingestion & state sync
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to process CSV statements.');
      setUploading(false);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeKb = (totalBytes / 1024).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-xl rounded-2xl sm:rounded-3xl p-7 obsidian-card relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sky-400 backdrop-blur-md shadow-[0_0_12px_-2px_rgba(56,189,248,0.25)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 tracking-tight">
                Batch Ingest Statements
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Upload multiple CSV bank/UPI statements. Automatic cross-file deduplication and vendor aggregation.
              </p>
            </div>
          </div>
        </div>

        {/* Hidden Multi-file Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors duration-200 transform-gpu ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/10'
              : selectedFiles.length > 0
              ? 'border-emerald-400/40 bg-emerald-500/5'
              : 'border-white/[0.08] hover:border-white/[0.18] bg-[#07090E]/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
              {selectedFiles.length > 0 ? (
                <Layers className="w-6 h-6 text-emerald-400" />
              ) : (
                <UploadCloud className="w-6 h-6 text-sky-400" />
              )}
            </div>

            {selectedFiles.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'Statement File' : 'Files Selected'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">({totalSizeKb} KB total)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click or drag more files to add to the batch
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-white">
                  Drop statement CSV files here, or <span className="text-sky-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports multi-file batch upload (UPI, HDFC, SBI, ICICI, Paytm formats)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Files List Drawer */}
        {selectedFiles.length > 0 && (
          <div className="mt-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Batch File Queue ({selectedFiles.length})
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sky-400 hover:text-sky-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add File</span>
                </button>
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {selectedFiles.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0D121D]/70 border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate">{f.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove from batch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
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
              className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Batch Merged: {result.total_files_processed || 1} Statement{' '}
                    {(result.total_files_processed || 1) > 1 ? 'Files' : 'File'} Ingested!
                  </span>
                </div>
                {result.duplicates_skipped_count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {result.duplicates_skipped_count} Duplicates Prevented
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 font-mono text-[11px] text-slate-300">
                <div className="p-2 rounded-lg bg-black/20">
                  <span className="block text-[10px] text-slate-400 font-sans">Total Ingested</span>
                  <strong className="text-slate-50 text-xs">{result.total_processed ?? result.inserted_count ?? 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <span className="block text-[10px] text-slate-400 font-sans">Anomalies</span>
                  <strong className="text-rose-400 text-xs">{result.anomalies_detected ?? result.anomalies_flagged_count ?? 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <span className="block text-[10px] text-slate-400 font-sans">Normal Spends</span>
                  <strong className="text-emerald-400 text-xs">{result.normal_spends ?? 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <span className="block text-[10px] text-slate-400 font-sans">Parsed Spend</span>
                  <strong className="text-sky-400 text-xs">₹{((result.total_expenditure_parsed ?? result.total_anomaly_spend ?? 0)).toFixed(2)}</strong>
                </div>
              </div>

              {result.top_vendors_consolidated && result.top_vendors_consolidated.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-emerald-500/20 text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-medium">Consolidated Vendors:</span>
                  {result.top_vendors_consolidated.map((v, i) => (
                    <span key={v.vendor} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-200">
                      {v.vendor} ({v.count})
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition-colors duration-200 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFiles.length || uploading}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-40 transform-gpu active:scale-95 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Normalizing {selectedFiles.length} {selectedFiles.length === 1 ? 'Statement' : 'Statements'}...
                </span>
              </>
            ) : (
              <span>
                Start Ingestion & Analysis {selectedFiles.length > 1 ? `(${selectedFiles.length} Files)` : ''}
              </span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export const DropZone = React.memo(DropZoneBase);
export default DropZone;
