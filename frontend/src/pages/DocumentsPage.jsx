import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, PlusCircle, FolderOpen, ArrowLeft } from 'lucide-react';
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

  const previewDocument = async (documentId) => {
    try {
      const response = await api.getDocumentPreviewUrl(user, documentId);
      window.open(response.preview_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to preview document.');
    }
  };

  const downloadDocument = async (documentId) => {
    try {
      const response = await api.getDocumentDownloadUrl(user, documentId);
      window.open(response.download_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download document.');
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
    <div className="page-container flex min-h-dvh flex-col overflow-hidden bg-slate-50">
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-40 mb-6 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex w-full flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-0"
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-0 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md"
                  title="Go back"
                >
                  <ArrowLeft size={17} strokeWidth={2.4} />
                  <span>Back</span>
                </button>
                <div className="min-w-0">
                  <h1 className="text-[22px] font-semibold leading-tight text-slate-900 sm:text-2xl">
                    Documents
                  </h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Review uploaded case files, download them, or remove anything you no longer need.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:w-auto lg:grid-cols-[minmax(220px,260px)_auto_auto] lg:items-center"
            >
              <div className="relative sm:col-span-2 lg:col-span-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="text-text-tertiary" size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-text-primary transition-all hover:border-slate-400 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                />
              </div>

              <div className="relative shrink-0">
                <select
                  className="h-9 min-w-33 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-text-primary outline-none transition-all hover:bg-slate-50 hover:shadow-sm focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="PDF">PDFs</option>
                  <option value="Image">Images</option>
                  <option value="Text">Text files</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Filter className="text-text-tertiary" size={16} />
                </div>
              </div>

              <button
                onClick={() => navigate('/analyzer')}
                className="flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-accent-primary px-3.5 py-0 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 hover:shadow-md"
              >
                <PlusCircle size={16} /> Upload New
              </button>
            </motion.div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-(--max-w-app) flex-col px-4 pb-10 sm:px-6 lg:px-12">

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center sm:p-16"
            >
              <h3 className="mb-2 text-xl font-bold text-slate-900">Loading documents...</h3>
              <p className="max-w-sm text-text-secondary">
                Pulling the latest files linked to your current session.
              </p>
            </motion.div>
          ) : filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {filteredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onPreview={previewDocument}
                    onDownload={downloadDocument}
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
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center sm:p-16"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <FolderOpen size={40} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">No documents found</h3>
              <p className="mb-6 max-w-sm text-text-secondary">
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
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;
