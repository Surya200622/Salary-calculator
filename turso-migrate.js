const fs = require('fs');
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN in .env");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  console.log("Connecting to Turso to run migrations...");
  
  const sql = fs.readFileSync('prisma/migrations/20260606053047_init_sqlite/migration.sql', 'utf-8');
  
  // Turso client expects individual statements, so we split by semicolon
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  try {
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.execute(statement);
    }
    console.log("Successfully migrated the Turso database!");
  } catch (error) {
    console.error("Error migrating:", error);
  }
}

main();
