import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Phone, ExternalLink, Users, Loader2 } from 'lucide-react';

/* Inline LinkedIn logo — lucide-react doesn't ship one */
const LinkedInIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

/**
 * LawyerCards — renders recommended lawyers + LinkedIn search button.
 *
 * Props:
 *   lawyers       — array of { name, rating, address, distance, maps_url, phone }
 *   linkedinUrl   — pre-built LinkedIn people-search URL
 *   caseTypes     — array of detected case type strings
 *   isLoading     — show loading spinner instead of content
 */
const LawyerCards = ({ lawyers = [], linkedinUrl = '', caseTypes = [], isLoading = false }) => {

  /* ── Loading State ──────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
        <Loader2 size={16} className="animate-spin text-amber-500" />
        <span className="text-xs text-slate-500">Finding lawyers near you…</span>
      </div>
    );
  }

  /* ── Nothing to render ──────────────────────────────────────────────── */
  if (!lawyers.length && !linkedinUrl) return null;

  return (
    <div className="space-y-3 md:col-span-2">

      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
        <Users size={14} />
        Recommended Lawyers Near You
      </div>

      {/* ── Case Types Chips ────────────────────────────────────────── */}
      {caseTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {caseTypes.map((ct, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200"
            >
              {ct.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* ── Lawyer Cards ────────────────────────────────────────────── */}
      {lawyers.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {lawyers.map((lawyer, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Name */}
              <p className="text-xs font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">
                {lawyer.name}
              </p>

              {/* Rating */}
              {lawyer.rating > 0 && (
                <div className="flex items-center gap-1 mb-1">
                  <Star size={11} className="text-yellow-500 fill-yellow-400" />
                  <span className="text-[11px] text-slate-600 font-medium">{lawyer.rating}</span>
                </div>
              )}

              {/* Address / Distance */}
              {(lawyer.address || lawyer.distance) && (
                <div className="flex items-start gap-1.5 mb-2">
                  <MapPin size={11} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                    {lawyer.distance && <strong className="text-slate-700">{lawyer.distance} · </strong>}
                    {lawyer.address}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto flex flex-wrap items-center gap-2">
                {lawyer.maps_url && (
                  <a
                    href={lawyer.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink size={10} />
                    View on Maps
                  </a>
                )}
                {lawyer.phone && (
                  <a
                    href={`tel:${lawyer.phone}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <Phone size={10} />
                    Call
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          No lawyers found nearby. Try enabling location access or check LinkedIn below.
        </p>
      )}

      {/* ── LinkedIn CTA ────────────────────────────────────────────── */}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A66C2] px-4 py-2 text-center text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#004182] sm:w-auto"
        >
          <LinkedInIcon size={14} />
          Find more lawyers on LinkedIn
        </a>
      )}
    </div>
  );
};

export default LawyerCards;
