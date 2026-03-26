'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import type { Gig, GigFormData } from '@/types';

interface GigFormProps {
  gig?: Gig | null;
  onSubmit: (data: GigFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface FormErrors {
  name?: string;
  address?: string;
  date?: string;
  time?: string;
  eventUrl?: string;
}

// Nominatim address detail object
interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  postcode?: string;
}

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
}

// Format a Nominatim address into: "Street Number, City, Postcode"
function formatNominatimAddress(a: NominatimAddress, fallback: string): string {
  const street = a.road ?? a.pedestrian ?? a.footway ?? a.path;
  const city = a.city ?? a.town ?? a.village ?? a.municipality;
  const parts: string[] = [];
  if (street) parts.push(a.house_number ? `${street} ${a.house_number}` : street);
  if (city) parts.push(city);
  if (a.postcode) parts.push(a.postcode);
  return parts.length > 0 ? parts.join(', ') : fallback;
}

// Split "HH:MM" into [hours, minutes] strings
function splitTime(t: string): [string, string] {
  const [h = '00', m = '00'] = t.split(':');
  return [h.padStart(2, '0'), m.padStart(2, '0')];
}

export default function GigForm({ gig, onSubmit, onCancel, isSubmitting }: GigFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('00:00');
  const [eventUrl, setEventUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Populate when editing
  useEffect(() => {
    if (gig) {
      setName(gig.name);
      setAddress(gig.address);
      setDate(gig.date);
      setTime(gig.time);
      setEventUrl(gig.eventUrl ?? '');
      setNotes(gig.notes ?? '');
      if (gig.latitude != null && gig.longitude != null) {
        setSelectedCoords({ lat: gig.latitude, lng: gig.longitude });
      }
    }
  }, [gig]);

  // Close suggestions on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // ── 24-hour time helpers ──────────────────────────────────────────────────
  const [hours, minutes] = splitTime(time);

  function setHours(val: string) {
    const h = Math.max(0, Math.min(23, parseInt(val, 10) || 0));
    setTime(`${String(h).padStart(2, '0')}:${minutes}`);
  }
  function setMinutes(val: string) {
    const m = Math.max(0, Math.min(59, parseInt(val, 10) || 0));
    setTime(`${hours}:${String(m).padStart(2, '0')}`);
  }

  // ── Address autocomplete ──────────────────────────────────────────────────
  function handleAddressChange(value: string) {
    setAddress(value);
    setSelectedCoords(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const encoded = encodeURIComponent(value.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=6`,
          { headers: { 'User-Agent': 'DivnaBara-GigPlanner/1.0', 'Accept-Language': 'en' } }
        );
        if (!res.ok) throw new Error();
        const data: AddressSuggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }

  function handleSelectSuggestion(s: AddressSuggestion) {
    const formatted = formatNominatimAddress(s.address, s.display_name);
    setAddress(formatted);
    setSelectedCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setSuggestions([]);
    setShowSuggestions(false);
    setErrors((prev) => ({ ...prev, address: undefined }));
  }

  // ── Validation ───────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Event name is required';
    if (!address.trim()) errs.address = 'Address / venue is required';
    if (!date) errs.date = 'Date is required';
    if (!time) errs.time = 'Performance time is required';
    if (eventUrl.trim()) {
      try { new URL(eventUrl.startsWith('http') ? eventUrl : `https://${eventUrl}`); }
      catch { errs.eventUrl = 'Please enter a valid URL'; }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    try {
      await onSubmit({
        name, address, date, time,
        eventUrl: eventUrl.trim(),
        notes,
        ...(selectedCoords ? { latitude: selectedCoords.lat, longitude: selectedCoords.lng } : {}),
      });
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const isEdit = !!gig;
  const inputCls = (err?: string) =>
    `w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
      err ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Gig' : 'Add New Gig'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Event Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rock Café Praha"
              className={inputCls(errors.name)}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Address with autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Address / Venue <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="e.g. Národní třída 20, Praha 1"
                autoComplete="off"
                className={inputCls(errors.address) + ' pr-10'}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!isSearching && selectedCoords && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {suggestions.map((s) => (
                  <li key={s.place_id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-800 border-b border-gray-100 last:border-0 transition-colors flex items-start gap-2"
                    >
                      <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="leading-snug">{formatNominatimAddress(s.address, s.display_name)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
            <p className="mt-1 text-xs text-gray-400">
              {selectedCoords ? '✓ Location pinpointed' : 'Type at least 3 characters to search'}
            </p>
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls(errors.date)}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Time (24h) <span className="text-red-500">*</span>
              </label>
              {/* Custom 24h time picker — avoids browser AM/PM locale issues */}
              <div className={`flex items-center border rounded-lg px-3 py-2.5 gap-1 transition-colors focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-transparent ${
                errors.time ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={parseInt(hours, 10)}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-10 text-center text-sm bg-transparent border-none outline-none appearance-none"
                  aria-label="Hours"
                />
                <span className="text-gray-400 font-semibold select-none">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={parseInt(minutes, 10)}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-10 text-center text-sm bg-transparent border-none outline-none appearance-none"
                  aria-label="Minutes"
                />
              </div>
              {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
            </div>
          </div>

          {/* Event URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Event URL <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="url"
              value={eventUrl}
              onChange={(e) => setEventUrl(e.target.value)}
              placeholder="https://festival.cz/tickets"
              className={inputCls(errors.eventUrl)}
            />
            {errors.eventUrl && <p className="mt-1 text-xs text-red-600">{errors.eventUrl}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Load-in time, set length, backline details…"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? (isEdit ? 'Saving…' : 'Adding…')
                : (isEdit ? 'Save Changes' : 'Add Gig')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
