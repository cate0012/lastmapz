import type { Env, User } from './types.js';
import { initDb } from './db.js';
import { getSessionUser, deleteSession, getTokenFromCookies, clearSessionCookie } from './sessions.js';
import { handleQrStart, handleQrPoll, handleAccorIdStart, handleAccorIdCallback, handleQrPollWithAccorIdLink } from './auth.js';
import { handleListMaps, handleCreateMap, handleGetMap, handleUpdateMap, handleDeleteMap, handleShareMap, handleUnshareMap, handleSearchUsers, handleGetTiles, handleUpdateTiles, handleGetChanges } from './maps.js';

let dbReady = false;

async function ensureDb(env: Env) {
  if (!dbReady) {
    await initDb(env);
    dbReady = true;
  }
}

function json(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return Response.json(data, { status, headers });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    await ensureDb(env);

    const sessionToken = getTokenFromCookies(req);
    let user: User | null = null;
    if (sessionToken) {
      user = await getSessionUser(env, sessionToken);
    }

    try {
      // HTML routes are not served in this revision (UI ships separately).
      if (method === 'GET' && (path === '/' || path === '/login' || path === '/dashboard' || path.startsWith('/map/'))) {
        return json({ error: 'Not found' }, 404);
      }

      if (method === 'GET' && path === '/auth/accorid/callback') {
        return handleAccorIdCallback(env, req);
      }

      if (method === 'POST' && path === '/api/auth/qr/start') {
        return handleQrStart(env);
      }

      if (method === 'GET' && path === '/api/auth/qr/poll') {
        const accoridPending = url.searchParams.get('accorid_pending');
        if (accoridPending) {
          return handleQrPollWithAccorIdLink(env, req, accoridPending);
        }
        return handleQrPoll(env, req);
      }

      if (method === 'POST' && path === '/api/auth/accorid/start') {
        return handleAccorIdStart(env, req, user);
      }

      if (method === 'POST' && path === '/api/auth/logout') {
        if (sessionToken) await deleteSession(env, sessionToken);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': clearSessionCookie()
          }
        });
      }

      if (method === 'GET' && path === '/api/auth/me') {
        if (!user) return json({ user: null }, 401);
        return json({
          user: { id: user.id, name: user.name, game_id: user.game_id, head_img: user.head_img, server_id: user.server_id, level: user.level, hasAccorId: !!user.accorid_id }
        });
      }

      if (!user) return json({ error: 'Unauthorized' }, 401);

      if (method === 'GET' && path === '/api/maps') {
        return handleListMaps(env, req, user);
      }

      if (method === 'POST' && path === '/api/maps') {
        return handleCreateMap(env, req, user);
      }

      if (method === 'GET' && path === '/api/users/search') {
        return handleSearchUsers(env, req);
      }

      const mapMatch = path.match(/^\/api\/maps\/([^/]+)$/);
      if (mapMatch) {
        const mapId = mapMatch[1];
        if (method === 'GET') return handleGetMap(env, mapId, user);
        if (method === 'PUT') return handleUpdateMap(env, req, mapId, user);
        if (method === 'DELETE') return handleDeleteMap(env, mapId, user);
      }

      const tilesMatch = path.match(/^\/api\/maps\/([^/]+)\/tiles$/);
      if (tilesMatch) {
        const mapId = tilesMatch[1];
        if (method === 'GET') return handleGetTiles(env, req, mapId, user);
        if (method === 'POST') return handleUpdateTiles(env, req, mapId, user);
      }

      const changesMatch = path.match(/^\/api\/maps\/([^/]+)\/changes$/);
      if (changesMatch && method === 'GET') {
        return handleGetChanges(env, req, changesMatch[1], user);
      }

      const shareMatch = path.match(/^\/api\/maps\/([^/]+)\/share$/);
      if (shareMatch && method === 'POST') {
        return handleShareMap(env, req, shareMatch[1], user);
      }

      const unshareMatch = path.match(/^\/api\/maps\/([^/]+)\/share\/(\d+)$/);
      if (unshareMatch && method === 'DELETE') {
        return handleUnshareMap(env, unshareMatch[1], parseInt(unshareMatch[2]), user);
      }

      return json({ error: 'Not found' }, 404);
    } catch (err: any) {
      console.error('Request error:', err);
      return json({ error: 'Internal server error' }, 500);
    }
  }
};
