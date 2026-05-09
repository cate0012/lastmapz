import type { Env, User } from './types.js';
import { upsertUser, getUserByAccorId, linkAccorId, kvGet, kvPut, kvDelete } from './db.js';
import { createSession, sessionCookie } from './sessions.js';

export async function handleQrStart(env: Env): Promise<Response> {
  const res = await fetch('https://store.last-z.com/getindex.php');
  if (!res.ok) {
    return Response.json({ error: 'Failed to get auth token from Last Z' }, { status: 502 });
  }
  const data = await res.json() as { token: string };
  if (!data.token) {
    return Response.json({ error: 'Invalid response from Last Z' }, { status: 502 });
  }

  await kvPut(env, `qr:${data.token}`, 'pending', 180);
  return Response.json({ token: data.token });
}

export async function handleQrPoll(env: Env, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 400 });
  }

  const status = await kvGet(env, `qr:${token}`);
  if (!status) {
    return Response.json({ error: 'Token expired or invalid' }, { status: 410 });
  }

  if (status !== 'pending') {
    return Response.json({ status: 'already_used' }, { status: 409 });
  }

  const res = await fetch(`https://store.last-z.com/getuser.php?uuid=${encodeURIComponent(token)}`);
  if (!res.ok) {
    return Response.json({ status: 'pending' });
  }

  const data = await res.json() as any;
  if (data.code !== 0) {
    return Response.json({ status: 'pending' });
  }

  await kvPut(env, `qr:${token}`, 'used', 10);

  const result = data.result;
  const user = await upsertUser(
    env,
    result.token,
    result.name,
    result.headimg || result.pic || null,
    result.belongSid,
    parseInt(result.level) || 0
  );

  const sessionToken = await createSession(env, user.id);

  return new Response(JSON.stringify({
    status: 'authenticated',
    user: { id: user.id, name: user.name, hasAccorId: !!user.accorid_id }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookie(sessionToken)
    }
  });
}

export function getAccorIdAuthUrl(env: Env, state: string, mode: 'login' | 'link' = 'login'): string {
  const redirectUri = `${env.APP_URL}/auth/accorid/callback`;
  const params = new URLSearchParams({
    client_id: env.ACCORID_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'profile',
    response_type: 'code',
    state: `${mode}:${state}`
  });
  return `https://accorid.com/oauth/authorize?${params}`;
}

export async function handleAccorIdStart(env: Env, req: Request, currentUser: User | null): Promise<Response> {
  const state = crypto.randomUUID();
  const mode = currentUser ? 'link' : 'login';
  await kvPut(env, `accorid_state:${state}`, JSON.stringify({
    mode,
    userId: currentUser?.id ?? null
  }), 600);

  return Response.json({ url: getAccorIdAuthUrl(env, state, mode) });
}

export async function handleAccorIdCallback(env: Env, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return redirectWithMessage(env, 'AccorID authorization was denied.');
  }

  if (!code || !stateParam) {
    return redirectWithMessage(env, 'Invalid callback parameters.');
  }

  const [mode, stateKey] = stateParam.split(':');
  const raw = await kvGet(env, `accorid_state:${stateKey}`);
  if (!raw) {
    return redirectWithMessage(env, 'Session expired. Please try again.');
  }
  const stateData = JSON.parse(raw) as { mode: string; userId: number | null };

  await kvDelete(env, `accorid_state:${stateKey}`);

  const tokenRes = await fetch('https://accorid.com/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${env.APP_URL}/auth/accorid/callback`,
      client_id: env.ACCORID_CLIENT_ID,
      client_secret: env.ACCORID_CLIENT_SECRET
    })
  });

  if (!tokenRes.ok) {
    return redirectWithMessage(env, 'Failed to exchange authorization code.');
  }

  const tokens = await tokenRes.json() as { access_token: string };

  const userInfoRes = await fetch('https://accorid.com/api/oauth/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  if (!userInfoRes.ok) {
    return redirectWithMessage(env, 'Failed to get user info from AccorID.');
  }

  const accorUser = await userInfoRes.json() as { sub: string; username?: string; display_name?: string; avatar?: string };

  if (mode === 'link' && stateData.userId) {
    await linkAccorId(env, stateData.userId, accorUser.sub);
    return Response.redirect(`${env.APP_URL}/dashboard?linked=1`, 302);
  }

  const existingUser = await getUserByAccorId(env, accorUser.sub);
  if (!existingUser) {
    const pendingId = crypto.randomUUID();
    await kvPut(env, `accorid_pending:${pendingId}`, JSON.stringify({
      accorId: accorUser.sub,
      username: accorUser.username,
      displayName: accorUser.display_name,
      avatar: accorUser.avatar
    }), 600);
    return Response.redirect(`${env.APP_URL}/login?accorid_pending=${pendingId}`, 302);
  }

  const sessionToken = await createSession(env, existingUser.id);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${env.APP_URL}/dashboard`,
      'Set-Cookie': sessionCookie(sessionToken)
    }
  });
}

export async function handleQrPollWithAccorIdLink(
  env: Env, req: Request, pendingId: string
): Promise<Response> {
  const pollResponse = await handleQrPoll(env, req);
  const body = await pollResponse.clone().json() as any;

  if (body.status === 'authenticated' && pendingId) {
    const raw = await kvGet(env, `accorid_pending:${pendingId}`);
    if (raw) {
      const pendingData = JSON.parse(raw) as { accorId: string };
      const user = body.user;
      if (user?.id) {
        await linkAccorId(env, user.id, pendingData.accorId);
        await kvDelete(env, `accorid_pending:${pendingId}`);
      }
    }
  }

  return pollResponse;
}

function redirectWithMessage(env: Env, message: string): Response {
  return Response.redirect(`${env.APP_URL}/login?error=${encodeURIComponent(message)}`, 302);
}
