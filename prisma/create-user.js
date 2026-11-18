import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../api/auth/password.js';

const db = new PrismaClient();

// Run once in Lab C:  node prisma/create-user.js
// Safe to run again — it updates the password rather than failing.
const username = process.argv[2] ?? 'bursar';
const password = process.argv[3] ?? 'passo2026';

const passwordHash = await hashPassword(password);

const user = await db.user.upsert({
  where: { username },
  update: { passwordHash },
  create: { username, passwordHash, role: 'fare_officer' },
});

console.log(`Fare officer ready: ${user.username} (role: ${user.role})`);
console.log('The database stores only the hash:');
console.log(`  ${user.passwordHash.slice(0, 48)}…`);

await db.$disconnect();
