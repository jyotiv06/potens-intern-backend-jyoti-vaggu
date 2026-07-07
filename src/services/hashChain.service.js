const crypto = require('crypto');
const pool = require('../config/db');

const GENESIS_HASH = '0'.repeat(64);

function normalizeTimestamp(date) {
  return new Date(date).toISOString();
}

function computeHash({ prevHash, actor, action, payload, createdAt }) {
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  const raw = `${prevHash}|${actor}|${action}|${payloadString}|${createdAt}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}


async function getLastEntry(client) {
  const result = await client.query(
    'SELECT * FROM logs ORDER BY id DESC LIMIT 1 FOR UPDATE'
  );
  return result.rows[0] || null;
}


async function appendEntry({ actor, action, payload }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lastEntry = await getLastEntry(client);
    const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
    const createdAt = normalizeTimestamp(new Date());

    const entryHash = computeHash({
        prevHash,
        actor,
        action,
        payload,
        createdAt
    });

    const result = await client.query(
      `INSERT INTO logs (actor, action, payload, prev_hash, hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [actor, action, payload, prevHash, entryHash, createdAt]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


async function getEntryWithStatus(id) {
  const result = await pool.query('SELECT * FROM logs WHERE id = $1', [id]);
  const entry = result.rows[0];
  if (!entry) return null;

    const recomputed = computeHash({
        prevHash: entry.prev_hash,
        actor: entry.actor,
        action: entry.action,
        payload: entry.payload,
        createdAt: normalizeTimestamp(entry.created_at)
    });

  return {
    ...entry,
    verification_status: recomputed === entry.hash ? 'valid' : 'tampered'
  };
}


async function verifyChain() {
  const result = await pool.query('SELECT * FROM logs ORDER BY id ASC');
  const rows = result.rows;

  let expectedPrevHash = GENESIS_HASH;

  for (const row of rows) {
    if (row.prev_hash !== expectedPrevHash) {
        return {
            status: "fail",
            brokenEntryId: row.id,
            reason: "Previous hash mismatch",
            expectedHash: expectedPrevHash,
            actualHash: row.prev_hash
        };
    }

    const recomputed = computeHash({
        prevHash: row.prev_hash,
        actor: row.actor,
        action: row.action,
        payload: row.payload,
        createdAt: normalizeTimestamp(row.created_at)
    });

    if (recomputed !== row.hash) {
        return {
            status: "fail",
            brokenEntryId: row.id,
            reason: "Hash verification failed",
            expectedHash: recomputed,
            actualHash: row.hash
        };
    }

    expectedPrevHash = row.hash;
  }

  return { status: 'pass', brokenEntryId: null };
}


async function exportLogs({ actor, startDate, endDate }) {
  const conditions = [];
  const values = [];
  let i = 1;

  if (actor) {
    conditions.push(`actor = $${i++}`);
    values.push(actor);
  }
  if (startDate) {
    conditions.push(`created_at >= $${i++}`);
    values.push(startDate);
  }
  if (endDate) {
    conditions.push(`created_at <= $${i++}`);
    values.push(endDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT * FROM logs ${whereClause} ORDER BY id ASC`,
    values
  );
  return result.rows;
}

module.exports = {
  computeHash,
  appendEntry,
  getEntryWithStatus,
  verifyChain,
  exportLogs
};