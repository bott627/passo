import { randomUUID } from 'node:crypto';

// Sessions live in this process's memory. Restart the server and everyone is
// signed out. That is fine for a workshop and wrong for production, where
// this belongs in Redis or a sessions table.
const sessions = new Map();

export const COOKIE = 'passo_session';

export function createSession(user) {
  const id = randomUUID();
  sessions.set(id, { userId: user.id, username: user.username, role: user.role });
  return id;
}

function cookieValue(req) {
  const header = req.headers.cookie ?? '';
  const match = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`));

  return match ? match.slice(COOKIE.length + 1) : null;
}

export function readSession(req) {
  const id = cookieValue(req);
  return id ? (sessions.get(id) ?? null) : null;
}

export function destroySession(req) {
  const id = cookieValue(req);
  if (id) sessions.delete(id);
}

// The cookie holds a random id and nothing else. Everything the server knows
// about you stays on the server, so a tampered cookie just fails to match.
export function setSessionCookie(res, id) {
  res.cookie(COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 8,
  });
}

export function requireLogin(req, res, next) {
  const session = readSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Sign in to do that' });
  }

  req.user = session;
  next();
}
