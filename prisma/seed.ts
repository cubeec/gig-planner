import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Real 2026 gigs for Divná Bára
const seedGigs = [
  {
    name: 'Březno u Chomutova',
    address: 'Březno u Chomutova, Czech Republic',
    date: '2026-05-30',
    time: '18:30',
    eventUrl: null,
    notes: null,
    latitude: 50.4317,
    longitude: 13.3542,
    color: '#E63946',
  },
  {
    name: 'Kadaň',
    address: 'Kadaň, Czech Republic',
    date: '2026-06-13',
    time: '13:15',
    eventUrl: null,
    notes: null,
    latitude: 50.3792,
    longitude: 13.2705,
    color: '#457B9D',
  },
  {
    name: 'Lom – Banda areál',
    address: 'Lom, Czech Republic',
    date: '2026-06-13',
    time: '22:30',
    eventUrl: null,
    notes: null,
    latitude: 50.5981,
    longitude: 13.6717,
    color: '#2D9E44',
  },
  {
    name: 'Černovice – hřiště',
    address: 'Černovice, Czech Republic',
    date: '2026-07-25',
    time: '16:00',
    eventUrl: null,
    notes: 'Přibližný čas nástupu cca 16:00.',
    latitude: 50.4177,
    longitude: 14.8284,
    color: '#F4A261',
  },
  {
    name: 'Kálek Ranč',
    address: 'Kálek, Czech Republic',
    date: '2026-08-15',
    time: '00:00',
    eventUrl: null,
    notes: 'Čas nástupu bude upřesněn.',
    latitude: 50.4397,
    longitude: 13.2731,
    color: '#9B5DE5',
  },
  {
    name: 'Ledvice',
    address: 'Ledvice, Czech Republic',
    date: '2026-08-28',
    time: '18:20',
    eventUrl: null,
    notes: null,
    latitude: 50.5556,
    longitude: 13.7767,
    color: '#00B4D8',
  },
  {
    name: 'Banda Chomutov',
    address: 'Chomutov, Czech Republic',
    date: '2026-09-19',
    time: '17:00',
    eventUrl: null,
    notes: null,
    latitude: 50.4611,
    longitude: 13.4172,
    color: '#E76F51',
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
