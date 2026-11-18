import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import stops from './routes/stops.js';
import fares from './routes/fares.js';
import auth from './routes/auth.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(here, '..', 'web');

export const app = express();

app.use(express.json());

// The API comes first, so /api/... never gets mistaken for a file in web/.
app.get('/api/health', async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'up' });
  } catch {
    res.status(503).json({ ok: false, database: 'down' });
  }
});

app.use('/api/stops', stops);
app.use('/api/fares', fares);
app.use('/api', auth);

// The web app is served by this same server, so it shares an origin with the
// API. That means no CORS to configure, and the login cookie in Lab C simply
// works. The seam is still real: web/ only ever talks to the API over fetch,
// which is why a mobile app can be added later without touching this server.
app.use(express.static(webDir));

// Anything unmatched under /api is a missing endpoint, not a missing page.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'No such endpoint' });
});
