'use client';

// This component must only render on the client side (Leaflet uses browser APIs).
// Import it via MapWrapper which uses next/dynamic with { ssr: false }.

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Gig } from '@/types';
import { isGigPast, formatGigDate, formatGigTime } from '@/lib/utils';

// ─── Custom colored pin marker ─────────────────────────────────────────────
function createColorPin(color: string, isPast: boolean): L.DivIcon {
  const displayColor = isPast ? '#9ca3af' : color;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 28px;
        height: 36px;
      ">
        <!-- Pin body -->
        <div style="
          width: 28px;
          height: 28px;
          background: ${displayColor};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        "></div>
        <!-- Inner white dot -->
        <div style="
          position: absolute;
          top: 7px;
          left: 7px;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          opacity: 0.9;
        "></div>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

// ─── Component that auto-fits map to all markers ───────────────────────────
function FitBoundsToMarkers({ gigs }: { gigs: Gig[] }) {
  const map = useMap();

  useEffect(() => {
    const validGigs = gigs.filter((g) => g.latitude != null && g.longitude != null);
    if (validGigs.length === 0) return;

    if (validGigs.length === 1) {
      map.setView([validGigs[0].latitude!, validGigs[0].longitude!], 12);
      return;
    }

    const bounds = L.latLngBounds(
      validGigs.map((g) => [g.latitude!, g.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [gigs, map]);

  return null;
}

// ─── Main MapView component ────────────────────────────────────────────────
interface MapViewProps {
  gigs: Gig[];
}

export default function MapView({ gigs }: MapViewProps) {
  const mappableGigs = useMemo(
    () => gigs.filter((g) => g.latitude != null && g.longitude != null),
    [gigs]
  );
  const unmappableGigs = useMemo(
    () => gigs.filter((g) => g.latitude == null || g.longitude == null),
    [gigs]
  );

  // Default center: Central Europe (fallback when no gigs)
  const defaultCenter: [number, number] = [50.0755, 14.4378]; // Prague

  return (
    <div className="flex flex-col gap-4">
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '520px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          // Prevent scroll wheel from zooming while scrolling the page
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto-fit to all markers on load / when gigs change */}
          <FitBoundsToMarkers gigs={mappableGigs} />

          {/* Markers */}
          {mappableGigs.map((gig) => {
            const past = isGigPast(gig.date, gig.time);
            return (
              <Marker
                key={gig.id}
                position={[gig.latitude!, gig.longitude!]}
                icon={createColorPin(gig.color, past)}
              >
                <Popup maxWidth={260}>
                  <div className="py-1">
                    {/* Color dot + name */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: past ? '#9ca3af' : gig.color }}
                      />
                      <strong className="text-gray-900 text-sm leading-tight">{gig.name}</strong>
                      {past && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Past</span>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <div>📅 {formatGigDate(gig.date)}</div>
                      <div>🕐 {formatGigTime(gig.time)}</div>
                      <div>📍 {gig.address}</div>
                      {gig.eventUrl && (
                        <div>
                          <a
                            href={gig.eventUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:underline"
                          >
                            Event page ↗
                          </a>
                        </div>
                      )}
                      {gig.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-gray-500 leading-relaxed">
                          {gig.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Color Legend */}
      {gigs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Legend
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {gigs.map((gig) => {
              const past = isGigPast(gig.date, gig.time);
              return (
                <div key={gig.id} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: past ? '#9ca3af' : gig.color }}
                  />
                  <span className={`text-sm ${past ? 'text-gray-400' : 'text-gray-700'}`}>
                    {gig.name}
                  </span>
                  {past && <span className="text-xs text-gray-400">(past)</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning for gigs that couldn't be geocoded */}
      {unmappableGigs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg">⚠</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {unmappableGigs.length} gig{unmappableGigs.length !== 1 ? 's' : ''} could not be shown on the map
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Geocoding failed for:{' '}
                {unmappableGigs.map((g) => g.name).join(', ')}.
                Try editing the gig with a more specific address.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {gigs.length === 0 && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-500 font-medium">No gigs to show on the map yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add your first gig to see it pinned here.</p>
        </div>
      )}
    </div>
  );
}
