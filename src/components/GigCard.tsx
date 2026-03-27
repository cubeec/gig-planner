'use client';

import type { Gig } from '@/types';
import { isGigPast, formatGigDate, formatGigTime } from '@/lib/utils';

interface GigCardProps {
  gig: Gig;
  onEdit: (gig: Gig) => void;
  onDelete: (gig: Gig) => void;
}

export default function GigCard({ gig, onEdit, onDelete }: GigCardProps) {
  const past = isGigPast(gig.date, gig.time);

  return (
    <div
      className={`relative rounded-xl border transition-all ${
        past
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
      }`}
    >
      {/* Color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: past ? '#9ca3af' : gig.color }}
      />

      <div className="pl-5 pr-4 py-4">
        {/* Header: name + buttons */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="shrink-0 w-3 h-3 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: past ? '#9ca3af' : gig.color }}
            />
            <h3 className={`font-bold text-base leading-tight truncate ${past ? 'text-gray-500' : 'text-gray-900'}`}>
              {gig.name}
            </h3>
            {past && (
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">
                Minulý
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!past && (
              <button
                onClick={() => onEdit(gig)}
                className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                title="Upravit koncert"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onDelete(gig)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Smazat koncert"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className={`mt-2.5 space-y-1.5 text-sm ${past ? 'text-gray-400' : 'text-gray-600'}`}>
          {/* Date + Time */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatGigDate(gig.date)}</span>
            <span className="text-gray-300">·</span>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{formatGigTime(gig.time)}</span>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{gig.address}</span>
            {!gig.latitude && (
              <span className="shrink-0 text-xs text-amber-500" title="Could not geocode this address">
                ⚠ Není na mapě
              </span>
            )}
          </div>

          {/* Event URL */}
          {gig.eventUrl && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <a
                href={gig.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`truncate hover:underline ${past ? 'text-gray-400' : 'text-pink-600 hover:text-pink-800'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {gig.eventUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {/* Notes */}
          {gig.notes && (
            <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-gray-100">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs leading-relaxed whitespace-pre-line">{gig.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
