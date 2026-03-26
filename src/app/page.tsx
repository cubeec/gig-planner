'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Gig, GigFormData } from '@/types';
import { sortGigsChronologically } from '@/lib/utils';
import GigTimeline from '@/components/GigTimeline';
import MapWrapper from '@/components/MapWrapper';
import GigForm from '@/components/GigForm';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

type Tab = 'timeline' | 'map';

export default function HomePage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [deletingGig, setDeletingGig] = useState<Gig | null>(null);

  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active tab
  const [tab, setTab] = useState<Tab>('timeline');

  // ─── Fetch all gigs ───────────────────────────────────────────────────────
  const fetchGigs = useCallback(async () => {
    try {
      setError('');
      const res = await fetch('/api/gigs');
      if (!res.ok) throw new Error('Failed to load gigs');
      const data: Gig[] = await res.json();
      setGigs(sortGigsChronologically(data));
    } catch {
      setError('Could not load gigs. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  // ─── Add or update gig ────────────────────────────────────────────────────
  const handleFormSubmit = async (data: GigFormData) => {
    setIsSubmitting(true);
    try {
      const isEdit = !!editingGig;
      const url = isEdit ? `/api/gigs/${editingGig!.id}` : '/api/gigs';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        // Surface the first server-side validation error
        const firstError = body.errors
          ? Object.values(body.errors)[0]
          : body.error ?? 'Failed to save gig';
        throw new Error(firstError as string);
      }

      // Refresh the gig list
      await fetchGigs();
      setShowForm(false);
      setEditingGig(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete gig ───────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deletingGig) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gigs/${deletingGig.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchGigs();
      setDeletingGig(null);
    } catch {
      alert('Could not delete the gig. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Edit (open form prepopulated) ────────────────────────────────────────
  const handleEdit = (gig: Gig) => {
    setEditingGig(gig);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingGig(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGig(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-black sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none" role="img" aria-label="guitar">🎸</span>
            <div>
              <h1 className="text-xl font-extrabold text-white leading-none">Divná Bára</h1>
              <p className="text-xs text-pink-400 font-medium mt-0.5">Gig Planner</p>
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white text-sm font-semibold rounded-lg hover:bg-pink-600 active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Gig</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setTab('timeline')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'timeline'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Timeline
          </button>
          <button
            onClick={() => setTab('map')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'map'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'timeline' && (
              <GigTimeline
                gigs={gigs}
                onEdit={handleEdit}
                onDelete={setDeletingGig}
              />
            )}
            {tab === 'map' && (
              <MapWrapper gigs={gigs} />
            )}
          </>
        )}
      </main>

      {/* ── Gig Form Modal ── */}
      {showForm && (
        <GigForm
          gig={editingGig}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deletingGig && (
        <DeleteConfirmModal
          gig={deletingGig}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingGig(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
