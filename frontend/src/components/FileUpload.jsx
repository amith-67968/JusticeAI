import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

const FileUpload = ({ onUpload, isLoading }) => {
  const [isDragged, setIsDragged] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragged(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragged(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragged(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${
          isDragged ? 'border-accent-primary bg-accent-primary/10' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-4">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">
          {isDragged ? 'Drop your file here' : 'Select a file or drag and drop'}
        </h3>
        <p className="text-text-tertiary mb-6 text-sm text-center max-w-sm">
          Images (JPG, PNG), Texts (TXT), or PDFs up to 50MB. Make sure the document is highly legible for the best AI analysis.
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleChange}
          accept="image/*,application/pdf,.txt"
        />
        
        <button 
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          Browse Files
        </button>
      </div>

      {file && (
        <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 text-accent-primary flex items-center justify-center shrink-0">
              <File size={20} />
            </div>
            <div className="truncate">
              <p className="text-slate-900 text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            className="btn-primary"
            onClick={() => onUpload(file)}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner size={16} /> Analyzing...
              </div>
            ) : 'Analyze Document'}
          </button>
        </div>
      )}
    </div>
  );
};

const Spinner = ({ size = 24 }) => (
  <svg 
    className="animate-spin text-white" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
    style={{ width: size, height: size }}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default FileUpload;
