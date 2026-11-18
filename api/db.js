import { PrismaClient } from '@prisma/client';

// One client for the whole process. Creating a PrismaClient per request opens
// a new connection pool each time and will exhaust Postgres.
export const db = new PrismaClient();
