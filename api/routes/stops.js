import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// Feeds the two dropdowns on the search form.
router.get('/', async (_req, res) => {
  const stops = await db.stop.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, region: true },
  });

  res.json(stops);
});

export default router;
