'use client';

// This component must only render on the client side (Leaflet uses browser APIs).
// Import it via MapWrapper which uses next/dynamic with { ssr: false }.

import { useEffect, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

// ─── Component that auto-fits map to all markers on first load ─────────────
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

// ─── Spread overlapping markers so every pin is always visible ─────────────
//
// Algorithm:
//   1. Project every lat/lng to pixel space at the current zoom level.
//   2. Use union-find to group markers that are within THRESHOLD_PX pixels
//      of each other (transitive — A→B and B→C puts all three together).
//   3. For groups of size > 1, spread them in a circle around their centroid
//      with radius SPREAD_PX, then unproject back to lat/lng.
//   4. Re-run on every `zoomend` event so groups are always zoom-correct.
//
function computeSpreadPositions(gigs: Gig[], map: L.Map): Record<string, [number, number]> {
  const THRESHOLD_PX = 30; // pixels — markers closer than this are grouped

  const zoom = map.getZoom();

  // Spread radius scales with zoom: small when zoomed out, larger when zoomed in.
  // zoom 5 → ~8px   zoom 8 → ~12px   zoom 12 → ~18px   zoom 15 → 22px (cap)
  const SPREAD_PX = Math.round(Math.max(8, Math.min(22, zoom * 1.5)));

  // Project all gigs to pixel coordinates at this zoom
  const pixels: Record<string, L.Point> = {};
  gigs.forEach((g) => {
    pixels[g.id] = map.project(L.latLng(g.latitude!, g.longitude!), zoom);
  });

  // ── Union-Find ────────────────────────────────────────────────────────────
  const parent: Record<string, string> = {};
  gigs.forEach((g) => { parent[g.id] = g.id; });

  function find(id: string): string {
    while (parent[id] !== id) {
      parent[id] = parent[parent[id]]; // path compression
      id = parent[id];
    }
    return id;
  }

  for (let i = 0; i < gigs.length; i++) {
    for (let j = i + 1; j < gigs.length; j++) {
      const dist = pixels[gigs[i].id].distanceTo(pixels[gigs[j].id]);
      if (dist < THRESHOLD_PX) {
        parent[find(gigs[i].id)] = find(gigs[j].id);
      }
    }
  }

  // Build groups keyed by their root
  const groups: Record<string, string[]> = {};
  gigs.forEach((g) => {
    const root = find(g.id);
    if (!groups[root]) groups[root] = [];
    groups[root].push(g.id);
  });

  // ── Compute final lat/lng positions ───────────────────────────────────────
  const result: Record<string, [number, number]> = {};

  Object.values(groups).forEach((group) => {
    if (group.length === 1) {
      const g = gigs.find((x) => x.id === group[0])!;
      result[g.id] = [g.latitude!, g.longitude!];
      return;
    }

    // Centroid of the group in pixel space
    const cx = group.reduce((s, id) => s + pixels[id].x, 0) / group.length;
    const cy = group.reduce((s, id) => s + pixels[id].y, 0) / group.length;

    // Arrange markers evenly around the centroid
    group.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
      const spreadPx = L.point(
        cx + SPREAD_PX * Math.cos(angle),
        cy + SPREAD_PX * Math.sin(angle),
      );
      const ll = map.unproject(spreadPx, zoom);
      result[id] = [ll.lat, ll.lng];
    });
  });

  return result;
}

// ─── Popup content — rendered inside each marker's popup ───────────────────
// Must be a child of MapContainer so it can call useMap().
function PopupContent({ gig, past }: { gig: Gig; past: boolean }) {
  const map = useMap();
  return (
    <div style={{ position: 'relative', width: 270, padding: '20px 20px 16px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
      {/* Custom close button — sits inside the white box, top-right corner */}
      <button
        onClick={() => map.closePopup()}
        aria-label="Zavřít"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: '#f3f4f6',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: '26px',
          textAlign: 'center',
          color: '#6b7280',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>

      {/* Color dot + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingRight: 28 }}>
        <span
          style={{
            width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
            backgroundColor: past ? '#9ca3af' : gig.color,
          }}
        />
        <strong style={{ fontSize: 14, color: '#111827', lineHeight: 1.3 }}>{gig.name}</strong>
        {past && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 99,
            background: '#f3f4f6', color: '#6b7280', flexShrink: 0,
          }}>
            Minulý
          </span>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#4b5563', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div>📅 {formatGigDate(gig.date)}</div>
        <div>🕐 {formatGigTime(gig.time)}</div>
        <div>📍 {gig.address}</div>
        {gig.eventUrl && (
          <div>
            <a
              href={gig.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ec4899', textDecoration: 'none' }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Stránka akce ↗
            </a>
          </div>
        )}
        {gig.notes && (
          <div style={{
            marginTop: 6, paddingTop: 6,
            borderTop: '1px solid #f3f4f6',
            color: '#6b7280', lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}>
            {gig.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Markers layer — renders pins and recomputes spread on zoom ─────────────
function MarkersLayer({ gigs }: { gigs: Gig[] }) {
  const map = useMap();
  const [positions, setPositions] = useState<Record<string, [number, number]>>({});

  const refresh = useCallback(() => {
    if (gigs.length === 0) return;
    setPositions(computeSpreadPositions(gigs, map));
  }, [gigs, map]);

  // Compute on mount and whenever gigs list changes
  useEffect(() => { refresh(); }, [refresh]);

  // Recompute after each zoom animation completes
  useMapEvents({ zoomend: refresh });

  return (
    <>
      {gigs.map((gig) => {
        const past = isGigPast(gig.date, gig.time);
        const pos = positions[gig.id] ?? [gig.latitude!, gig.longitude!];

        return (
          <Marker
            key={gig.id}
            position={pos}
            icon={createColorPin(gig.color, past)}
          >
            {/* closeButton=false: we render our own inside PopupContent */}
            <Popup maxWidth={340} closeButton={false}>
              <PopupContent gig={gig} past={past} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// ─── Main MapView component ────────────────────────────────────────────────
interface MapViewProps {
  gigs: Gig[];
}

export default function MapView({ gigs }: MapViewProps) {
  const mappableGigs = gigs.filter((g) => g.latitude != null && g.longitude != null);
  const unmappableGigs = gigs.filter((g) => g.latitude == null || g.longitude == null);

  // Default center: Prague (fallback when no gigs)
  const defaultCenter: [number, number] = [50.0755, 14.4378];

  return (
    <div className="flex flex-col gap-4">
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '520px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fit viewport to all markers on initial load */}
          <FitBoundsToMarkers gigs={mappableGigs} />

          {/* Spread-aware marker layer — recalculates on every zoom change */}
          <MarkersLayer gigs={mappableGigs} />
        </MapContainer>
      </div>

      {/* Color Legend */}
      {gigs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Legenda
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
                  {past && <span className="text-xs text-gray-400">(minulý)</span>}
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
                {unmappableGigs.length} {unmappableGigs.length === 1 ? 'koncert nemohl být' : 'koncerty nemohly být'} zobrazeny na mapě
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Geokódování selhalo pro:{' '}
                {unmappableGigs.map((g) => g.name).join(', ')}.
                Zkuste upravit adresu na přesnější.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {gigs.length === 0 && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-500 font-medium">Zatím žádné koncerty na mapě.</p>
          <p className="text-sm text-gray-400 mt-1">Přidejte první koncert a uvidíte ho zde.</p>
        </div>
      )}
    </div>
  );
}
