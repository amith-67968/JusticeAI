import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, PlusCircle, FolderOpen, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DocumentCard from '../components/DocumentCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const IMAGE_TYPES = new Set(['png', 'jpg', 'jpeg', 'bmp', 'webp', 'tif', 'tiff']);

const formatBytes = (bytes = 0) => {
  if (!bytes) {
    return '0 KB';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let nextValue = bytes;
  let unitIndex = 0;

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 1;
  return `${nextValue.toFixed(precision)} ${units[unitIndex]}`;
};

const getDocumentType = (document) => {
  const type = (document.file_type || '').toLowerCase();

  if (type === 'txt') {
    return 'Text';
  }

  if (IMAGE_TYPES.has(type)) {
    return 'Image';
  }

  return 'PDF';
};

const buildSummary = (document) => {
  const reason = document.structured_data?.reason;
  const documentType = document.structured_data?.document_type;

  if (reason && documentType) {
    return `${documentType}: ${reason}`;
  }

  if (reason) {
    return reason;
  }

  if (document.case_type) {
    return `${document.case_type} document stored and ready for review.`;
  }

  return 'Uploaded document pending analysis or stored for evidence.';
};

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadDocuments = async () => {
      if (!user) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.listDocuments(user);
        if (!isCancelled) {
          setDocs(response.documents || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load documents.');
          setDocs([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadDocuments();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const normalizedDocs = useMemo(
    () =>
      docs.map((document) => {
        const docType = getDocumentType(document);

        return {
          id: document.id,
          name: document.filename,
          type: docType,
          typeLabel: (document.file_type || docType).toUpperCase(),
          caseType: document.case_type || 'Legal Document',
          strength: document.strength
            ? `${document.strength[0].toUpperCase()}${document.strength.slice(1)}`
            : '',
          summary: buildSummary(document),
          size: formatBytes(document.file_size_bytes),
          date: document.created_at,
        };
      }),
    [docs]
  );

  const filteredDocs = normalizedDocs.filter((doc) => {
    const matchesFilter = filter === 'All' || doc.type === filter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      doc.name.toLowerCase().includes(query) ||
      doc.summary.toLowerCase().includes(query) ||
      doc.caseType.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const openDocument = async (documentId) => {
    try {
      const response = await api.getDocumentDownloadUrl(user, documentId);
      window.open(response.download_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open document.');
    }
  };

  const handleDelete = async (documentId) => {
    setDeletingId(documentId);
    setError('');

    try {
      await api.deleteDocument(user, documentId);
      setDocs((currentDocs) => currentDocs.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container flex flex-col h-screen overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg text-sm flex items-center justify-center border border-blue-200 shadow-sm font-semibold">
            AI
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            JusticeAI
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-full flex items-center justify-center">
              <User size={16} />
            </span>
            <span className="text-sm font-medium text-gray-900">{user?.name || 'Profile'}</span>
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-[var(--max-w-app)] mx-auto px-6 lg:px-12 py-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="mb-4 p-2.5 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900 flex items-center justify-center"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Documents</h1>
            <p className="text-lg text-text-secondary">
              Review uploaded case files, download them, or remove anything you no longer need.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-text-tertiary" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-64 py-2.5"
              />
            </div>

            <div className="relative">
              <select
                className="w-full md:w-auto px-4 py-3 border border-slate-300 bg-white text-text-primary text-[0.95rem] rounded-xl outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary appearance-none pr-10 cursor-pointer"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="PDF">PDFs</option>
                <option value="Image">Images</option>
                <option value="Text">Text files</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="text-text-tertiary" size={16} />
              </div>
            </div>

            <button
              onClick={() => navigate('/analyzer')}
              className="btn-primary flex items-center gap-2 py-2.5"
            >
              <PlusCircle size={18} /> Upload New
            </button>
          </motion.div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2">Loading documents...</h3>
            <p className="text-text-secondary max-w-sm">
              Pulling the latest files linked to your current session.
            </p>
          </motion.div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onPreview={openDocument}
                  onDownload={openDocument}
                  onDelete={handleDelete}
                  isDeleting={deletingId === doc.id}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50"
          >
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-6 text-slate-500">
              <FolderOpen size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No documents found</h3>
            <p className="text-text-secondary max-w-sm mb-6">
              {searchQuery || filter !== 'All'
                ? "We couldn't find any documents matching your search criteria."
                : "You don't have any uploaded legal files yet. Start with the Case Analyzer to add one."}
            </p>
            {searchQuery || filter !== 'All' ? (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('All');
                }}
              >
                Clear Filters
              </button>
            ) : (
              <button className="btn-primary" onClick={() => navigate('/analyzer')}>
                Upload Your First Document
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default DocumentsPage;
