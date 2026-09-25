// Xem 5 migration Prisma gần nhất trên DATABASE_URL của .env (công cụ gỡ lỗi).
// Chạy: node scripts/xem-prisma-migrations.mjs
import fs from 'node:fs';
import pg from 'pg';

const { Client } = pg;

function loadEnvVar(name) {
  const txt = fs.readFileSync('.env', 'utf8');
  const m = txt.match(new RegExp('^' + name + '=(.*)$', 'm'));
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

(async () => {
  const url = loadEnvVar('DATABASE_URL');
  const client = new Client({ connectionString: url });
  await client.connect();
  const res = await client.query('SELECT id, checksum, migration_name, started_at, finished_at, applied_steps_count, rolled_back_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
