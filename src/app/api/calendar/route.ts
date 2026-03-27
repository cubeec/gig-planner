// GET /api/calendar  →  iCal feed (text/calendar)
//
// Subscribe to this URL in any calendar app:
//   Google Calendar  → Settings → "Add calendar" → "From URL"
//   Apple Calendar   → File → "New Calendar Subscription…"
//   Outlook          → Add calendar → "Subscribe from web"

// Force Next.js to always run this handler fresh — never serve a cached build
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function esc(str: string): string {
  // RFC 5545 escaping for TEXT values
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// "2026-05-30" + "18:30" → "20260530T183000"
function toICSLocal(date: string, time: string): string {
  return date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
}

// Add `hours` to "HH:MM", clamped at 23:59
function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(h + hours, 23);
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function GET() {
  const gigs = await db.gig.findMany({ orderBy: [{ date: 'asc' }, { time: 'asc' }] });

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  const vevents = gigs.map((gig) => {
    const dtStart = toICSLocal(gig.date, gig.time);
    const dtEnd   = toICSLocal(gig.date, addHours(gig.time, 2));

    const descParts: string[] = [];
    if (gig.notes)    descParts.push(esc(gig.notes));
    if (gig.eventUrl) descParts.push(esc(gig.eventUrl));

    const lines = [
      'BEGIN:VEVENT',
      `UID:${gig.id}@divnabara`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Prague:${dtStart}`,
      `DTEND;TZID=Europe/Prague:${dtEnd}`,
      `SUMMARY:${esc(gig.name)}`,
      `LOCATION:${esc(gig.address)}`,
      ...(descParts.length ? [`DESCRIPTION:${descParts.join('\\n')}`] : []),
      ...(gig.eventUrl ? [`URL:${gig.eventUrl}`] : []),
      'END:VEVENT',
    ];

    return lines.join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Divná Bára//Gig Planner//CS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Divná Bára – Koncerty',
    'X-WR-TIMEZONE:Europe/Prague',
    'X-WR-CALDESC:Plán koncertů kapely Divná Bára',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      // no-cache: calendar apps must revalidate on every sync — no stale events
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      // Hint to calendar apps that this is a subscribable feed
      'Content-Disposition': 'inline; filename="divna-bara-koncerty.ics"',
    },
  });
}
