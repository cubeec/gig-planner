# 🎸 Divná Bára — Gig Planner

A full-stack web app for managing band gigs. Add, view, edit, and delete shows on a timeline and interactive map.

---

## Stack

| Layer        | Choice                | Reason                                         |
|-------------|----------------------|------------------------------------------------|
| Frontend     | Next.js 14 + React   | Unified SSR + client, file-based routing       |
| API          | Next.js API routes   | Co-located, no separate server needed          |
| Database     | SQLite + Prisma      | Zero config, file-based, perfect for a small team |
| Map          | Leaflet + React-Leaflet | Open source, no API key, great React support |
| Geocoding    | Nominatim (OSM)      | Free, no API key, reliable                     |
| Styling      | Tailwind CSS         | Fast, responsive, utility-first                |

---

## Prerequisites

You need **Node.js v18+** installed. If you don't have it:

### Option A — Install with Homebrew (recommended on macOS)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### Option B — Download the installer
Go to https://nodejs.org and download the **LTS** version, then run the installer.

### Option C — Use nvm (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc   # or restart your terminal
nvm install --lts
nvm use --lts
```

Verify Node is installed:
```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

---

## Setup — First Time

```bash
# 1. Go to the project directory
cd "Gig planner"

# 2. Install dependencies
npm install

# 3. Create the database and apply schema
npm run db:push

# 4. (Optional) Load sample gigs
npm run db:seed

# 5. Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables

The only variable needed is the database path. It's already set correctly in `.env`:

```env
DATABASE_URL="file:./dev.db"
```

No API keys are needed — geocoding uses OpenStreetMap's free Nominatim service.

---

## Available Scripts

| Script            | What it does                              |
|------------------|-------------------------------------------|
| `npm run dev`     | Start development server (hot reload)     |
| `npm run build`   | Build for production                      |
| `npm run start`   | Start production server                   |
| `npm run db:push` | Apply Prisma schema to SQLite database    |
| `npm run db:seed` | Load sample gig data                      |
| `npm run db:studio` | Open Prisma Studio (database browser)   |

---

## Features

### Timeline View
- All gigs sorted chronologically (earliest first)
- Search by name, venue, or notes
- Filter: All / Upcoming / Past
- Past gigs are greyed out and read-only (edit disabled)
- Color stripe on each card matches the map pin color

### Map View
- Interactive Leaflet map showing all geocoded gigs
- Custom color-coded pins — same color as the timeline card
- Auto-fits viewport to show all pins on load
- Click a pin to see gig details in a popup
- Color legend at the bottom of the map
- Warning shown for any gig that couldn't be geocoded

### Gig Form (Add / Edit)
- All required fields validated on both client and server
- Address is geocoded automatically when the gig is saved
- If address changes during an edit, it is re-geocoded
- If geocoding fails, the gig is still saved (shown without map pin)

### Delete
- Confirmation dialog before deleting any gig
- Works for both upcoming and past gigs

---

## Data Model

Each gig stores:

| Field       | Type     | Notes                                   |
|------------|----------|-----------------------------------------|
| id          | String   | Auto-generated cuid                     |
| name        | String   | Event name (required)                   |
| address     | String   | Venue address (required, geocoded)      |
| date        | String   | YYYY-MM-DD format                       |
| time        | String   | HH:MM 24h format                        |
| eventUrl    | String?  | Optional link to event page             |
| notes       | String?  | Optional multiline notes                |
| latitude    | Float?   | Set by geocoding; null if failed        |
| longitude   | Float?   | Set by geocoding; null if failed        |
| color       | String   | Hex color assigned at creation          |
| createdAt   | DateTime | Auto-set                                |
| updatedAt   | DateTime | Auto-updated                            |

---

## Project Structure

```
gig-planner/
├── prisma/
│   ├── schema.prisma          # Database schema (SQLite)
│   └── seed.ts                # Sample gig data
├── src/
│   ├── app/
│   │   ├── api/gigs/
│   │   │   ├── route.ts       # GET /api/gigs, POST /api/gigs
│   │   │   └── [id]/route.ts  # GET, PUT, DELETE /api/gigs/:id
│   │   ├── layout.tsx         # Root layout + metadata
│   │   ├── page.tsx           # Main page (client, manages all state)
│   │   └── globals.css        # Tailwind base + Leaflet tweaks
│   ├── components/
│   │   ├── GigCard.tsx        # Individual gig card with color stripe
│   │   ├── GigForm.tsx        # Add / edit form modal
│   │   ├── GigTimeline.tsx    # Timeline with search + filter
│   │   ├── MapView.tsx        # Leaflet map (client-only)
│   │   ├── MapWrapper.tsx     # Dynamic import wrapper (no SSR)
│   │   └── DeleteConfirmModal.tsx
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── geocode.ts         # Nominatim geocoding
│   │   ├── colors.ts          # 20-color palette + assignment logic
│   │   └── utils.ts           # Date/time formatting, past-gig check, sort
│   └── types/
│       └── index.ts           # TypeScript interfaces (Gig, GigFormData, etc.)
├── .env                       # DATABASE_URL (not committed)
├── .env.example               # Template for .env
├── .gitignore
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Production Deployment

For a simple production deployment (e.g. a shared Mac Mini or a VPS):

```bash
npm run build
npm run start
```

The SQLite database file (`dev.db`) is created in the project root. Back it up regularly.

For cloud deployment, consider switching the Prisma datasource to PostgreSQL (Neon, Supabase, Railway) by changing `schema.prisma` and updating `DATABASE_URL`.

---

## Geocoding Notes

- Uses OpenStreetMap Nominatim — **free, no API key needed**
- Rate limit: ~1 request/second (fine for manual gig entry)
- For best results, use full addresses including city and country
- If a gig fails to geocode, it is saved without coordinates and won't appear on the map — edit the address and save again to retry

---

## Adding More Band Members

This app has no authentication — it's designed for internal band use on a trusted network. To share it:

1. Run it on one machine: `npm run start`
2. Share the local IP (e.g. `http://192.168.1.10:3000`) with band members on the same Wi-Fi
3. Or deploy to a simple VPS (Fly.io, Railway, DigitalOcean) for remote access

---

*Built with Next.js · Leaflet · Prisma · Tailwind CSS*
