import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../api/app.js';

// Start the real server on a port the OS picks, then talk to it with fetch.
// No test framework, no Supertest — one less thing to install.
async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    await run(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('the server is up and can reach the database', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200, 'health check should return 200');
    assert.equal(body.database, 'up', 'the database should be reachable');
  });
});

test('the stops list is seeded', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/stops`);
    const stops = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(stops), 'stops should be a list');
    assert.ok(stops.length > 0, 'run `npm run seed` if this is empty');
    assert.ok(
      stops.some((stop) => stop.name === 'Westfield'),
      'Westfield should be one of the seeded stops'
    );
  });
});
