import { format, parseISO } from 'date-fns';
import type { Gig } from '@/types';

/**
 * A gig is "past" when its date + time is earlier than right now.
 */
export function isGigPast(date: string, time: string): boolean {
  const gigDateTime = new Date(`${date}T${time}:00`);
  return gigDateTime < new Date();
}

/**
 * Format "2026-05-10" → "10/05/2026"
 */
export function formatGigDate(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy');
  } catch {
    return date;
  }
}

/**
 * Format "20:30" → "20:30" (24h display)
 */
export function formatGigTime(time: string): string {
  // Already stored as HH:MM — return as-is
  return time;
}

/**
 * Sort gigs chronologically, earliest first.
 */
export function sortGigsChronologically(gigs: Gig[]): Gig[] {
  return [...gigs].sort((a, b) => {
    const aTime = new Date(`${a.date}T${a.time}:00`).getTime();
    const bTime = new Date(`${b.date}T${b.time}:00`).getTime();
    return aTime - bTime;
  });
}

/**
 * Validate a URL string — returns true if it looks like a valid URL.
 */
export function isValidUrl(url: string): boolean {
  if (!url.trim()) return true; // empty is valid (optional field)
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalise a URL — add https:// if missing.
 */
export function normaliseUrl(url: string): string {
  if (!url.trim()) return '';
  return url.startsWith('http') ? url : `https://${url}`;
}

/**
 * Validate YYYY-MM-DD format.
 */
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
}

/**
 * Validate HH:MM format.
 */
export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
