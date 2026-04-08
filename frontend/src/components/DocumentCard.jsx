import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Trash2, Calendar, FileType2 } from 'lucide-react';

const DocumentCard = ({ doc, onDelete, onDownload, onPreview, isDeleting = false }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, borderColor: '#3b82f6' }}
      className="glass-panel p-5 flex flex-col justify-between transition-colors border-slate-200 hover:bg-slate-50 group shadow-sm bg-white"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-accent-primary/20 text-accent-primary flex items-center justify-center">
          <FileText size={24} />
        </div>
        <div className="flex items-center gap-2">
          {doc.strength && (
            <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
              {doc.strength}
            </div>
          )}
          <div className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-text-secondary">
            {doc.caseType}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 text-lg mb-1 truncate" title={doc.name}>
          {doc.name}
        </h3>
        <p className="text-sm text-text-tertiary line-clamp-2">
          {doc.summary || 'Uploaded document pending analysis or stored for evidence.'}
        </p>
      </div>

      <div className="mt-auto border-t border-slate-200 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(doc.date).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1.5">
            <FileType2 size={14} />
            {doc.typeLabel} • {doc.size}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            <button
              onClick={() => onPreview(doc.id)}
              className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onDownload(doc.id)}
              className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              <Download size={16} />
            </button>
          </div>
          <button 
            onClick={() => onDelete(doc.id)}
            disabled={isDeleting}
            className="p-2 rounded-lg bg-slate-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentCard;
