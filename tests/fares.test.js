import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../api/app.js';

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

// Westfield is stop 1 and Brikama is stop 8 in the seed, every time.
test('a fare search returns the fare that is in effect today', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/fares?from=1&to=8`);
    const fare = await response.json();

    assert.equal(response.status, 200);
    assert.equal(fare.from, 'Westfield');
    assert.equal(fare.to, 'Brikama');

    // Not "equals 45". Lab B invites everyone to add their own fare to this
    // route, so the amount is allowed to change. What must never change is
    // the rule, and the rule has two halves.
    assert.ok(Number.isInteger(fare.amountDalasi), 'the amount should be a whole number');

    const effective = new Date(fare.effectiveFrom);

    // Half one: it has already started.
    assert.ok(effective <= new Date(), 'a fare starting in the future must not be returned');

    // Half two: it is the *latest* one that has started. The seed gives this
    // route a 2025 fare and an April 2026 fare, so anything older than April
    // means the search found a fare, just not the right one.
    assert.ok(
      effective >= new Date('2026-04-01'),
      'returned a stale fare — check the orderBy and the take'
    );
  });
});

test('a route nobody has entered returns 404, not an empty answer', async () => {
  await withServer(async (base) => {
    // A route runs one way, and Brikama to Westfield was never seeded.
    const response = await fetch(`${base}/api/fares?from=8&to=1`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.match(body.error, /No route/);
  });
});
