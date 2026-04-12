require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Strip Prisma-specific query parameters from the URL — the pg driver does not understand them.
function cleanUrl(raw) {
  const u = new URL(raw);
  ['pgbouncer', 'statement_cache_size', 'connection_limit', 'schema'].forEach(
    (p) => u.searchParams.delete(p),
  );
  return u.toString();
}

if (!globalThis.__prisma) {
  // pg Pool manages connections at the Node.js level.
  // It does NOT create named prepared statements → error 42P05 is impossible.
  const pool = new Pool({
    connectionString: cleanUrl(process.env.DATABASE_URL),
    max: 5,
  });

  const adapter = new PrismaPg(pool);

  globalThis.__prisma = new PrismaClient({ adapter });
  globalThis.__pgPool = pool;
}

const prisma = globalThis.__prisma;

module.exports = prisma;
