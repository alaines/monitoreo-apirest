require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

(async () => {
  try {
    const sql = fs.readFileSync('database/migrations/007-websocket-notifications.sql', 'utf8');
    const prisma = new PrismaClient();
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Executing SQL migration file...');
    // Split SQL by semicolons and execute statements individually to avoid "multiple statements" errors
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (e) {
        console.error('Statement failed:', stmt.slice(0, 200));
        throw e;
      }
    }
    console.log('Migration applied successfully.');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
