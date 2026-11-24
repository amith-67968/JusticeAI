import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownWideNarrow,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  File,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SectionBackButton } from '../components/WorkspaceLayout';
import ProfileDropdown from '../components/ProfileDropdown';

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

const formatDate = (date) => {
  if (!date) {
    return '—';
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? '—'
    : parsedDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
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

const getEvidenceStrength = (document) => {
  const strength = document.strength || document.structured_data?.evidence_strength || '';
  return strength
    ? `${strength[0].toUpperCase()}${strength.slice(1).toLowerCase()}`
    : '';
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

  return 'Uploaded legal document.';
};

const getErrorMessage = (err, fallback) =>
  err instanceof Error ? err.message : fallback;

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [strengthFilter, setStrengthFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const previewRequestId = useRef(0);

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
          setDocs(Array.isArray(response.documents) ? response.documents : []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(getErrorMessage(err, 'Failed to load documents.'));
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
          strength: getEvidenceStrength(document),
          summary: buildSummary(document),
          size: formatBytes(document.file_size_bytes),
          sizeBytes: Number(document.file_size_bytes) || 0,
          date: document.created_at,
          record: document,
        };
      }),
    [docs]
  );

  const categories = useMemo(
    () => [...new Set(normalizedDocs.map((doc) => doc.caseType))].sort((a, b) => a.localeCompare(b)),
    [normalizedDocs]
  );

  const strengths = useMemo(
    () =>
      [...new Set(normalizedDocs.map((doc) => doc.strength).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [normalizedDocs]
  );

  const filteredDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = normalizedDocs.filter((doc) => {
      const matchesType = typeFilter === 'All' || doc.type === typeFilter;
      const matchesCategory = categoryFilter === 'All' || doc.caseType === categoryFilter;
      const matchesStrength = strengthFilter === 'All' || doc.strength === strengthFilter;
      const searchableText = [
        doc.name,
        doc.summary,
        doc.caseType,
        doc.typeLabel,
        doc.record.structured_data?.document_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        matchesType &&
        matchesCategory &&
        matchesStrength &&
        (!query || searchableText.includes(query))
      );
    });

    return matches.sort((a, b) => {
      if (sortOrder === 'oldest') {
        return (new Date(a.date || 0).getTime() || 0) - (new Date(b.date || 0).getTime() || 0);
      }
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'largest') {
        return b.sizeBytes - a.sizeBytes;
      }
      return (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0);
    });
  }, [normalizedDocs, searchQuery, typeFilter, categoryFilter, strengthFilter, sortOrder]);

  const totalBytes = useMemo(
    () => docs.reduce((total, document) => total + (Number(document.file_size_bytes) || 0), 0),
    [docs]
  );

  const ratedDocumentCount = useMemo(
    () => docs.filter((document) => getEvidenceStrength(document)).length,
    [docs]
  );

  const previewDocument = async (documentId) => {
    const document = normalizedDocs.find((item) => item.id === documentId);
    if (!document) {
      return;
    }

    const requestId = previewRequestId.current + 1;
    previewRequestId.current = requestId;
    setSelectedDocument(document);
    setPreviewUrl('');
    setPreviewLoading(true);
    setPreviewError('');

    try {
      const response = await api.getDocumentPreviewUrl(user, documentId);
      if (previewRequestId.current === requestId) {
        setPreviewUrl(response.preview_url);
      }
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to preview document.');
      if (previewRequestId.current === requestId) {
        setPreviewError(message);
        setError(message);
      }
    } finally {
      if (previewRequestId.current === requestId) {
        setPreviewLoading(false);
      }
    }
  };

  const downloadDocument = async (documentId) => {
    try {
      const response = await api.getDocumentDownloadUrl(user, documentId);
      window.open(response.download_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to download document.'));
    }
  };

  const closePreview = () => {
    previewRequestId.current += 1;
    setSelectedDocument(null);
    setPreviewUrl('');
    setPreviewLoading(false);
    setPreviewError('');
  };

  const handleDelete = async (documentId) => {
    setDeletingId(documentId);
    setError('');

    try {
      await api.deleteDocument(user, documentId);
      setDocs((currentDocs) => currentDocs.filter((doc) => doc.id !== documentId));
      if (selectedDocument?.id === documentId) {
        closePreview();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete document.'));
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setCategoryFilter('All');
    setStrengthFilter('All');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    typeFilter !== 'All' ||
    categoryFilter !== 'All' ||
    strengthFilter !== 'All';

  const exportCsv = () => {
    const columns = ['Filename', 'Category', 'File type', 'Upload date', 'File size', 'Evidence strength'];
    const rows = filteredDocs.map((doc) => [
      doc.name,
      doc.caseType,
      doc.typeLabel,
      doc.date || '',
      doc.size,
      doc.strength,
    ]);
    const csvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [columns, ...rows].map((row) => row.map(csvValue).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'justiceai-documents.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    if (!selectedDocument) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        previewRequestId.current += 1;
        setSelectedDocument(null);
        setPreviewUrl('');
        setPreviewLoading(false);
        setPreviewError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDocument]);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 text-[10px] sm:text-[11px]">
            <SectionBackButton />
            <span className="truncate font-semibold text-slate-700">Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <ProfileDropdown />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-10">
          <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-700/80">
                  Document management
                </p>
                <h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[28px]">
                  Documents
                  {!loading && (
                    <span className="ml-2 align-middle rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-semibold tracking-normal text-blue-700">
                      {docs.length} {docs.length === 1 ? 'file' : 'files'}
                    </span>
                  )}
                </h1>
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                  Review, organize, preview, and download the legal documents in your library.
                </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/analyzer')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_7px_18px_rgba(37,99,235,0.24)]"
            >
              <UploadCloud size={15} />
              Upload Document
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section aria-label="Document statistics" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Total documents',
                value: loading ? '—' : docs.length.toLocaleString(),
                caption: 'Files in your library',
                icon: FolderOpen,
                tone: 'bg-blue-50 text-blue-700',
              },
              {
                label: 'Evidence rated',
                value: loading ? '—' : ratedDocumentCount.toLocaleString(),
                caption: 'Documents with a recorded strength',
                icon: ShieldCheck,
                tone: 'bg-emerald-50 text-emerald-700',
              },
              {
                label: 'Storage used',
                value: loading ? '—' : formatBytes(totalBytes),
                caption: 'Combined size of stored files',
                icon: HardDrive,
                tone: 'bg-violet-50 text-violet-700',
              },
            ].map(({ label, value, caption, icon: Icon, tone }) => (
              <article
                key={label}
                className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.035)] sm:p-5"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{caption}</p>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                  {React.createElement(Icon, { size: 19 })}
                </span>
              </article>
            ))}
          </section>

          <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_12px_rgba(15,23,42,0.035)]">
            <button
              type="button"
              onClick={() => setIsUploadOpen((open) => !open)}
              aria-expanded={isUploadOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <UploadCloud size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-800">Add a document</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    Upload and analyze a legal file securely through Case Analyzer.
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-blue-700">
                <span className="hidden text-[10px] font-semibold sm:inline">Upload Document</span>
                {isUploadOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isUploadOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mb-4 flex flex-col gap-3 rounded-xl border border-dashed border-blue-200 bg-[linear-gradient(135deg,#f8fbff,#fafaff)] px-4 py-4 sm:mx-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-blue-600"><File size={17} /></span>
                      <div>
                        <p className="text-xs font-medium text-slate-700">Choose a file to begin a new analysis</p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                          Supports PDF, TXT, and images up to 20 MB. The Case Analyzer checks and processes the file.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/analyzer')}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                    >
                      <UploadCloud size={14} />
                      Go to Case Analyzer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section aria-label="Document library" className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 p-3.5 sm:p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Your documents</h2>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {loading
                      ? 'Loading your stored documents…'
                      : `Showing ${filteredDocs.length} of ${docs.length} ${docs.length === 1 ? 'document' : 'documents'}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={filteredDocs.length === 0 || loading}
                  className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                >
                  <Download size={13} />
                  Export CSV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(130px,auto))]">
                <label className="relative block">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    aria-label="Search documents"
                    placeholder="Search filename, case type…"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="relative">
                  <span className="sr-only">Filter by file type</span>
                  <Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pl-8 pr-8 text-[11px] text-slate-600 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="All">All file types</option>
                    <option value="PDF">PDF</option>
                    <option value="Image">Image</option>
                    <option value="Text">Text</option>
                  </select>
                </label>

                <label className="relative">
                  <span className="sr-only">Filter by category</span>
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-8 text-[11px] text-slate-600 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="All">All categories</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>

                <label className="relative">
                  <span className="sr-only">Filter by evidence strength</span>
                  <select
                    value={strengthFilter}
                    onChange={(event) => setStrengthFilter(event.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-8 text-[11px] text-slate-600 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="All">All evidence ratings</option>
                    {strengths.map((strength) => <option key={strength} value={strength}>{strength}</option>)}
                  </select>
                </label>

                <label className="relative sm:col-span-2 xl:col-span-1">
                  <span className="sr-only">Sort documents</span>
                  <ArrowDownWideNarrow size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pl-8 pr-8 text-[11px] text-slate-600 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name">Name A–Z</option>
                    <option value="largest">Largest file</option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                  <FileText size={21} />
                </span>
                <h3 className="text-sm font-semibold text-slate-800">Loading documents…</h3>
                <p className="mt-1 text-xs text-slate-500">Retrieving files linked to your account.</p>
              </div>
            ) : filteredDocs.length > 0 ? (
              <>
                <div className="max-h-[65vh] overflow-auto overscroll-contain">
                  <table className="w-full min-w-[850px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <th scope="col" className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">Document name</th>
                        <th scope="col" className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-3">Category</th>
                        <th scope="col" className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-3">Upload date</th>
                        <th scope="col" className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-3">File size</th>
                        <th scope="col" className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-3">Evidence strength</th>
                        <th scope="col" className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-4 py-3 text-right sm:px-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          onClick={() => previewDocument(doc.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              previewDocument(doc.id);
                            }
                          }}
                          tabIndex={0}
                          aria-label={`Preview ${doc.name}`}
                          className={`cursor-pointer transition-colors hover:bg-blue-50/40 focus-visible:bg-blue-50/50 focus-visible:outline-none ${
                            selectedDocument?.id === doc.id ? 'bg-blue-50/60' : 'bg-white'
                          }`}
                        >
                          <td className="max-w-[360px] px-4 py-3.5 sm:px-5">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                                <FileText size={15} />
                              </span>
                              <span className="min-w-0">
                                <span className="block break-words text-[11px] font-semibold leading-5 text-slate-800" title={doc.name}>
                                  {doc.name}
                                </span>
                                <span className="mt-0.5 block text-[9px] text-slate-400">{doc.typeLabel}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="inline-flex max-w-40 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-[9px] font-medium leading-4 text-blue-700">
                              <span className="truncate" title={doc.caseType}>{doc.caseType}</span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-[10px] text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={12} className="text-slate-400" />
                              {formatDate(doc.date)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-[10px] text-slate-500">{doc.size}</td>
                          <td className="px-3 py-3.5">
                            {doc.strength ? (
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
                                doc.strength === 'Strong'
                                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                  : doc.strength === 'Weak'
                                    ? 'border-rose-100 bg-rose-50 text-rose-700'
                                    : 'border-amber-100 bg-amber-50 text-amber-700'
                              }`}>
                                {doc.strength}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 sm:px-5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                aria-label={`Preview ${doc.name}`}
                                title="Preview"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  previewDocument(doc.id);
                                }}
                                className="grid h-8 w-8 place-items-center rounded-lg p-0 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Download ${doc.name}`}
                                title="Download"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  downloadDocument(doc.id);
                                }}
                                className="grid h-8 w-8 place-items-center rounded-lg p-0 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Download size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${doc.name}`}
                                title="Delete"
                                disabled={deletingId === doc.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDelete(doc.id);
                                }}
                                className="grid h-8 w-8 place-items-center rounded-lg p-0 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-wait"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <span>
                    Showing {filteredDocs.length} of {docs.length} documents
                  </span>
                  {(searchQuery || typeFilter !== 'All' || categoryFilter !== 'All' || strengthFilter !== 'All') && (
                    <button type="button" onClick={clearFilters} className="self-start font-semibold text-blue-700 hover:text-blue-800 sm:self-auto">
                      Clear filters
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <FolderOpen size={27} />
                </span>
                <h3 className="text-sm font-semibold text-slate-800">
                  {hasActiveFilters ? 'No matching documents' : 'No documents found'}
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
                  {hasActiveFilters
                    ? "We couldn't find documents matching your search or filters."
                    : "You don't have any uploaded legal files yet. Start with the Case Analyzer to add one."}
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/analyzer')}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-[10px] font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <UploadCloud size={14} />
                    Upload your first document
                  </button>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      <AnimatePresence>
        {selectedDocument && (
          <>
            <motion.button
              type="button"
              aria-label="Close document preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePreview}
              className="fixed inset-0 z-40 h-full w-full rounded-none bg-slate-950/30 p-0 backdrop-blur-[1px]"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="document-preview-title"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-blue-700">Document preview</p>
                  <h2 id="document-preview-title" className="mt-1 break-words text-sm font-semibold leading-5 text-slate-900">
                    {selectedDocument.name}
                  </h2>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {selectedDocument.caseType} <span className="mx-1 text-slate-300">·</span>
                    {selectedDocument.typeLabel} <span className="mx-1 text-slate-300">·</span>
                    {selectedDocument.size}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Close preview"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg p-0 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col bg-slate-50 p-3 sm:p-4">
                <div className="relative flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {previewLoading ? (
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
                      <p className="text-xs text-slate-500">Loading preview…</p>
                    </div>
                  ) : previewError ? (
                    <div className="max-w-xs px-5 text-center">
                      <FileText size={26} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-xs font-medium text-slate-700">Preview unavailable</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{previewError}</p>
                    </div>
                  ) : previewUrl && IMAGE_TYPES.has(selectedDocument.typeLabel.toLowerCase()) ? (
                    <img
                      src={previewUrl}
                      alt={selectedDocument.name}
                      className="max-h-full w-full object-contain"
                    />
                  ) : previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title={`Preview of ${selectedDocument.name}`}
                      className="h-full min-h-[50vh] w-full border-0"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <FileText size={26} className="mx-auto mb-2" />
                      <p className="text-xs">Preview not available.</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Document details</h3>
                    <span className="inline-flex items-center gap-1 text-[9px] text-slate-400">
                      <CalendarDays size={11} /> {formatDate(selectedDocument.date)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{selectedDocument.summary}</p>
                  {selectedDocument.strength && (
                    <p className="mt-2 text-[10px] text-slate-500">
                      Evidence strength: <span className="font-semibold text-slate-700">{selectedDocument.strength}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
                {previewUrl ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:text-blue-700"
                  >
                    <ExternalLink size={13} /> Open in new tab
                  </a>
                ) : <span />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadDocument(selectedDocument.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedDocument.id)}
                    disabled={deletingId === selectedDocument.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentsPage;
