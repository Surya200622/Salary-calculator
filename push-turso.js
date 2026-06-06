const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const url = "libsql://salary-calculator-surya200622.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA3MjUzOTMsImlkIjoiMDE5ZTliN2MtNzgwMS03MGM0LWI3OGUtZTMyMjMwZDA0NmU4IiwicmlkIjoiYjlmZTNmZjItNDg5ZC00MTJkLTlmZTAtOTdlMjUzODBlZDdkIn0.qHPpNG_Lole-psvr-BQAyQvi0f7KWKY7FZOXvpbvCifUg9_PzWdle_utq9z8DfdCjTCHF8vE6Ll0dMhnk67LDA";

const client = createClient({
  url,
  authToken,
});

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf-8');
  const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

  console.log(`Executing ${statements.length} statements on Turso...`);
  
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log('Success:', stmt.substring(0, 50) + '...');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Already exists, skipping...');
      } else {
        console.error('Error executing statement:', e.message);
      }
    }
  }

  console.log("Migration complete!");
}

main();
