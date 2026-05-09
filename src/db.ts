import type { Env, User, MapRecord, Tile, TileChange, MapShare } from './types.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT UNIQUE NOT NULL,
  accorid_id TEXT UNIQUE,
  name TEXT NOT NULL,
  head_img TEXT,
  server_id TEXT,
  level INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS maps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Untitled Map',
  owner_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS map_shares (
  map_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (map_id, user_id)
);

CREATE TABLE IF NOT EXISTS tiles (
  map_id TEXT NOT NULL,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  color TEXT,
  label TEXT,
  icon TEXT,
  updated_by INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (map_id, q, r)
);

CREATE TABLE IF NOT EXISTS tile_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map_id TEXT NOT NULL,
  q INTEGER NOT NULL,
  r INTEGER NOT NULL,
  color TEXT,
  label TEXT,
  icon TEXT,
  version INTEGER NOT NULL,
  changed_by INTEGER,
  changed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS map_views (
  map_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  last_viewed_at INTEGER NOT NULL,
  PRIMARY KEY (map_id, user_id)
);

CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  hexes TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tiles_map ON tiles(map_id);
CREATE INDEX IF NOT EXISTS idx_tile_changes_map_ver ON tile_changes(map_id, version);
CREATE INDEX IF NOT EXISTS idx_map_shares_user ON map_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_maps_owner ON maps(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);
`;

// ─── DB helpers (D1-style prepare/bind API) ───

function run(env: Env, sql: string, params: unknown[] = []) {
  return env.DB.prepare(sql).bind(...params).run();
}

async function query<T>(env: Env, sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await env.DB.prepare(sql).bind(...params).all<T>();
  return result.results;
}

function first<T>(env: Env, sql: string, params: unknown[] = []): Promise<T | null> {
  return env.DB.prepare(sql).bind(...params).first<T>();
}

function batch(env: Env, stmts: Array<{ sql: string; params?: unknown[] }>) {
  return env.DB.batch(stmts.map(s => env.DB.prepare(s.sql).bind(...(s.params || []))));
}

// Exported for use in sessions.ts, maps.ts
export { run as dbRun, query as dbQuery, first as dbFirst, batch as dbBatch };

// ─── Schema init ───

export async function initDb(env: Env): Promise<void> {
  const statements = SCHEMA.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const sql of statements) {
    await env.DB.exec(sql);
  }
}

// ─── KV (DB-backed) ───

export async function kvGet(env: Env, key: string): Promise<string | null> {
  const row = await first<{ value: string; expires_at: number | null }>(
    env, 'SELECT value, expires_at FROM kv WHERE key = ?', [key]);
  if (!row) return null;
  if (row.expires_at && row.expires_at < Date.now()) {
    await run(env, 'DELETE FROM kv WHERE key = ?', [key]);
    return null;
  }
  return row.value;
}

export async function kvPut(env: Env, key: string, value: string, ttlSeconds?: number): Promise<void> {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  await run(env, 'INSERT OR REPLACE INTO kv (key, value, expires_at) VALUES (?, ?, ?)',
    [key, value, expiresAt]);
}

export async function kvDelete(env: Env, key: string): Promise<void> {
  await run(env, 'DELETE FROM kv WHERE key = ?', [key]);
}

// ─── Users ───

export async function upsertUser(
  env: Env, gameId: string, name: string,
  headImg: string | null, serverId: string | null, level: number
): Promise<User> {
  const now = Date.now();
  const existing = await first<User>(env, 'SELECT * FROM users WHERE game_id = ?', [gameId]);

  if (existing) {
    await run(env, 'UPDATE users SET name = ?, head_img = ?, server_id = ?, level = ?, updated_at = ? WHERE id = ?',
      [name, headImg, serverId, level, now, existing.id]);
    return { ...existing, name, head_img: headImg, server_id: serverId, level, updated_at: now };
  }

  await run(env, 'INSERT INTO users (game_id, name, head_img, server_id, level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [gameId, name, headImg, serverId, level, now, now]);

  return (await first<User>(env, 'SELECT * FROM users WHERE game_id = ?', [gameId]))!;
}

export async function getUserById(env: Env, id: number): Promise<User | null> {
  return first<User>(env, 'SELECT * FROM users WHERE id = ?', [id]);
}

export async function getUserByAccorId(env: Env, accorId: string): Promise<User | null> {
  return first<User>(env, 'SELECT * FROM users WHERE accorid_id = ?', [accorId]);
}

export async function linkAccorId(env: Env, userId: number, accorId: string): Promise<void> {
  await run(env, 'UPDATE users SET accorid_id = ?, updated_at = ? WHERE id = ?',
    [accorId, Date.now(), userId]);
}

export async function searchUsers(env: Env, q: string, limit = 20): Promise<User[]> {
  return query<User>(env, 'SELECT * FROM users WHERE name LIKE ? OR game_id LIKE ? LIMIT ?',
    [`%${q}%`, `%${q}%`, limit]);
}

// ─── Maps ───

export async function createMap(env: Env, ownerId: number, name: string): Promise<MapRecord> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await run(env, 'INSERT INTO maps (id, name, owner_id, version, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
    [id, name, ownerId, now, now]);
  return { id, name, owner_id: ownerId, version: 0, created_at: now, updated_at: now };
}

export async function getMap(env: Env, mapId: string): Promise<MapRecord | null> {
  return first<MapRecord>(env, 'SELECT * FROM maps WHERE id = ?', [mapId]);
}

export async function updateMapName(env: Env, mapId: string, name: string): Promise<void> {
  await run(env, 'UPDATE maps SET name = ?, updated_at = ? WHERE id = ?',
    [name, Date.now(), mapId]);
}

export async function deleteMap(env: Env, mapId: string): Promise<void> {
  await batch(env, [
    { sql: 'DELETE FROM tile_changes WHERE map_id = ?', params: [mapId] },
    { sql: 'DELETE FROM tiles WHERE map_id = ?', params: [mapId] },
    { sql: 'DELETE FROM map_shares WHERE map_id = ?', params: [mapId] },
    { sql: 'DELETE FROM map_views WHERE map_id = ?', params: [mapId] },
    { sql: 'DELETE FROM maps WHERE id = ?', params: [mapId] },
  ]);
}

export async function listUserMaps(
  env: Env, userId: number,
  opts: { sort?: string; search?: string; filter?: string }
): Promise<(MapRecord & { role: string; last_viewed_at: number | null })[]> {
  let sql = `
    SELECT m.*,
      CASE WHEN m.owner_id = ? THEN 'owner' ELSE ms.permission END as role,
      mv.last_viewed_at
    FROM maps m
    LEFT JOIN map_shares ms ON ms.map_id = m.id AND ms.user_id = ?
    LEFT JOIN map_views mv ON mv.map_id = m.id AND mv.user_id = ?
    WHERE m.owner_id = ? OR ms.user_id = ?
  `;
  const params: unknown[] = [userId, userId, userId, userId, userId];

  if (opts.search) {
    sql += ' AND m.name LIKE ?';
    params.push(`%${opts.search}%`);
  }

  switch (opts.sort) {
    case 'edited': sql += ' ORDER BY m.updated_at DESC'; break;
    case 'alpha': sql += ' ORDER BY m.name ASC'; break;
    case 'created': sql += ' ORDER BY m.created_at DESC'; break;
    default: sql += ' ORDER BY COALESCE(mv.last_viewed_at, m.created_at) DESC'; break;
  }

  sql += ' LIMIT 100';
  return query(env, sql, params);
}

export async function canAccessMap(env: Env, mapId: string, userId: number): Promise<string | null> {
  const map = await getMap(env, mapId);
  if (!map) return null;
  if (map.owner_id === userId) return 'owner';
  const share = await first<MapShare>(env,
    'SELECT * FROM map_shares WHERE map_id = ? AND user_id = ?', [mapId, userId]);
  return share?.permission ?? null;
}

export async function shareMap(env: Env, mapId: string, userId: number, permission: string): Promise<void> {
  await run(env, 'INSERT OR REPLACE INTO map_shares (map_id, user_id, permission, created_at) VALUES (?, ?, ?, ?)',
    [mapId, userId, permission, Date.now()]);
}

export async function unshareMap(env: Env, mapId: string, userId: number): Promise<void> {
  await run(env, 'DELETE FROM map_shares WHERE map_id = ? AND user_id = ?', [mapId, userId]);
}

export async function getMapMembers(env: Env, mapId: string): Promise<(MapShare & { name: string; game_id: string })[]> {
  return query(env,
    `SELECT ms.*, u.name, u.game_id FROM map_shares ms
     JOIN users u ON u.id = ms.user_id WHERE ms.map_id = ?`, [mapId]);
}

// ─── Tiles ───

export async function getTilesInViewport(
  env: Env, mapId: string, minQ: number, minR: number, maxQ: number, maxR: number
): Promise<Tile[]> {
  return query<Tile>(env,
    'SELECT * FROM tiles WHERE map_id = ? AND q >= ? AND q <= ? AND r >= ? AND r <= ?',
    [mapId, minQ, maxQ, minR, maxR]);
}

export async function updateTiles(
  env: Env, mapId: string, userId: number,
  updates: Array<{ q: number; r: number; color?: string | null; label?: string | null; icon?: string | null }>
): Promise<number> {
  const now = Date.now();
  const map = await getMap(env, mapId);
  if (!map) throw new Error('Map not found');
  const newVersion = map.version + 1;

  const stmts: Array<{ sql: string; params: unknown[] }> = [];
  for (const t of updates) {
    stmts.push({
      sql: 'INSERT OR REPLACE INTO tiles (map_id, q, r, color, label, icon, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      params: [mapId, t.q, t.r, t.color ?? null, t.label ?? null, t.icon ?? null, userId, now]
    });
    stmts.push({
      sql: 'INSERT INTO tile_changes (map_id, q, r, color, label, icon, version, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      params: [mapId, t.q, t.r, t.color ?? null, t.label ?? null, t.icon ?? null, newVersion, userId, now]
    });
  }
  stmts.push({
    sql: 'UPDATE maps SET version = ?, updated_at = ? WHERE id = ?',
    params: [newVersion, now, mapId]
  });

  await batch(env, stmts);
  return newVersion;
}

export async function getChangesSince(env: Env, mapId: string, sinceVersion: number): Promise<TileChange[]> {
  return query<TileChange>(env,
    'SELECT * FROM tile_changes WHERE map_id = ? AND version > ? ORDER BY version ASC LIMIT 5000',
    [mapId, sinceVersion]);
}

export async function recordMapView(env: Env, mapId: string, userId: number): Promise<void> {
  await run(env, 'INSERT OR REPLACE INTO map_views (map_id, user_id, last_viewed_at) VALUES (?, ?, ?)',
    [mapId, userId, Date.now()]);
}

// ─── Templates ───

export async function createTemplate(
  env: Env, userId: number, name: string, hexes: Array<{ q: number; r: number }>
): Promise<{ id: string; name: string; hexes: Array<{ q: number; r: number }>; created_at: number }> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const hexesJson = JSON.stringify(hexes);
  await run(env, 'INSERT INTO templates (id, user_id, name, hexes, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId, name, hexesJson, now]);
  return { id, name, hexes, created_at: now };
}

export async function listUserTemplates(env: Env, userId: number): Promise<Array<{
  id: string;
  name: string;
  hexes: Array<{ q: number; r: number }>;
  created_at: number;
}>> {
  const rows = await query<{ id: string; name: string; hexes: string; created_at: number }>(
    env, 'SELECT id, name, hexes, created_at FROM templates WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(r => ({ ...r, hexes: JSON.parse(r.hexes) }));
}

export async function getTemplate(env: Env, templateId: string): Promise<{
  id: string;
  user_id: number;
  name: string;
  hexes: Array<{ q: number; r: number }>;
  created_at: number;
} | null> {
  const row = await first<{ id: string; user_id: number; name: string; hexes: string; created_at: number }>(
    env, 'SELECT * FROM templates WHERE id = ?', [templateId]);
  if (!row) return null;
  return { ...row, hexes: JSON.parse(row.hexes) };
}

export async function deleteTemplate(env: Env, templateId: string, userId: number): Promise<boolean> {
  const result = await run(env, 'DELETE FROM templates WHERE id = ? AND user_id = ?', [templateId, userId]);
  return result.meta.changes > 0;
}
