import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT ?? 3000);

if (!process.env.DATABASE_URL) {
  console.error('\nDATABASE_URL is not set.');
  console.error('Copy .env.example to .env and put your database password in it.\n');
  process.exit(1);
}

app.listen(port, () => {
  console.log(`\n  Passo is running: http://localhost:${port}`);
  console.log(`  Health check:     http://localhost:${port}/api/health\n`);
});
