import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle,
  ShieldCheck,
  FileSearch,
  AlertTriangle,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SidebarToggle } from '../components/WorkspaceLayout';
import ProfileDropdown from '../components/ProfileDropdown';

const NON_LEGAL_FILE_ERROR =
  'This file does not appear to be related to law. Please upload a legal or law-related document to continue.';

const CaseAnalyzerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadResult(null);
      setAnalysisResult(null);
      setError('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setAnalysisResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const uploadedDocument = await api.uploadDocument(user, file);
      setUploadResult(uploadedDocument);

      if (!uploadedDocument.is_legal_document) {
        const uploadMessage = typeof uploadedDocument.message === 'string'
          ? uploadedDocument.message.trim()
          : '';

        setFile(null);
        setUploadResult(null);
        setAnalysisResult(null);
        setError(
          uploadMessage
            ? `${uploadMessage} Only law-related files can be analyzed here.`
            : NON_LEGAL_FILE_ERROR
        );

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        return;
      }

      const analyzedCase = await api.analyzeCase(user, {
        structured_data: uploadedDocument.structured_data,
        documents: uploadedDocument.documents,
        raw_text: uploadedDocument.extracted_text,
        document_id: uploadedDocument.stored_document?.id || null,
      });

      setAnalysisResult(analyzedCase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalyzer = () => {
    setFile(null);
    setUploadResult(null);
    setAnalysisResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top_right,_rgba(219,234,254,0.42),_transparent_34%),#f7f9fc] text-slate-900">
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 text-[10px] sm:text-[11px]">
            <SidebarToggle />
            <span className="truncate font-semibold text-slate-700">Case Analyzer</span>
          </div>
          <div className="flex items-center gap-2">
            <ProfileDropdown />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-7 sm:pt-8 lg:px-10">
          <div className="mb-6 flex items-start gap-3.5 sm:mb-7">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
              className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-[0_2px_6px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-x-0.5 hover:border-blue-200 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 pt-0.5">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-700/80">
                Document intelligence
              </p>
              <h1 className="text-xl font-bold tracking-[-0.035em] text-slate-950 sm:text-2xl">Case Analyzer</h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                Upload a legal document to score case strength, case difficulty, and document evidence.
              </p>
            </div>
          </div>

          <div className="flex w-full justify-center">
        <AnimatePresence mode="wait">
          {!uploadResult && !analysisResult && !isAnalyzing ? (
            <motion.div
              key="upload-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-[0_10px_34px_rgba(15,23,42,0.055)] sm:rounded-3xl sm:p-5"
            >
              <div className="mb-3 flex w-full items-center justify-between px-1 text-left sm:px-2">
                <div>
                  <h2 className="text-xs font-semibold tracking-tight text-slate-800 sm:text-sm">Upload a case document</h2>
                  <p className="mt-0.5 text-[10px] text-slate-400 sm:text-[11px]">Securely add a file to begin your analysis</p>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/70 px-2.5 py-1 text-[9px] font-medium text-emerald-700 sm:inline-flex">
                  <LockKeyhole size={10} />
                  Private &amp; secure
                </span>
              </div>
              {!file ? (
                <motion.div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Choose or drop a legal document to upload"
                  whileHover={{ scale: 1.003 }}
                  whileTap={{ scale: 0.998 }}
                  animate={isDragActive ? { scale: 1.006 } : { scale: 1 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className={`relative isolate flex w-full min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-5 py-8 outline-none transition-colors focus-visible:ring-4 focus-visible:ring-blue-100 sm:min-h-60 sm:rounded-2xl sm:px-8 sm:py-10 ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50/90 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]'
                      : 'border-blue-200 bg-[linear-gradient(135deg,#f8fbff_0%,#f2f7ff_55%,#faf9ff_100%)] hover:border-blue-300'
                  }`}
                >
                  <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 -z-10 h-48 w-48 rounded-full bg-blue-200/20 blur-3xl" />
                  <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-12 -z-10 h-48 w-48 rounded-full bg-indigo-200/20 blur-3xl" />
                  <motion.div
                    animate={isDragActive ? { y: -3, scale: 1.06 } : { y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    className="relative mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-[0_6px_18px_rgba(37,99,235,0.12)] sm:h-14 sm:w-14"
                  >
                    <UploadCloud size={22} strokeWidth={1.8} />
                    <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-blue-600 text-white">
                      <Sparkles size={8} />
                    </span>
                  </motion.div>
                  <h3 className="mb-1.5 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                    {isDragActive ? 'Drop your document to upload' : 'Click or drag a file to upload'}
                  </h3>
                  <p className="text-[10px] text-slate-500 sm:text-xs">
                    Supports PDF, TXT, and images <span className="text-slate-400">·</span> up to 20 MB
                  </p>
                  <div className="my-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-slate-300">
                    <span className="h-px w-5 bg-slate-200" />
                    or choose from your device
                    <span className="h-px w-5 bg-slate-200" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100/80 bg-white/90 px-2.5 py-1.5 text-[9px] text-slate-500 shadow-[0_2px_6px_rgba(15,23,42,0.03)] sm:text-[10px]">
                    <ShieldCheck size={11} className="text-blue-600" />
                    Only legal or law-related documents can be analyzed.
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,image/*"
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex w-full min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-[linear-gradient(135deg,#f8fbff,#f7f8ff)] p-6 sm:min-h-60 sm:rounded-2xl"
                >
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-emerald-100 bg-white text-emerald-600 shadow-sm">
                    <FileText size={21} />
                  </div>
                  <h3 className="mb-1 max-w-full truncate text-sm font-semibold text-slate-800 sm:max-w-2xl sm:text-base">{file.name}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                    <CheckCircle size={14} /> Ready for analysis
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
                  >
                    Remove file
                  </button>
                </motion.div>
              )}

              {error && (
                <div className="mt-6 w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-left text-sm text-red-700">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={file ? { scale: 1.02 } : {}}
                whileTap={file ? { scale: 0.98 } : {}}
                onClick={handleAnalyze}
                disabled={!file}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[11px] font-semibold tracking-wide transition-all shadow-sm sm:text-xs ${
                file
                  ? 'bg-linear-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-[0_5px_16px_rgba(37,99,235,0.2)] hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 hover:shadow-[0_7px_20px_rgba(37,99,235,0.24)]'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400 shadow-none'
                }`}
              >
                <Sparkles size={13} />
                Start Legal Analysis
              </motion.button>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div
              key="loading-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center shadow-[0_10px_34px_rgba(15,23,42,0.05)] sm:py-20"
            >
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Loader2 size={28} className="animate-spin" />
              </div>
              <h2 className="mb-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Analyzing Document...</h2>
              <p className="text-xs text-slate-500 sm:text-sm">Uploading, extracting entities, and running case analysis.</p>
            </motion.div>
          ) : uploadResult && !analysisResult ? (
            <motion.div
              key="error-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_34px_rgba(15,23,42,0.06)] sm:p-8"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <AlertTriangle size={26} />
                <h2 className="text-2xl font-bold text-slate-900">Analysis did not complete</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {error || 'The document upload completed, but the analysis response did not return successfully.'}
              </p>
              <button
                onClick={resetAnalyzer}
                className="mt-8 btn-primary"
              >
                Try Another Document
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="results-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full max-w-5xl flex-col pb-4 sm:pb-12"
            >
              {/* ── Results Header ── */}
              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-700/80">Case review</p>
                  <h2 className="mb-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Analysis Results</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText size={14} className="shrink-0" />
                    <span className="max-w-48 truncate sm:max-w-xs md:max-w-md">{file?.name}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600 sm:text-xs">
                    Case Type: {uploadResult?.structured_data?.case_type || 'Unknown'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-700 sm:text-xs">
                    Confidence: {analysisResult?.confidence_score}%
                  </span>
                  <button
                    onClick={resetAnalyzer}
                    className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 sm:text-sm"
                  >
                    Analyze New File
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ── Three Metric Cards ── */}
              <div className="mb-6 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                {/* Case Strength */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-[linear-gradient(145deg,rgba(236,253,245,0.8),rgba(255,255,255,0.96))] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)] sm:p-6">
                  <div className="absolute top-4 right-4 text-green-200">
                    <ShieldCheck size={48} strokeWidth={1.2} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-600 mb-1">Case Strength</h3>
                  <div className={`text-2xl font-extrabold mb-3 ${
                    analysisResult?.case_strength === 'Strong' ? 'text-green-600' :
                    analysisResult?.case_strength === 'Weak' ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {analysisResult?.case_strength}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pr-8">
                    {analysisResult?.summary || 'The case has been evaluated based on the available evidence and extracted data.'}
                  </p>
                </div>

                {/* Case Difficulty */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-100/80 bg-[linear-gradient(145deg,rgba(255,251,235,0.85),rgba(255,255,255,0.96))] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)] sm:p-6">
                  <div className="absolute top-4 right-4 text-amber-200">
                    <AlertTriangle size={48} strokeWidth={1.2} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-600 mb-1">Case Difficulty</h3>
                  <div className={`text-2xl font-extrabold mb-3 ${
                    analysisResult?.case_difficulty === 'Easy' ? 'text-green-600' :
                    analysisResult?.case_difficulty === 'Hard' ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {analysisResult?.case_difficulty}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pr-8">
                    Difficulty is based on the extracted facts, missing evidence, and overall case complexity.
                  </p>
                </div>

                {/* Primary Evidence */}
                <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-[linear-gradient(145deg,rgba(239,246,255,0.85),rgba(255,255,255,0.96))] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)] sm:p-6">
                  <div className="absolute top-4 right-4 text-blue-200">
                    <FileSearch size={48} strokeWidth={1.2} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-600 mb-1">Primary Evidence</h3>
                  <div className={`text-2xl font-extrabold mb-3 ${
                    (uploadResult?.structured_data?.evidence_strength || '') === 'Strong' ? 'text-green-600' :
                    (uploadResult?.structured_data?.evidence_strength || '') === 'Weak' ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {uploadResult?.structured_data?.evidence_strength || 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pr-8">
                    {(analysisResult?.document_analysis && analysisResult.document_analysis[0]?.reason)
                      || 'The document contains detailed information about the case, including the parties involved, dates, and key clauses.'}
                  </p>
                </div>
              </div>

              {/* ── Strong & Weak Points ── */}
              <div className="mb-5 grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Strong Points</h3>
                  <ul className="space-y-3">
                    {(analysisResult?.strong_points || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Weak Points</h3>
                  <ul className="space-y-3">
                    {(analysisResult?.weak_points || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── Next Steps & Document Analysis ── */}
              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Next Steps</h3>
                  <ul className="space-y-3">
                    {(analysisResult?.next_steps || []).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span className="text-sm text-slate-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Document Analysis</h3>
                  <div className="space-y-4">
                    {(analysisResult?.document_analysis || []).map((doc, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold text-sm text-gray-800">{doc.document_type}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            doc.evidence_strength === 'Strong' ? 'text-green-700 bg-green-100' :
                            doc.evidence_strength === 'Weak' ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100'
                          }`}>
                            {doc.evidence_strength}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{doc.reason}</p>
                      </div>
                    ))}
                    {(!analysisResult?.document_analysis || analysisResult.document_analysis.length === 0) && (
                      <p className="text-sm text-gray-400 italic">No document analysis available.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>

          {!uploadResult && !analysisResult && !isAnalyzing && (
            <>
              <motion.section
                aria-label="Analysis capabilities"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
                }}
                className="mt-5 grid w-full grid-cols-1 gap-3.5 sm:grid-cols-3"
              >
                {[
                  {
                    title: 'Case Strength',
                    description: 'Evaluate core legal arguments and merits of the case.',
                    icon: <ShieldCheck size={14} />,
                    color: 'bg-blue-50 text-blue-600',
                  },
                  {
                    title: 'Case Difficulty',
                    description: 'Identify potential counter-claims and procedural challenges.',
                    icon: <AlertTriangle size={14} />,
                    color: 'bg-violet-50 text-violet-600',
                  },
                  {
                    title: 'Document Evidence',
                    description: 'Organize relevant citations, dates, and supporting facts.',
                    icon: <FileSearch size={14} />,
                    color: 'bg-indigo-50 text-indigo-600',
                  },
                ].map(({ title, description, icon, color }) => (
                  <motion.article
                    key={title}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
                    whileTap={{ scale: 0.99 }}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.035)] transition-shadow duration-200 hover:border-blue-100 hover:shadow-[0_14px_28px_rgba(15,23,42,0.075)] sm:p-5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`grid h-8 w-8 place-items-center rounded-xl ring-1 ring-black/[0.03] transition-transform duration-200 group-hover:scale-105 ${color}`}>
                        {icon}
                      </span>
                      <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Analysis
                      </span>
                    </div>
                    <h2 className="mb-1 text-xs font-semibold tracking-tight text-slate-900 sm:text-[13px]">{title}</h2>
                    <p className="text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">{description}</p>
                  </motion.article>
                ))}
              </motion.section>
              <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[9px] text-slate-400">
                <LockKeyhole size={10} />
                Confidential &amp; encrypted under SOC2 &amp; attorney-client privilege guidelines
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CaseAnalyzerPage;
