import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || '';
const pool = connectionString
  ? new Pool({ connectionString, ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : false })
  : null;

let ready = null;

function ensureReady() {
  if (!pool) return Promise.reject(new Error('DATABASE_URL ist nicht gesetzt.'));
  if (!ready) {
    ready = pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }
  return ready;
}

export function hasDatabase() {
  return Boolean(pool);
}

export async function readAll() {
  await ensureReady();
  const { rows } = await pool.query('SELECT data FROM leads ORDER BY updated_at DESC');
  return rows.map((r) => r.data);
}

export async function upsertLead(lead) {
  await ensureReady();
  const id = lead.id || `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const normalized = { ...lead, id };
  const { rows } = await pool.query(
    `INSERT INTO leads (id, data, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (id) DO NOTHING
     RETURNING data`,
    [id, normalized]
  );
  if (rows.length === 0) {
    // already existed — return the existing row so callers can tell it wasn't newly added
    const existing = await pool.query('SELECT data FROM leads WHERE id = $1', [id]);
    return { lead: existing.rows[0]?.data || normalized, added: false };
  }
  return { lead: rows[0].data, added: true };
}

export async function upsertLeads(leads) {
  const results = [];
  for (const lead of leads) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await upsertLead(lead));
  }
  return results;
}

export async function updateLead(id, patch) {
  await ensureReady();
  const existing = await pool.query('SELECT data FROM leads WHERE id = $1', [id]);
  if (existing.rows.length === 0) return null;
  const merged = { ...existing.rows[0].data, ...patch, id };
  const { rows } = await pool.query(
    'UPDATE leads SET data = $2, updated_at = now() WHERE id = $1 RETURNING data',
    [id, merged]
  );
  return rows[0].data;
}

export async function deleteLead(id) {
  await ensureReady();
  const { rowCount } = await pool.query('DELETE FROM leads WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function replaceAll(leads) {
  await ensureReady();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM leads');
    for (const lead of leads) {
      const id = lead.id || `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      // eslint-disable-next-line no-await-in-loop
      await client.query(
        'INSERT INTO leads (id, data, updated_at) VALUES ($1, $2, now())',
        [id, { ...lead, id }]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function clearAll() {
  await ensureReady();
  await pool.query('DELETE FROM leads');
}
