# Passo

What does a trip from Westfield to Brikama cost today?

A small fare-lookup app for Gambian public transport, built for the Advanced
Web Applications Development module of the Professional ToT Training Workshop.

Full labs and notes: **https://kamariana.gm/teaching/tot-web-2026/**

## Quick start

You need Node 20 or newer and a running PostgreSQL 18. The
[setup page](https://kamariana.gm/teaching/tot-web-2026/setup/) walks through
installing both and creating the database.

```bash
npm install
cp .env.example .env     # then put your database password in it
npm run setup            # creates the tables and fills them with sample fares
npm run dev
```

Open http://localhost:3000.

## How it is laid out

```text
api/     the server: Express routes, one Prisma client
web/     the browser app: plain HTML, CSS and fetch
prisma/  the schema and the seed data
tests/   Node's built-in test runner
```

**`api/` is the only thing that touches the database.** `web/` asks the API
over `fetch` and nothing else. That is the seam worth noticing: a mobile app
could be added later as a third folder, talking to the same API, without a
single change to the server.

For the workshop the API also serves `web/` as static files, so both share an
origin. That means no CORS to configure and the login cookie in Lab C simply
works. In production they could be deployed separately — the only thing that
changes is `API_BASE` at the top of `web/app.js`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the server, restarting on every change |
| `npm start` | Start the server |
| `npm run setup` | Create the tables, then seed them |
| `npm run seed` | Refill the sample data |
| `npm run reset` | Drop everything and start again |
| `npm test` | Run the tests |

## The data model

| Table | What it holds |
| --- | --- |
| `stops` | Westfield, Brikama, Banjul… |
| `routes` | A one-way trip between two stops, by van, taxi or bus |
| `fares` | An amount in dalasi, effective from a date |
| `users` | Fare officers, used from Lab C |

A fare is not a column on a route. It is a row with a date, because fares
change — they went up in April 2026 when fuel did. **Today's fare is the row
with the latest `effective_from` that is not in the future.** That one rule is
why this model is worth teaching.

Every seeded fare is marked `sample`. None of them is an official tariff.

## Branches

`main` is where Lab A starts. Each lab has a finishing branch which is also
the next lab's starting point, so a pair who falls behind can catch up with
one command:

```bash
git checkout checkpoint/lab-a-done
```

### `demo/injection` — never merge this

There is one more branch, and it is deliberately broken. `demo/injection`
carries a stop search built by gluing user input into SQL, so the Lab B
briefing can show an injection working against a real database.

**It must never be merged into `main`, and no pull request should be opened
from it.** It exists to be attacked. If you protect one branch in this
repository, protect against this.

The safe version of the same query sits beside it on that branch, so the
difference can be shown in one file.
