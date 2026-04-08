import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Filter, Search, PlusCircle, FolderOpen, LogOut, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DocumentCard from '../components/DocumentCard';

const Documents = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState([
    { id: 1, name: 'Smith_vs_Jones_Initial_Complaint.pdf', type: 'PDF', summary: 'Initial filing outlining breach of contract claims.', size: '2.4 MB', date: '2023-10-15' },
    { id: 2, name: 'Exhibit_A_Email_Chain.pdf', type: 'PDF', summary: 'Email correspondence showing late delivery acknowledgment.', size: '1.1 MB', date: '2023-10-18' },
    { id: 3, name: 'Warehouse_Receipt_Scan.jpg', type: 'Image', summary: 'Photo of the shipping manifest with timestamps.', size: '4.8 MB', date: '2023-10-20' },
    { id: 4, name: 'Draft_Motion_to_Dismiss.txt', type: 'Text', summary: 'Generated draft motion to dismiss based on statute of limitations.', size: '45 KB', date: '2023-11-02' }
  ]);

  const handleDelete = (id) => {
    setDocs(docs.filter(doc => doc.id !== id));
  };

  const filteredDocs = docs.filter(doc => {
    const matchesFilter = filter === 'All' || doc.type === filter;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container flex flex-col h-screen overflow-y-auto">
      {/* Minimal App Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        {/* Left: Logo + Name */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg text-lg flex items-center justify-center border border-blue-200 shadow-sm">
            ⚖️
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            JusticeAI
          </h1>
        </div>

        {/* Right: User Section */}
        <div className="flex items-center gap-3">
          {/* Profile */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-full flex items-center justify-center">
              <User size={16} />
            </span>
            <span className="text-sm font-medium text-gray-900">Profile</span>
          </button>

          {/* Logout */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition text-red-600">
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
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
              onClick={() => navigate(-1)}
              className="mb-4 p-2.5 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900 flex items-center justify-center"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Documents</h1>
            <p className="text-lg text-text-secondary">
              Manage your case files, evidence, and generated drafts.
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

            <button className="btn-primary flex items-center gap-2 py-2.5">
              <PlusCircle size={18} /> Upload New
            </button>
          </motion.div>
        </div>

        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
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
                : "You don't have any case files uploaded yet."}
            </p>
            {(searchQuery || filter !== 'All') && (
              <button 
                className="btn-secondary"
                onClick={() => { setSearchQuery(''); setFilter('All'); }}
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Documents;
