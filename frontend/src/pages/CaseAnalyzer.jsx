export { default } from './CaseAnalyzerPage';

/*
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle, ShieldCheck, BarChart, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CaseAnalyzer = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
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
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    // Simulate API Delay
    setTimeout(() => {
      setResults({
        strength: 'Moderate',
        complexity: 'Medium',
        insights: [
          'Strong evidence available in recent documentation',
          'Missing supporting documents regarding initial contract',
          'Important legal notes: Consider pursuing mediation'
        ]
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const resetAnalyzer = () => {
    setFile(null);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col pt-6">
      {/* Header Section */}
      <div className="px-6 mb-6">
        <div className="text-sm text-gray-500 mb-4 font-medium tracking-wide">
          Dashboard / Case Analyzer
        </div>
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

      {/* Main Content Area */}
      <div className="flex justify-center mt-10 px-4 w-full">
        <AnimatePresence mode="wait">
          {!results && !isAnalyzing ? (
          <motion.div 
            key="upload-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center"
          >
            {/* Upload Box / File Preview */}
            {!file ? (
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                }`}
              >
                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-4">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Click or drag file to this area to upload</h3>
                <p className="text-sm text-gray-500 mt-1">Supports PDF, DOCX, Images (max 50MB)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.docx,image/*"
                />
              </div>
            ) : (
              <div className="w-full border-2 border-gray-100 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50/30">
                <div className="bg-green-100 text-green-600 rounded-full p-4 mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-xl text-gray-800 font-medium mb-1 truncate max-w-sm">{file.name}</h3>
                <div className="flex items-center gap-1.5 text-green-500 text-sm font-medium">
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

            {/* Action Button */}
            <motion.button 
              whileHover={file ? { scale: 1.02 } : {}}
              whileTap={file ? { scale: 0.98 } : {}}
              onClick={handleAnalyze}
              disabled={!file}
              className={`mt-6 w-full py-3 rounded-xl font-medium transition-all shadow-md ${
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
            <p className="text-gray-500">Evaluating complexity and extracting core insights</p>
          </motion.div>
        ) : (
          <motion.div 
            key="results-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl flex flex-col items-center"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Complete</h2>
              <p className="text-gray-500">Evaluation for <span className="font-medium text-gray-700">{file?.name}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-6 relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 border border-green-100">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Case Strength</h3>
                <div className="text-3xl font-black text-green-600">{results.strength}</div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-100">
                  <BarChart size={28} />
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Case Complexity</h3>
                <div className="text-3xl font-black text-gray-800">{results.complexity}</div>
              </div>
            </div>

            <div className="bg-white w-full p-8 rounded-2xl shadow-lg mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileSearch size={24} className="text-blue-500" /> Key Insights
              </h3>
              <ul className="space-y-4">
                {results.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0 shadow-sm" />
                    <span className="text-gray-700 font-medium">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={resetAnalyzer}
              className="text-gray-500 font-semibold hover:text-gray-900 transition-colors uppercase text-sm tracking-wide"
            >
              Analyze Another Document
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default CaseAnalyzer;
*/
