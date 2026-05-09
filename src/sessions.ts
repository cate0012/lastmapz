import type { Env, User } from './types.js';
import { dbRun, dbFirst } from './db.js';

const SESSION_TTL = 30 * 24 * 60 * 60;

export async function createSession(env: Env, userId: number): Promise<string> {
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + SESSION_TTL * 1000;
  await dbRun(env, 'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    [token, userId, expiresAt, now]);
  return token;
}

export async function getSessionUser(env: Env, token: string): Promise<User | null> {
  const session = await dbFirst<{ id: string; user_id: number; expires_at: number }>(
    env, 'SELECT * FROM sessions WHERE id = ?', [token]);
  if (!session || session.expires_at < Date.now()) {
    if (session) await deleteSession(env, token);
    return null;
  }
  return dbFirst<User>(env, 'SELECT * FROM users WHERE id = ?', [session.user_id]);
}

export async function deleteSession(env: Env, token: string): Promise<void> {
  await dbRun(env, 'DELETE FROM sessions WHERE id = ?', [token]);
}

export function sessionCookie(token: string, maxAge = SESSION_TTL): string {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

export function getTokenFromCookies(req: Request): string | null {
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  return match?.[1] ?? null;
}
