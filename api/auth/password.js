import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// A password is never stored. What is stored is the result of a slow,
// one-way function, plus the random salt that made it unique.
export async function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(plain, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(plain, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const derived = await scryptAsync(plain, salt, KEY_LENGTH);

  if (expected.length !== derived.length) return false;

  // Compare in constant time. A normal === returns faster on an early
  // mismatch, and that difference is enough to guess a hash byte by byte.
  return timingSafeEqual(expected, derived);
}
