import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { geocodeAddress } from '@/lib/geocode';
import { isValidDate, isValidTime, isValidUrl, normaliseUrl } from '@/lib/utils';

// ─── GET /api/gigs/[id] ────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gig = await db.gig.findUnique({ where: { id: params.id } });
    if (!gig) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    return NextResponse.json(gig);
  } catch (error) {
    console.error('[GET /api/gigs/:id]', error);
    return NextResponse.json({ error: 'Failed to fetch gig' }, { status: 500 });
  }
}

// ─── PUT /api/gigs/[id] ────────────────────────────────────────────────────
// Updates a gig. Re-geocodes the address if it changed.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.gig.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });

    const body = await request.json();
    const { name, address, date, time, eventUrl, notes, latitude: bodyLat, longitude: bodyLng } = body;

    // Validate
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

    // Resolve coordinates:
    // 1. If the client sent pre-geocoded coords (from autocomplete), use them.
    // 2. Else if the address changed, re-geocode.
    // 3. Else keep the existing coordinates.
    let latitude = existing.latitude;
    let longitude = existing.longitude;

    if (typeof bodyLat === 'number' && typeof bodyLng === 'number') {
      latitude = bodyLat;
      longitude = bodyLng;
    } else if (address.trim() !== existing.address) {
      const location = await geocodeAddress(address.trim());
      latitude = location?.latitude ?? null;
      longitude = location?.longitude ?? null;
    }

    const updated = await db.gig.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        address: address.trim(),
        date,
        time,
        eventUrl: eventUrl ? normaliseUrl(eventUrl.trim()) : null,
        notes: notes?.trim() || null,
        latitude,
        longitude,
        // color is preserved from creation — never changes
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /api/gigs/:id]', error);
    return NextResponse.json({ error: 'Failed to update gig' }, { status: 500 });
  }
}

// ─── DELETE /api/gigs/[id] ─────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.gig.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });

    await db.gig.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/gigs/:id]', error);
    return NextResponse.json({ error: 'Failed to delete gig' }, { status: 500 });
  }
}
