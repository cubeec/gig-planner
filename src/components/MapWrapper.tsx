'use client';

// Wraps MapView with next/dynamic to disable SSR (Leaflet is browser-only).
// Use this component everywhere in the app, not MapView directly.

import dynamic from 'next/dynamic';
import type { Gig } from '@/types';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center"
      style={{ height: '520px' }}>
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    </div>
  ),
});

export default function MapWrapper({ gigs }: { gigs: Gig[] }) {
  return <MapView gigs={gigs} />;
}
