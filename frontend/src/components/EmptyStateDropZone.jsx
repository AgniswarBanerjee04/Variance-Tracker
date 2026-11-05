import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';

/**
 * EmptyStateDropZone
 *
 * Standout, modern centerpiece component for the initial user state.
 * Features:
 * 1. Glassmorphic frosted container with deep charcoal gradients & animated ambient glow.
 * 2. Interactive drag-and-drop zone with scale-up on hover and neon border accents.
 * 3. Continuously floating upload icon animation.
 * 4. Sleek text-gradient typography.
 * 5. Vivid gradient action button with glowing box-shadow and click feedback.
 */
export default function EmptyStateDropZone({
  onOpenUpload,
  onUploadSuccess,
  currentUser,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const processDroppedFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    const validCsvs = files.filter((f) => f.name.toLowerCase().endsWith('.csv'));

    if (!validCsvs.length) {
      setUploadError('Please drop valid .csv bank or UPI statement files.');
      return;
    }

    setUploadError(null);
    setIsProcessing(true);

    try {
      // Ingest and analyze directly via client-side PapaParse & varianceEngine
      const summary = await api.uploadCSV(validCsvs, currentUser);
      if (onUploadSuccess) {
        await onUploadSuccess(summary);
      }
    } catch (err) {
      console.error('Direct drag & drop ingestion error:', err);
      setUploadError(err.message || 'Failed to ingest statement. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      await processDroppedFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e) => {
    if (e.target?.files?.length) {
      await processDroppedFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="relative w-full my-6 flex items-center justify-center">
      {/* 1. Subtle, Animated Glowing Ambient Light behind container */}
      <motion.div
        animate={{
          scale: isDragging ? [1.05, 1.18, 1.05] : [1, 1.12, 1],
          opacity: isDragging ? [0.6, 0.85, 0.6] : [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-indigo-500/25 via-sky-500/25 to-violet-600/25 rounded-[3rem] blur-3xl pointer-events-none -z-10 transform-gpu"
      />

      {/* Main Glassmorphic Outer Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="relative w-full max-w-3xl rounded-[2.5rem] p-6 sm:p-10 md:p-12 bg-gradient-to-b from-white/95 via-slate-50/90 to-white/95 dark:from-[#0D121D]/90 dark:via-[#0A0E18]/85 dark:to-[#07090E]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.12)] overflow-hidden"
      >
        {/* Decorative Grid Pattern Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#0000000a_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

        {/* 2. Interactive Drag-and-Drop Zone */}
        <motion.div
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.995 }}
          transition={{ duration: 0.2 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isProcessing) {
              if (onOpenUpload) onOpenUpload();
              else fileInputRef.current?.click();
            }
          }}
          className={`relative z-10 w-full rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 border-2 border-dashed transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-sky-500 dark:border-sky-400 bg-sky-500/10 shadow-[0_0_40px_-5px_rgba(56,189,248,0.45)] scale-[1.02]'
              : 'border-slate-300 dark:border-white/[0.12] hover:border-sky-500/60 dark:hover:border-sky-400/50 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] shadow-inner dark:shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]'
          }`}
        >
          {/* Hidden File Input for fallback or direct click selection */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* 3. Floating Icon Animation */}
          <div className="relative">
            <motion.div
              animate={{
                y: isProcessing ? 0 : [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-white/[0.08] dark:to-white/[0.02] border border-slate-300/80 dark:border-white/[0.14] flex items-center justify-center shadow-md dark:shadow-[0_10px_30px_-5px_rgba(56,189,248,0.3)] backdrop-blur-md group"
            >
              {/* Inner ambient glow behind the icon */}
              <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 blur-md pointer-events-none" />

              {isProcessing ? (
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-sky-500 dark:text-sky-400 animate-spin" />
              ) : (
                <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-sky-500 dark:text-sky-400 transition-transform duration-300 group-hover:scale-110" />
              )}
            </motion.div>

            {/* Sparkle decorative indicator */}
            {!isProcessing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-2 -right-2 p-1.5 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-500/30 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300 backdrop-blur-md shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </div>

          {/* 4. Premium Typography */}
          <div className="max-w-lg space-y-2.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              No Statement Ingested Yet
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
              Please Ingest a CSV to view analytics
            </p>
            <p className="text-xs text-slate-500 font-normal">
              Drag and drop your bank or UPI statements directly here, or click to browse
            </p>
          </div>

          {/* 5. Upgraded Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <motion.button
              type="button"
              disabled={isProcessing}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenUpload) onOpenUpload();
                else fileInputRef.current?.click();
              }}
              className="px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-600 hover:from-indigo-400 hover:via-sky-400 hover:to-violet-500 border border-indigo-400/30 shadow-[0_0_25px_-3px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(56,189,248,0.6)] transition-all duration-300 flex items-center gap-2.5 cursor-pointer transform-gpu"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Parsing Statements...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-white" />
                  <span>Ingest Statement CSV</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Error Notification Banner if drag & drop fails */}
          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-2 text-xs text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/25 px-4 py-2 rounded-xl"
              >
                {uploadError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Supported Format Pills */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Standard .CSV Format</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Multi-File Batch Merge</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>100% Client-Side Private</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

