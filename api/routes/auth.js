import { Router } from 'express';
import { db } from '../db.js';
import { verifyPassword } from '../auth/password.js';
import {
  createSession,
  destroySession,
  readSession,
  setSessionCookie,
  COOKIE,
} from '../auth/session.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = await db.user.findUnique({ where: { username: String(username) } });

  // One message for "no such user" and for "wrong password". Telling them
  // apart hands an attacker a list of real usernames for free.
  const ok = user && (await verifyPassword(String(password), user.passwordHash));

  if (!ok) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }

  setSessionCookie(res, createSession(user));
  res.json({ username: user.username, role: user.role });
});

router.post('/logout', (req, res) => {
  destroySession(req);
  res.clearCookie(COOKIE, { path: '/' });
  res.status(204).end();
});

router.get('/me', (req, res) => {
  const session = readSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Not signed in' });
  }

  res.json({ username: session.username, role: session.role });
});

export default router;
