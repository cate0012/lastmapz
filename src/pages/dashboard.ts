import { layout, esc } from './layout.js';
import type { User } from '../types.js';

export function dashboardPage(user: User, opts?: { linked?: boolean }): string {
  return layout('Dashboard', `
  <style>
    .page-bg{
      position:fixed;inset:0;z-index:-1;
      background:
        radial-gradient(ellipse 60% 40% at 20% 10%, rgba(59,130,246,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 40% 60% at 85% 80%, rgba(139,92,246,0.04) 0%, transparent 50%),
        var(--bg);
    }
    .dash{max-width:1120px;margin:0 auto;padding:32px 28px 80px}
    .dash-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:28px}
    .dash-header h2{font-size:24px;font-weight:700;letter-spacing:-0.3px}
    .controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    .search-box{position:relative;min-width:220px}
    .search-box input{padding-left:36px;background:var(--glass);border-color:var(--glass-border)}
    .search-box svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
    .sort-select{min-width:170px;background:var(--glass);border-color:var(--glass-border)}
    .sort-select option{background:#0f1220}

    .map-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
    .map-card{cursor:pointer;padding:0;overflow:hidden;position:relative}
    .map-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.3)}
    .map-card-preview{
      height:140px;
      background:linear-gradient(135deg,rgba(59,130,246,0.06),rgba(139,92,246,0.04));
      display:flex;align-items:center;justify-content:center;
      border-bottom:1px solid var(--glass-border);
      position:relative;overflow:hidden;
    }
    .map-card-preview::after{
      content:'';position:absolute;inset:0;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpath d='M30 1 L58 16 L58 36 L30 51 L2 36 L2 16 Z' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E");
      background-size:30px 26px;
    }
    .map-card-preview svg{opacity:0.15}
    .map-card-body{padding:18px 20px}
    .map-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
    .map-card-name{font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;margin-right:10px}
    .map-card-meta{font-size:12px;color:var(--text3)}
    .map-card-actions{
      position:absolute;top:12px;right:12px;display:flex;gap:4px;
      opacity:0;transition:opacity .2s;
    }
    .map-card:hover .map-card-actions{opacity:1}
    .map-card-actions .btn-icon{
      background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);
      border:1px solid rgba(255,255,255,0.1);
      width:32px;height:32px;
    }

    .fab{
      position:fixed;bottom:32px;right:32px;
      width:56px;height:56px;border-radius:16px;
      background:var(--accent);color:#fff;
      font-size:24px;display:flex;align-items:center;justify-content:center;
      box-shadow:0 8px 24px rgba(59,130,246,0.3);
      border:none;cursor:pointer;transition:all .2s;
    }
    .fab:hover{background:var(--accent2);transform:scale(1.06);box-shadow:0 12px 32px rgba(59,130,246,0.4)}

    .link-banner{
      background:var(--accent-d);border:1px solid rgba(59,130,246,0.2);border-radius:var(--r2);
      padding:14px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;
      font-size:13px;gap:12px;
    }
    .link-banner .success{color:var(--success)}
    .dismiss{background:transparent;border:none;color:var(--text3);cursor:pointer;font-size:20px;padding:4px;line-height:1}
    .dismiss:hover{color:var(--text2)}
  </style>

  <div class="page-bg"></div>
  <div class="dash">
    ${opts?.linked ? '<div class="link-banner" id="linked-banner"><span class="success">AccorID linked successfully!</span><button class="dismiss" onclick="document.getElementById(\'linked-banner\').remove()">&times;</button></div>' : ''}
    ${!user.accorid_id ? `
      <div class="link-banner" id="link-banner">
        <span>Link your AccorID for faster sign-in next time</span>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-sm btn-primary" onclick="linkAccorId()">Link AccorID</button>
          <button class="dismiss" onclick="document.getElementById('link-banner').remove()">&times;</button>
        </div>
      </div>
    ` : ''}

    <div class="dash-header">
      <h2>Your Maps</h2>
      <div class="controls">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" id="search" placeholder="Search maps..." oninput="loadMaps()">
        </div>
        <select class="sort-select" id="sort" onchange="loadMaps()">
          <option value="viewed">Recently Viewed</option>
          <option value="edited">Recently Edited</option>
          <option value="alpha">A &ndash; Z</option>
          <option value="created">Created Date</option>
        </select>
      </div>
    </div>

    <div class="map-grid" id="map-grid">
      <div class="empty-state"><div class="spinner" style="margin:0 auto 16px"></div><p>Loading...</p></div>
    </div>

    <button class="fab" onclick="createMap()" title="Create new map">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
  </div>

  <div class="modal-overlay" id="create-modal" style="display:none">
    <div class="modal">
      <h3>Create New Map</h3>
      <label style="display:block;margin-bottom:6px;font-size:13px;color:var(--text2)">Map name</label>
      <input type="text" id="new-map-name" placeholder="e.g. Alliance War Plan" style="margin-bottom:4px" maxlength="100" value="Untitled Map">
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeCreateModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateMap()">Create</button>
      </div>
    </div>
  </div>

  <script>
    let maps = [];

    function timeAgo(ts) {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return mins + 'm ago';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + 'h ago';
      const days = Math.floor(hrs / 24);
      if (days < 30) return days + 'd ago';
      return new Date(ts).toLocaleDateString();
    }

    async function loadMaps() {
      const search = document.getElementById('search').value;
      const sort = document.getElementById('sort').value;
      const params = new URLSearchParams({ sort });
      if (search) params.set('search', search);
      const res = await fetch('/api/maps?' + params);
      const data = await res.json();
      maps = data.maps || [];
      renderMaps();
    }

    function renderMaps() {
      const grid = document.getElementById('map-grid');
      if (maps.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>No maps yet</h3><p>Create your first collaborative map to get started</p></div>';
        return;
      }
      grid.innerHTML = maps.map(m => {
        const badge = m.role === 'owner' ? '<span class="badge badge-owner">Owner</span>'
          : m.role === 'edit' ? '<span class="badge badge-edit">Editor</span>'
          : '<span class="badge badge-view">Viewer</span>';
        return '<div class="card map-card" onclick="openMap(\\'' + m.id + '\\')">' +
          '<div class="map-card-preview"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg></div>' +
          '<div class="map-card-body">' +
            '<div class="map-card-header"><span class="map-card-name">' + esc2(m.name) + '</span>' + badge + '</div>' +
            '<div class="map-card-meta">Edited ' + timeAgo(m.updated_at) + '</div>' +
          '</div>' +
          '<div class="map-card-actions">' +
            (m.role === 'owner' ? '<button class="btn-icon" onclick="event.stopPropagation();deleteMapPrompt(\\'' + m.id + '\\',\\'' + esc2(m.name) + '\\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    }

    function esc2(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/"/g,'&quot;'); }
    function openMap(id) { location.href = '/map/' + id; }

    function createMap() {
      document.getElementById('create-modal').style.display = 'flex';
      const inp = document.getElementById('new-map-name');
      inp.select(); inp.focus();
    }
    function closeCreateModal() { document.getElementById('create-modal').style.display = 'none'; }

    async function submitCreateMap() {
      const name = document.getElementById('new-map-name').value.trim() || 'Untitled Map';
      const res = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      closeCreateModal();
      if (data.map) openMap(data.map.id);
    }

    async function deleteMapPrompt(id, name) {
      if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
      await fetch('/api/maps/' + id, { method: 'DELETE' });
      loadMaps();
    }

    async function linkAccorId() {
      const res = await fetch('/api/auth/accorid/start', { method: 'POST' });
      const data = await res.json();
      if (data.url) location.href = data.url;
    }

    document.getElementById('new-map-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitCreateMap();
      if (e.key === 'Escape') closeCreateModal();
    });

    loadMaps();
  <\/script>
  `, { user });
}
