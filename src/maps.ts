import type { Env, User } from './types.js';
import * as db from './db.js';
import { dbFirst } from './db.js';

export async function handleListMaps(env: Env, req: Request, user: User): Promise<Response> {
  const url = new URL(req.url);
  const maps = await db.listUserMaps(env, user.id, {
    sort: url.searchParams.get('sort') || 'viewed',
    search: url.searchParams.get('search') || undefined,
    filter: url.searchParams.get('filter') || undefined
  });
  return Response.json({ maps });
}

export async function handleCreateMap(env: Env, req: Request, user: User): Promise<Response> {
  const body = await req.json() as { name?: string };
  const name = (body.name || 'Untitled Map').slice(0, 100);
  const map = await db.createMap(env, user.id, name);
  return Response.json({ map }, { status: 201 });
}

export async function handleGetMap(env: Env, mapId: string, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (!role) return Response.json({ error: 'Not found' }, { status: 404 });

  const map = await db.getMap(env, mapId);
  await db.recordMapView(env, mapId, user.id);
  const members = await db.getMapMembers(env, mapId);

  return Response.json({ map, role, members });
}

export async function handleUpdateMap(env: Env, req: Request, mapId: string, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (role !== 'owner') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { name?: string };
  if (body.name) {
    await db.updateMapName(env, mapId, body.name.slice(0, 100));
  }
  return Response.json({ ok: true });
}

export async function handleDeleteMap(env: Env, mapId: string, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (role !== 'owner') return Response.json({ error: 'Forbidden' }, { status: 403 });

  await db.deleteMap(env, mapId);
  return Response.json({ ok: true });
}

export async function handleShareMap(env: Env, req: Request, mapId: string, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (role !== 'owner') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { game_id?: string; user_id?: number; permission?: string };
  let targetId = body.user_id;

  if (!targetId && body.game_id) {
    const target = await dbFirst<{ id: number }>(
      env, 'SELECT id FROM users WHERE game_id = ?', [body.game_id]);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });
    targetId = target.id;
  }

  if (!targetId) return Response.json({ error: 'Missing user_id or game_id' }, { status: 400 });
  if (targetId === user.id) return Response.json({ error: 'Cannot share with yourself' }, { status: 400 });

  const permission = body.permission === 'edit' ? 'edit' : 'view';
  await db.shareMap(env, mapId, targetId, permission);

  return Response.json({ ok: true });
}

export async function handleUnshareMap(env: Env, mapId: string, targetUserId: number, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (role !== 'owner') return Response.json({ error: 'Forbidden' }, { status: 403 });

  await db.unshareMap(env, mapId, targetUserId);
  return Response.json({ ok: true });
}

export async function handleSearchUsers(env: Env, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  if (!q || q.length < 2) return Response.json({ users: [] });

  const users = await db.searchUsers(env, q);
  return Response.json({
    users: users.map(u => ({ id: u.id, name: u.name, game_id: u.game_id, server_id: u.server_id }))
  });
}

export async function handleGetTiles(env: Env, req: Request, mapId: string, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (!role) return Response.json({ error: 'Not found' }, { status: 404 });

  const url = new URL(req.url);
  const minQ = parseInt(url.searchParams.get('minQ') || '0');
  const minR = parseInt(url.searchParams.get('minR') || '0');
  const maxQ = parseInt(url.searchParams.get('maxQ') || '100');
  const maxR = parseInt(url.searchParams.get('maxR') || '100');

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const tiles = await db.getTilesInViewport(env, mapId,
    clamp(minQ, 0, 999), clamp(minR, 0, 999),
    clamp(maxQ, 0, 999), clamp(maxR, 0, 999));

  return Response.json({ tiles });
}

export async function handleUpdateTiles(env: Env, req: Request, mapId: string, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (role !== 'owner' && role !== 'edit') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    tiles: Array<{ q: number; r: number; color?: string | null; label?: string | null; icon?: string | null }>
  };

  if (!body.tiles || !Array.isArray(body.tiles) || body.tiles.length === 0) {
    return Response.json({ error: 'No tiles provided' }, { status: 400 });
  }

  if (body.tiles.length > 500) {
    return Response.json({ error: 'Too many tiles in single update (max 500)' }, { status: 400 });
  }

  for (const t of body.tiles) {
    if (t.q < 0 || t.q > 999 || t.r < 0 || t.r > 999) {
      return Response.json({ error: `Tile (${t.q},${t.r}) out of bounds` }, { status: 400 });
    }
    if (t.color && !/^#[0-9a-fA-F]{6}$/.test(t.color)) {
      return Response.json({ error: `Invalid color: ${t.color}` }, { status: 400 });
    }
    if (t.label && t.label.length > 32) {
      return Response.json({ error: 'Label too long (max 32 chars)' }, { status: 400 });
    }
  }

  const newVersion = await db.updateTiles(env, mapId, user.id, body.tiles);
  return Response.json({ version: newVersion });
}

export async function handleGetChanges(env: Env, req: Request, mapId: string, user: User): Promise<Response> {
  const role = await db.canAccessMap(env, mapId, user.id);
  if (!role) return Response.json({ error: 'Not found' }, { status: 404 });

  const url = new URL(req.url);
  const since = parseInt(url.searchParams.get('since') || '0');

  const map = await db.getMap(env, mapId);
  const changes = await db.getChangesSince(env, mapId, since);

  return Response.json({ version: map!.version, changes });
}
