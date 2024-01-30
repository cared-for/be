import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from './db';

// This will run migrations on the database, skipping the ones already applied
async function main() {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log("migration successful!");
  client.end();
}

main()

