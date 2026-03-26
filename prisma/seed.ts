import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample gigs for Divná Bára — mix of past and future events
const seedGigs = [
  {
    name: 'Rock Café Praha',
    address: 'Národní třída 20, Praha 1, Czech Republic',
    date: '2026-01-15',
    time: '20:00',
    eventUrl: 'https://rockcafe.cz',
    notes: 'Warm-up set + full show. Load-in at 17:00.',
    latitude: 50.0819,
    longitude: 14.4164,
    color: '#E63946',
  },
  {
    name: 'Klub Fléda',
    address: 'Štefánikova 24, Brno, Czech Republic',
    date: '2026-02-08',
    time: '19:30',
    eventUrl: 'https://fleda.cz',
    notes: 'Support slot for The Plastic People of the Universe tribute night.',
    latitude: 49.1917,
    longitude: 16.6073,
    color: '#457B9D',
  },
  {
    name: 'Palác Akropolis',
    address: 'Kubelíkova 27, Praha 3, Czech Republic',
    date: '2026-02-22',
    time: '21:00',
    eventUrl: null,
    notes: 'Headline show. Full backline provided.',
    latitude: 50.0875,
    longitude: 14.4603,
    color: '#2D9E44',
  },
  {
    name: 'Štěpánka Festival',
    address: 'Výstaviště 1, Praha 7, Czech Republic',
    date: '2026-05-10',
    time: '16:00',
    eventUrl: 'https://stepankafestival.cz',
    notes: 'Outdoor stage. Set time TBC — around 45 minutes. Bring raincoats.',
    latitude: 50.1053,
    longitude: 14.4324,
    color: '#F4A261',
  },
  {
    name: 'Colours of Ostrava',
    address: 'Landek Park, Ostrava, Czech Republic',
    date: '2026-07-18',
    time: '22:30',
    eventUrl: 'https://colours.cz',
    notes: 'Late-night slot on the Malá scéna stage. This is a big one!',
    latitude: 49.8553,
    longitude: 18.2820,
    color: '#9B5DE5',
  },
  {
    name: 'Jazz Dock Praha',
    address: 'Janáčkovo nábřeží 2, Praha 5, Czech Republic',
    date: '2026-08-05',
    time: '20:30',
    eventUrl: 'https://jazzdock.cz',
    notes: null,
    latitude: 50.0725,
    longitude: 14.4059,
    color: '#00B4D8',
  },
];

async function main() {
  console.log('🌱 Seeding database with sample gigs...');

  // Clear existing data
  await prisma.gig.deleteMany();

  for (const gig of seedGigs) {
    await prisma.gig.create({ data: gig });
  }

  console.log(`✅ Seeded ${seedGigs.length} gigs.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
