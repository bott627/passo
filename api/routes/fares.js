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

// Everything the body must get right, in one place, so the handler below
// reads as a list of decisions rather than a thicket of ifs.
function validateFare(body) {
  const problems = [];

  const from = Number(body.from);
  const to = Number(body.to);
  const amountDalasi = Number(body.amountDalasi);

  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    problems.push('from and to must both be stop ids');
  }

  if (!Number.isInteger(amountDalasi) || amountDalasi <= 0) {
    problems.push('amountDalasi must be a whole number of dalasi above zero');
  }

  if (amountDalasi > 5000) {
    problems.push('amountDalasi looks like a typo — over D5000');
  }

  const effectiveFrom = new Date(body.effectiveFrom ?? Date.now());

  if (Number.isNaN(effectiveFrom.getTime())) {
    problems.push('effectiveFrom must be a date like 2026-11-20');
  }

  if (!body.source || String(body.source).trim().length < 3) {
    problems.push('source is required — say where this fare came from');
  }

  return {
    problems,
    from,
    to,
    amountDalasi,
    effectiveFrom,
    source: String(body.source ?? '').trim(),
  };
}

// POST /api/fares
router.post('/', async (req, res) => {
  const { problems, from, to, amountDalasi, effectiveFrom, source } = validateFare(
    req.body ?? {}
  );

  // 400 means "you sent something wrong and can fix it".
  if (problems.length > 0) {
    return res.status(400).json({ error: 'That fare was not accepted', problems });
  }

  const route = await db.route.findFirst({
    where: { originId: from, destinationId: to },
    include: { origin: true, destination: true },
  });

  // 404 means "what you asked for is not here", which is a different fix.
  if (!route) {
    return res.status(404).json({ error: 'No route between those two stops' });
  }

  const fare = await db.fare.create({
    data: {
      routeId: route.id,
      amountDalasi,
      effectiveFrom,
      source,
      // Someone actually paid this one, unlike the seeded guesses.
      status: 'verified',
    },
  });

  // 201 means "I made something", and Location says where it lives.
  res
    .status(201)
    .location(`/api/fares?from=${route.originId}&to=${route.destinationId}`)
    .json({
      id: fare.id,
      from: route.origin.name,
      to: route.destination.name,
      amountDalasi: fare.amountDalasi,
      effectiveFrom: fare.effectiveFrom,
      source: fare.source,
      status: fare.status,
    });
});

export default router;
