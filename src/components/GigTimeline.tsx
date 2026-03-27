'use client';

import { useMemo, useState } from 'react';
import type { Gig, FilterType } from '@/types';
import { isGigPast, sortGigsChronologically } from '@/lib/utils';
import GigCard from './GigCard';

interface GigTimelineProps {
  gigs: Gig[];
  onEdit: (gig: Gig) => void;
  onDelete: (gig: Gig) => void;
}

export default function GigTimeline({ gigs, onEdit, onDelete }: GigTimelineProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const { upcoming, past } = useMemo(() => {
    const sorted = sortGigsChronologically(gigs);
    const query = search.toLowerCase().trim();
    const matches = (g: Gig) =>
      !query ||
      g.name.toLowerCase().includes(query) ||
      g.address.toLowerCase().includes(query) ||
      (g.notes ?? '').toLowerCase().includes(query);

    return {
      upcoming: sorted.filter((g) => !isGigPast(g.date, g.time) && matches(g)),
      past: sorted.filter((g) => isGigPast(g.date, g.time) && matches(g)).reverse(),
    };
  }, [gigs, search]);

  const showUpcoming = filter === 'all' || filter === 'upcoming';
  const showPast = filter === 'all' || filter === 'past';
  const totalVisible = (showUpcoming ? upcoming.length : 0) + (showPast ? past.length : 0);

  return (
    <div>
      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Hledat koncerty, místa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden shrink-0">
          {(['all', 'upcoming', 'past'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Vše' : f === 'upcoming' ? 'Nadcházející' : 'Minulé'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {totalVisible === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎸</div>
          {search ? (
            <>
              <p className="text-gray-600 font-medium">Žádné výsledky pro &ldquo;{search}&rdquo;</p>
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-sm text-pink-600 hover:underline"
              >
                Zrušit hledání
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 font-medium">Zatím žádné koncerty</p>
              <p className="text-sm text-gray-400 mt-1">Přidejte první koncert tlačítkem výše.</p>
            </>
          )}
        </div>
      )}

      {/* Upcoming */}
      {showUpcoming && upcoming.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Nadcházející</h2>
            <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          </div>
          <div className="space-y-3">
            {upcoming.map((gig) => (
              <GigCard key={gig.id} gig={gig} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {showPast && past.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Minulé koncerty</h2>
            <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
              {past.length}
            </span>
          </div>
          <div className="space-y-3">
            {past.map((gig) => (
              <GigCard key={gig.id} gig={gig} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
