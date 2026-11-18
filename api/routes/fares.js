import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/fares?from=1&to=8
//
// "What is the fare today" is not "the fare row for this route". It is the
// row with the latest effective_from that is not in the future.
router.get('/', async (req, res) => {
  const from = Number(req.query.from);
  const to = Number(req.query.to);

  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    return res.status(400).json({ error: 'from and to must both be stop ids' });
  }

  const route = await db.route.findFirst({
    where: { originId: from, destinationId: to },
    include: {
      origin: true,
      destination: true,
      fares: {
        where: { effectiveFrom: { lte: new Date() } },
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      },
    },
  });

  if (!route) {
    return res.status(404).json({ error: 'No route between those two stops' });
  }

  const [fare] = route.fares;

  if (!fare) {
    return res.status(404).json({ error: 'No fare recorded for that route yet' });
  }

  res.json({
    from: route.origin.name,
    to: route.destination.name,
    vehicleType: route.vehicleType,
    amountDalasi: fare.amountDalasi,
    effectiveFrom: fare.effectiveFrom,
    status: fare.status,
  });
});

// DEMO ONLY — this branch exists to be attacked. Never merge it into main.
router.get('/unsafe-search', async (req, res) => {
  const name = req.query.name ?? '';
  const rows = await db.$queryRawUnsafe(
    `SELECT id, name, region FROM stops WHERE name = '${name}'`
  );
  res.json(rows);
});

// The same query, written safely. A tagged template sends the value as a
// value, so it can never be read as part of the sentence.
router.get('/safe-search', async (req, res) => {
  const name = req.query.name ?? '';
  const rows = await db.$queryRaw`
    SELECT id, name, region FROM stops WHERE name = ${name}
  `;
  res.json(rows);
});

export default router;
