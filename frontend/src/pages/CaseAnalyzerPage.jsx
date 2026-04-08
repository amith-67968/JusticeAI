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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col pt-6">
      <div className="px-6 mb-6 flex items-start gap-4">
        <div>
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full bg-white shadow hover:shadow-md transition-all text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Case Analyzer</h1>
              <p className="text-gray-500 max-w-2xl mt-1">
                Upload a legal document to score case strength, case difficulty, and document evidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-10 px-4 w-full">
        <AnimatePresence mode="wait">
          {!uploadResult && !analysisResult && !isAnalyzing ? (
            <motion.div
              key="upload-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 px-8 py-10 md:px-12 md:py-12 flex flex-col items-center text-center"
            >
              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full min-h-[340px] md:min-h-[380px] border-2 border-dashed rounded-2xl px-10 py-14 md:px-14 md:py-16 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                  }`}
                >
                  <div className="bg-blue-100 text-blue-600 rounded-full p-5 mb-5">
                    <UploadCloud size={40} />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                    Click or drag file to this area to upload
                  </h3>
                  <p className="text-base text-gray-500 mt-1">
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
                <div className="w-full min-h-[300px] border-2 border-gray-100 rounded-2xl p-10 md:p-12 flex flex-col items-center justify-center bg-gray-50/30">
                  <div className="bg-green-100 text-green-600 rounded-full p-5 mb-5">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-2xl text-gray-800 font-medium mb-2 truncate max-w-2xl">{file.name}</h3>
                  <div className="flex items-center gap-1.5 text-green-500 text-base font-medium">
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
                className={`mt-8 w-full py-4 rounded-2xl text-lg font-medium transition-all shadow-md ${
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
              className="flex flex-col items-center justify-center py-20"
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
              className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8"
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
              className="w-full max-w-5xl flex flex-col pb-12"
            >
              {/* ── Results Header ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6 mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Analysis Results</h2>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <FileText size={14} className="shrink-0" />
                    <span className="truncate max-w-xs md:max-w-md">{file?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-8">
                {/* Case Strength */}
                <div className="bg-green-50/60 border border-green-100 rounded-2xl p-6 relative overflow-hidden">
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
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-6 relative overflow-hidden">
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
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full mb-5">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Document Analysis</h3>
                  <div className="space-y-4">
                    {(analysisResult?.document_analysis || []).map((doc, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
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
