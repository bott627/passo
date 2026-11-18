import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Every figure below is a plausible guess, not an official tariff. The app
// labels them "sample" so nobody mistakes them for the real thing. In Lab B
// each pair replaces one with a fare they actually paid.
const STOPS = [
  { name: 'Westfield', region: 'Kanifing' },
  { name: 'Serrekunda', region: 'Kanifing' },
  { name: 'Latrikunda', region: 'Kanifing' },
  { name: 'Tabokoto', region: 'Kanifing' },
  { name: 'Banjul', region: 'Banjul' },
  { name: 'Bakau', region: 'Kanifing' },
  { name: 'Brusubi', region: 'West Coast' },
  { name: 'Brikama', region: 'West Coast' },
  { name: 'Gunjur', region: 'West Coast' },
  { name: 'Farafenni', region: 'North Bank' },
  { name: 'Soma', region: 'Lower River' },
  { name: 'Basse', region: 'Upper River' },
];

// [origin, destination, vehicle, fare before April 2026, fare from April 2026]
const ROUTES = [
  ['Westfield', 'Banjul', 'van', 15, 20],
  ['Westfield', 'Serrekunda', 'van', 10, 12],
  ['Westfield', 'Brikama', 'van', 35, 45],
  ['Westfield', 'Bakau', 'van', 12, 15],
  ['Westfield', 'Tabokoto', 'van', 12, 15],
  ['Serrekunda', 'Banjul', 'van', 15, 20],
  ['Serrekunda', 'Brikama', 'van', 30, 40],
  ['Serrekunda', 'Latrikunda', 'van', 8, 10],
  ['Serrekunda', 'Brusubi', 'van', 20, 25],
  ['Banjul', 'Bakau', 'van', 12, 15],
  ['Banjul', 'Farafenni', 'bus', 180, 225],
  ['Banjul', 'Soma', 'bus', 200, 250],
  ['Banjul', 'Basse', 'bus', 350, 450],
  ['Brikama', 'Gunjur', 'van', 25, 30],
  ['Brikama', 'Brusubi', 'van', 20, 25],
  ['Brikama', 'Soma', 'bus', 150, 190],
  ['Tabokoto', 'Brikama', 'van', 25, 30],
  ['Bakau', 'Serrekunda', 'taxi', 50, 65],
  ['Westfield', 'Brusubi', 'taxi', 100, 130],
  ['Soma', 'Basse', 'bus', 200, 250],
];

// The fuel-price increase that pushed fares up.
const BEFORE = new Date('2025-09-01');
const AFTER = new Date('2026-04-01');

async function main() {
  // Order matters: fares point at routes, routes point at stops.
  await db.fare.deleteMany();
  await db.route.deleteMany();
  await db.stop.deleteMany();

  await db.stop.createMany({ data: STOPS });
  const stops = await db.stop.findMany();
  const idOf = (name) => stops.find((s) => s.name === name).id;

  for (const [origin, destination, vehicleType, oldFare, newFare] of ROUTES) {
    await db.route.create({
      data: {
        originId: idOf(origin),
        destinationId: idOf(destination),
        vehicleType,
        // Two rows per route, so "today's fare" is a real question with a
        // real answer rather than a lookup that can't go wrong.
        fares: {
          create: [
            { amountDalasi: oldFare, effectiveFrom: BEFORE, status: 'sample' },
            { amountDalasi: newFare, effectiveFrom: AFTER, status: 'sample' },
          ],
        },
      },
    });
  }

  console.log(`Seeded ${STOPS.length} stops, ${ROUTES.length} routes, ${ROUTES.length * 2} fares.`);
  console.log('Every fare is marked "sample". None of them is an official tariff.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
