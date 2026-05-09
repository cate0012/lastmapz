import { CSS } from './styles.js';
import type { User } from '../types.js';

export function layout(title: string, body: string, opts?: { user?: User | null; headExtra?: string; noNav?: boolean }): string {
  const user = opts?.user;
  const nav = opts?.noNav ? '' : `
    <nav class="nav">
      <a href="/dashboard" class="nav-brand">Last<span>Mapz</span></a>
      ${user ? `
        <div class="nav-user">
          <span class="nav-user-name">${esc(user.name)} &middot; S${esc(user.server_id || '?')}</span>
          ${user.head_img
            ? `<img src="${esc(user.head_img)}" alt="${esc(user.name)}">`
            : `<div class="avatar">${esc(user.name.charAt(0).toUpperCase())}</div>`}
          <button class="btn-icon" onclick="logout()" title="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      ` : ''}
    </nav>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} — LastMapz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>${CSS}</style>
  ${opts?.headExtra || ''}
</head>
<body>
  ${nav}
  ${body}
  <script>
    async function logout(){
      await fetch('/api/auth/logout',{method:'POST'});
      location.href='/';
    }
    function toast(msg,dur=3000){
      const el=document.createElement('div');el.className='toast';el.textContent=msg;
      document.body.appendChild(el);setTimeout(()=>el.remove(),dur);
    }
  <\/script>
</body>
</html>`;
}

export function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
