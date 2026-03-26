import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { geocodeAddress } from '@/lib/geocode';
import { getColorForIndex } from '@/lib/colors';
import { isValidDate, isValidTime, isValidUrl, normaliseUrl } from '@/lib/utils';

// ─── GET /api/gigs ─────────────────────────────────────────────────────────
// Returns all gigs sorted chronologically (earliest first)
export async function GET() {
  try {
    const gigs = await db.gig.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    return NextResponse.json(gigs);
  } catch (error) {
    console.error('[GET /api/gigs]', error);
    return NextResponse.json({ error: 'Failed to fetch gigs' }, { status: 500 });
  }
}

// ─── POST /api/gigs ────────────────────────────────────────────────────────
// Creates a new gig. Geocodes the address automatically.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, date, time, eventUrl, notes, latitude: bodyLat, longitude: bodyLng } = body;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!name?.trim()) errors.name = 'Event name is required';
    if (!address?.trim()) errors.address = 'Address is required';
    if (!date) errors.date = 'Date is required';
    else if (!isValidDate(date)) errors.date = 'Invalid date format (YYYY-MM-DD)';
    if (!time) errors.time = 'Time is required';
    else if (!isValidTime(time)) errors.time = 'Invalid time format (HH:MM)';
    if (eventUrl && !isValidUrl(eventUrl)) errors.eventUrl = 'Invalid URL';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Assign the next color based on total gig count
    const gigCount = await db.gig.count();
    const color = getColorForIndex(gigCount);

    // Use pre-geocoded coords from the autocomplete selection if available,
    // otherwise fall back to server-side geocoding
    const location =
      typeof bodyLat === 'number' && typeof bodyLng === 'number'
        ? { latitude: bodyLat, longitude: bodyLng }
        : await geocodeAddress(address.trim());

    const gig = await db.gig.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        date,
        time,
        eventUrl: eventUrl ? normaliseUrl(eventUrl.trim()) : null,
        notes: notes?.trim() || null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        color,
      },
    });

    return NextResponse.json(gig, { status: 201 });
  } catch (error) {
    console.error('[POST /api/gigs]', error);
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 });
  }
}
