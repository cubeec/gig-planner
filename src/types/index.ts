export interface Gig {
  id: string;
  name: string;
  address: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM (24h)
  eventUrl: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  color: string;     // hex color e.g. "#E63946"
  createdAt: string;
  updatedAt: string;
}

export interface GigFormData {
  name: string;
  address: string;
  date: string;
  time: string;
  eventUrl?: string;
  notes?: string;
  // Pre-geocoded coords from the autocomplete selection; skips server-side geocoding
  latitude?: number;
  longitude?: number;
}

export type FilterType = 'all' | 'upcoming' | 'past';
