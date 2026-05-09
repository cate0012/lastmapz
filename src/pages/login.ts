import { layout, esc } from './layout.js';

export function loginPage(opts?: { error?: string; accoridPending?: string }): string {
  const error = opts?.error || '';
  const pending = opts?.accoridPending || '';

  return layout('Sign In', `
  <style>
    body{overflow:hidden}
    .login-shell{
      display:flex;height:100vh;width:100vw;position:relative;
      background:#080b14;
    }

    .login-bg{
      position:absolute;inset:0;z-index:0;overflow:hidden;
    }
    .login-bg::before{
      content:'';position:absolute;inset:0;
      background:
        radial-gradient(ellipse 80% 60% at 25% 50%, rgba(59,130,246,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 60% 80% at 75% 30%, rgba(139,92,246,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 50% 50% at 50% 100%, rgba(6,182,212,0.06) 0%, transparent 50%);
    }
    .login-bg::after{
      content:'';position:absolute;inset:0;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpath d='M30 1 L58 16 L58 36 L30 51 L2 36 L2 16 Z' fill='none' stroke='rgba(255,255,255,0.025)' stroke-width='1'/%3E%3C/svg%3E");
      background-size:60px 52px;
    }

    .login-left{
      flex:1;display:flex;flex-direction:column;justify-content:center;
      padding:60px 80px;position:relative;z-index:1;
    }
    .login-logo{
      font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
      color:var(--accent2);margin-bottom:32px;
      display:flex;align-items:center;gap:10px;
    }
    .login-logo svg{opacity:0.7}
    .login-hero{
      font-size:clamp(40px,5vw,64px);font-weight:800;line-height:1.05;
      letter-spacing:-1.5px;margin-bottom:20px;
      background:linear-gradient(135deg,#f0f0f5 0%,#94a3b8 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
    }
    .login-sub{
      font-size:17px;color:var(--text2);max-width:400px;line-height:1.6;
      margin-bottom:12px;
    }
    .login-detail{
      font-size:14px;color:var(--text3);max-width:380px;line-height:1.7;
    }

    .login-right{
      width:480px;display:flex;align-items:center;justify-content:center;
      padding:40px;position:relative;z-index:1;
    }

    .login-card{
      width:100%;
      background:rgba(255,255,255,0.06);
      backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      border:1px solid rgba(255,255,255,0.10);
      border-radius:24px;
      padding:36px;
    }

    .login-card h2{
      font-size:20px;font-weight:600;margin-bottom:6px;
    }
    .login-card .subtitle{
      color:var(--text2);font-size:13px;margin-bottom:28px;
    }

    .qr-section{text-align:center}
    .qr-box{
      width:240px;height:240px;margin:0 auto 16px;
      background:#ffffff;
      border-radius:16px;
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;padding:8px;
    }
    .qr-box canvas{border-radius:4px;image-rendering:pixelated}
    .qr-status{
      font-size:13px;color:var(--text2);
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .qr-status .spinner{width:14px;height:14px;border-width:1.5px}
    .countdown{font-variant-numeric:tabular-nums;color:var(--text3)}

    .divider{
      display:flex;align-items:center;gap:16px;
      margin:28px 0;color:var(--text3);font-size:12px;letter-spacing:0.5px;
    }
    .divider::before,.divider::after{
      content:'';flex:1;height:1px;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);
    }

    .accorid-btn{
      width:100%;padding:12px 20px;
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.10);
      border-radius:var(--r);
      color:var(--text);font-size:14px;font-weight:500;
      cursor:pointer;transition:all .2s;
      display:flex;align-items:center;justify-content:center;gap:10px;
    }
    .accorid-btn:hover{
      background:rgba(255,255,255,0.09);
      border-color:rgba(255,255,255,0.16);
    }
    .accorid-btn:active{transform:scale(.98)}

    .instructions{
      margin-top:24px;padding:16px;
      background:rgba(255,255,255,0.03);
      border:1px solid rgba(255,255,255,0.05);
      border-radius:12px;
      font-size:12px;color:var(--text3);line-height:1.8;
    }
    .instructions strong{color:var(--text2)}
    .step-num{
      display:inline-flex;align-items:center;justify-content:center;
      width:18px;height:18px;border-radius:50%;
      background:var(--accent-d);color:var(--accent2);
      font-size:10px;font-weight:700;margin-right:6px;
      vertical-align:middle;
    }

    .error-msg{
      background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);
      color:#fca5a5;padding:12px 16px;border-radius:12px;
      margin-bottom:20px;font-size:13px;text-align:center;
    }

    .pending-msg{
      background:var(--accent-d);border:1px solid rgba(59,130,246,0.2);
      color:var(--accent2);padding:12px 16px;border-radius:12px;
      margin-bottom:20px;font-size:13px;text-align:center;line-height:1.5;
    }

    .accorid-note{
      text-align:center;margin-top:10px;font-size:11px;color:var(--text3);
    }

    @media(max-width:900px){
      .login-left{display:none}
      .login-right{width:100%;padding:24px}
      .login-shell{justify-content:center}
    }
  </style>

  <div class="login-shell">
    <div class="login-bg"></div>

    <div class="login-left">
      <div class="login-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="22" x2="12" y2="15.5"/><line x1="22" y1="8.5" x2="12" y2="15.5"/><line x1="2" y1="8.5" x2="12" y2="15.5"/></svg>
        LASTMAPZ
      </div>
      <h1 class="login-hero">Collaborative<br>Battle Maps</h1>
      <p class="login-sub">Real-time hex grid mapping for Last Z Survival. Plan, coordinate, and conquer together.</p>
      <p class="login-detail">Share maps with your alliance, mark territories, plan routes, and track resources across a 1000&times;1000 hex grid.</p>
    </div>

    <div class="login-right">
      <div class="login-card">
        <h2>Sign in</h2>
        <p class="subtitle">Scan with your Last Z account to continue</p>

        ${error ? `<div class="error-msg">${esc(error)}</div>` : ''}
        ${pending ? `<div class="pending-msg">Your AccorID isn't linked to a game account yet.<br>Scan the QR code below to link them.</div>` : ''}

        <div class="qr-section">
          <div class="qr-box" id="qr-box">
            <div class="spinner"></div>
          </div>
          <div class="qr-status" id="qr-status">
            <span class="spinner"></span> Generating...
          </div>
        </div>

        <div class="instructions">
          <span class="step-num">1</span>Open <strong>Last Z</strong> on your phone<br>
          <span class="step-num">2</span>Tap your <strong>Profile</strong> &rarr; <strong>Settings</strong><br>
          <span class="step-num">3</span>Scroll down &rarr; <strong>Scan QR Code</strong>
        </div>

        <div class="divider">or</div>

        <button class="accorid-btn" onclick="accoridLogin()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign in with AccorID
        </button>
        <p class="accorid-note">Only if you've linked your AccorID previously</p>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js"><\/script>
  <script>
    const accoridPending = ${JSON.stringify(pending || '')};
    let pollTimer = null;
    let countdownTimer = null;
    let expiresAt = 0;

    async function startAuth() {
      const qrBox = document.getElementById('qr-box');
      const status = document.getElementById('qr-status');
      qrBox.innerHTML = '<div class="spinner"></div>';
      status.innerHTML = '<span class="spinner"></span> Generating...';

      try {
        const res = await fetch('/api/auth/qr/start', { method: 'POST' });
        const data = await res.json();
        if (!data.token) throw new Error('No token');

        qrBox.innerHTML = '';
        const canvas = document.createElement('canvas');
        qrBox.appendChild(canvas);
        await QRCode.toCanvas(canvas, data.token, {
          width: 224,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });

        expiresAt = Date.now() + 150000;
        updateCountdown();
        countdownTimer = setInterval(updateCountdown, 1000);
        pollTimer = setInterval(() => pollAuth(data.token), 2000);
      } catch (e) {
        qrBox.innerHTML = '<span style="color:#fca5a5;font-size:13px">Failed to load</span>';
        status.innerHTML = '<a href="#" onclick="startAuth();return false" style="color:var(--accent2)">Try again</a>';
      }
    }

    function updateCountdown() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      const status = document.getElementById('qr-status');
      if (remaining <= 0) {
        clearInterval(pollTimer);
        clearInterval(countdownTimer);
        status.innerHTML = 'Expired — <a href="#" onclick="startAuth();return false" style="color:var(--accent2)">refresh</a>';
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      status.innerHTML = '<span class="spinner"></span> Waiting for scan <span class="countdown">' + m + ':' + String(s).padStart(2, '0') + '</span>';
    }

    async function pollAuth(token) {
      try {
        const url = accoridPending
          ? '/api/auth/qr/poll?token=' + token + '&accorid_pending=' + accoridPending
          : '/api/auth/qr/poll?token=' + token;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'authenticated') {
          clearInterval(pollTimer);
          clearInterval(countdownTimer);
          document.getElementById('qr-status').innerHTML = '<span style="color:var(--success)">Authenticated!</span>';
          setTimeout(() => { location.href = '/dashboard'; }, 400);
        }
      } catch {}
    }

    async function accoridLogin() {
      const res = await fetch('/api/auth/accorid/start', { method: 'POST' });
      const data = await res.json();
      if (data.url) location.href = data.url;
    }

    startAuth();
  <\/script>
  `, { noNav: true });
}
