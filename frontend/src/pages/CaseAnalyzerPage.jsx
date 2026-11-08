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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

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
    <div className="flex min-h-dvh flex-col bg-linear-to-br from-gray-50 to-gray-100">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full bg-white p-2 text-gray-500 shadow transition-all hover:text-gray-900 hover:shadow-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">Case Analyzer</h1>
              <p className="text-gray-500 max-w-2xl mt-1">
                Upload a legal document to score case strength, case difficulty, and document evidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex w-full justify-center px-4 pb-8 sm:mt-6 sm:px-6 lg:px-8 lg:pb-12">
        <AnimatePresence mode="wait">
          {!uploadResult && !analysisResult && !isAnalyzing ? (
            <motion.div
              key="upload-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="flex w-full max-w-4xl flex-col items-center rounded-3xl bg-white px-4 py-6 text-center shadow-lg transition-shadow duration-300 hover:shadow-xl sm:px-8 sm:py-10 md:px-12 md:py-12"
            >
              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex w-full min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-colors sm:min-h-85 sm:px-10 sm:py-14 md:min-h-95 md:px-14 md:py-16 ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                  }`}
                >
                  <div className="bg-blue-100 text-blue-600 rounded-full p-5 mb-5">
                    <UploadCloud size={40} />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-800 sm:text-2xl">
                    Click or drag file to this area to upload
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 sm:text-base">
                    Supports PDF, TXT, and images up to 20 MB.
                  </p>
                  <p className="text-sm text-gray-400 mt-3">
                    Only legal or law-related documents can be analyzed.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,image/*"
                  />
                </div>
              ) : (
                <div className="flex w-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-gray-100 bg-gray-50/30 p-6 sm:min-h-75 sm:p-10 md:p-12">
                  <div className="bg-green-100 text-green-600 rounded-full p-5 mb-5">
                    <FileText size={40} />
                  </div>
                  <h3 className="mb-2 max-w-full truncate text-xl font-medium text-gray-800 sm:max-w-2xl sm:text-2xl">{file.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-green-500 sm:text-base">
                    <CheckCircle size={16} /> Ready for analysis
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Remove file
                  </button>
                </div>
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
              className={`mt-8 w-full rounded-2xl py-4 text-base font-medium transition-all shadow-md sm:text-lg ${
                file
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                }`}
              >
                Start Legal Analysis
              </motion.button>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div
              key="loading-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20"
            >
              <Loader2 size={48} className="text-gray-900 animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Document...</h2>
              <p className="text-gray-500">Uploading, extracting entities, and running case analysis.</p>
            </motion.div>
          ) : uploadResult && !analysisResult ? (
            <motion.div
              key="error-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg sm:p-8"
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
              <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Analysis Results</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText size={14} className="shrink-0" />
                    <span className="max-w-[12rem] truncate sm:max-w-xs md:max-w-md">{file?.name}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
                    Case Type: {uploadResult?.structured_data?.case_type || 'Unknown'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    Confidence: {analysisResult?.confidence_score}%
                  </span>
                  <button
                    onClick={resetAnalyzer}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
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
              <div className="mb-8 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
                {/* Case Strength */}
                <div className="relative overflow-hidden rounded-2xl border border-green-100 bg-green-50/60 p-5 sm:p-6">
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
                <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/60 p-5 sm:p-6">
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
                <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
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
    </div>
  );
};

export default CaseAnalyzerPage;
