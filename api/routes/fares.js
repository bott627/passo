import { Router } from 'express';

const router = Router();

// Lab A adds the search here: GET /api/fares?from=&to=
//
// It has to answer "what is the fare today", which is not "the fare row for
// this route" — it is the row with the latest effective_from that is not in
// the future.
router.get('/', (_req, res) => {
  res.status(501).json({
    error: 'Not built yet',
    hint: 'This is Lab A. Open api/routes/fares.js and make this return a fare.',
  });
});

export default router;
