export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

/**
 * Geocode a street address using Nominatim (OpenStreetMap).
 * Free to use, no API key required. Rate-limited to ~1 req/sec.
 * Returns null if the address cannot be geocoded.
 */
export async function geocodeAddress(address: string): Promise<GeocodedLocation | null> {
  if (!address.trim()) return null;

  try {
    const encoded = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent identifying the app
        'User-Agent': 'DivnaBara-GigPlanner/1.0 (contact@divnabara.cz)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error('[geocode] HTTP error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[geocode] No results for:', address);
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('[geocode] Error:', error);
    return null;
  }
}
