import { layout, esc } from './layout.js';
import type { User } from '../types.js';

export function editorPage(user: User, mapId: string): string {
  return layout('Map Editor', `
  <style>
    .editor-wrap{display:flex;flex-direction:column;height:100vh;overflow:hidden;position:relative}
    .top-bar{
      display:flex;align-items:center;justify-content:space-between;
      padding:0 20px;
      background:var(--bg2);border-bottom:1px solid var(--border);
      gap:16px;min-height:56px;z-index:10;
    }
    .top-bar-left{display:flex;align-items:center;gap:12px}
    .back-btn{color:var(--text2);display:flex;align-items:center;transition:color .15s}
    .back-btn:hover{color:var(--text)}
    .map-name-input{
      background:transparent;border:1px solid transparent;color:var(--text);
      font-size:16px;font-weight:600;padding:6px 10px;border-radius:var(--r);
      max-width:200px;width:auto;transition:all .2s;
    }
    .map-name-input:hover{border-color:var(--border)}
    .map-name-input:focus{border-color:var(--accent);background:var(--bg2);box-shadow:0 0 0 3px rgba(59,130,246,0.1)}

    .search-bar{position:relative;flex:1;max-width:400px;margin:0 auto}
    .search-bar input{width:100%;padding:10px 14px 10px 40px;font-size:14px;border-radius:24px;background:var(--bg);border:1px solid var(--border);transition:all .2s}
    .search-bar input:focus{border-color:var(--accent);background:var(--bg2);box-shadow:0 0 0 3px rgba(59,130,246,0.1)}
    .search-bar svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text2);width:18px;height:18px;pointer-events:none}

    .top-bar-right{display:flex;align-items:center;gap:14px}
    .sync-dot{width:7px;height:7px;border-radius:50%}
    .sync-dot.ok{background:var(--success)}
    .sync-dot.syncing{background:var(--warn);animation:pulse 1s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    .user-info{display:flex;align-items:center;gap:10px}
    .user-name{font-size:13px;color:var(--text2)}
    .user-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--border)}
    .logout-btn{width:32px;height:32px;padding:0;background:transparent;color:var(--text2);border-radius:var(--r)}
    .logout-btn:hover{background:var(--bg-hover);color:var(--text)}

    /* Bottom Toolbar */
    .bottom-toolbar{
      position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
      background:#fff;border:1px solid var(--border);
      border-radius:8px;padding:4px 8px;
      display:flex;align-items:center;gap:0;
      box-shadow:0 2px 8px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.04);z-index:10;
    }
    .toolbar-group{display:flex;align-items:center;gap:0}
    .toolbar-divider{width:1px;height:20px;background:var(--border);margin:0 6px}

    .tool-btn{
      width:32px;height:32px;border-radius:6px;
      display:flex;align-items:center;justify-content:center;
      background:transparent;border:none;color:var(--text2);cursor:pointer;
      transition:background .15s ease;
    }
    .tool-btn:hover:not(:disabled){background:var(--bg-hover);color:var(--text)}
    .tool-btn:disabled{opacity:0.4;cursor:not-allowed}
    .tool-btn.active{background:var(--accent);color:#fff}

    .color-selector{display:flex;align-items:center;gap:2px;padding-left:2px}
    .color-swatch{
      width:20px;height:20px;border-radius:4px;
      border:2px solid transparent;cursor:pointer;
      transition:all .15s ease;flex-shrink:0;
    }
    .color-swatch:hover{border-color:rgba(0,0,0,0.1)}
    .color-swatch.active{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}

    .coords{
      position:absolute;bottom:24px;right:24px;
      background:var(--bg2);border:1px solid var(--border);border-radius:10px;
      padding:6px 14px;font-size:12px;color:var(--text2);font-variant-numeric:tabular-nums;z-index:5;
      box-shadow:0 4px 12px rgba(0,0,0,0.08);
    }

    /* Text Label Modal */
    .text-label-modal{position:fixed;inset:0;background:rgba(0,0,0,.3);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100}
    .text-label-modal-content{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r3);padding:20px;width:280px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
    .text-label-modal-content input{width:100%;margin-bottom:12px}
    .text-label-modal-actions{display:flex;gap:8px;justify-content:flex-end}

    /* TOC Modal */
    .toc-list{max-height:400px;overflow-y:auto}
    .toc-item{display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s}
    .toc-item:hover{background:var(--bg-hover)}
    .toc-item-color{width:16px;height:16px;border-radius:4px;border:1px solid var(--border)}
    .toc-item-coord{font-size:11px;color:var(--text2);font-family:monospace}

    #map-canvas{display:block;width:100%;height:100%;cursor:crosshair}
    #map-canvas.cursor-scroll{cursor:grab}
    #map-canvas.cursor-scroll:active{cursor:grabbing}
    #map-canvas.cursor-text{cursor:text}
  </style>

  <div class="editor-wrap">
    <div class="top-bar">
      <div class="top-bar-left">
        <a href="/dashboard" class="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </a>
        <input type="text" class="map-name-input" id="map-name" value="" placeholder="Map name">
      </div>
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="search-input" placeholder="Search coords or labels...">
      </div>
      <div class="top-bar-right">
        <span class="sync-dot ok" id="sync-dot"></span>
        <span id="sync-text" style="font-size:12px;color:var(--text2)">Synced</span>
        <button class="btn btn-sm btn-secondary" onclick="openTOCModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Contents
        </button>
        <button class="btn btn-sm btn-secondary" onclick="openShareModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>
        <div class="user-info">
          <span class="user-name">${esc(user.name)} &middot; Server ${esc(user.server_id || '?')}</span>
          ${user.head_img
            ? `<img src="${esc(user.head_img)}" alt="${esc(user.name)}" class="user-avatar">`
            : `<div class="avatar">${esc(user.name.charAt(0).toUpperCase())}</div>`}
          <button class="logout-btn btn-icon" onclick="logout()" title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>

    <canvas id="map-canvas"></canvas>

    <div class="coords" id="coords">— , —</div>

    <!-- Bottom Toolbar -->
    <div class="bottom-toolbar" id="bottom-toolbar">
      <!-- Tools -->
      <div class="toolbar-group">
        <button class="tool-btn active" id="tool-scroll" onclick="hexMap.setTool('scroll')" title="Scroll (S)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M15 19l-3 3-3-3M2 12h20M12 2v20"/></svg>
        </button>
        <button class="tool-btn" id="tool-fill" onclick="hexMap.setTool('fill')" title="Fill (F)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11.9c0 4.2-3.4 7.6-7.6 7.6-1.5 0-2.9-.4-4.1-1.2L3 22.5l3.9-4.3c-.8-1.2-1.2-2.6-1.2-4.1 0-4.2 3.4-7.6 7.6-7.6s7.6 3.4 7.6 7.6z"/></svg>
        </button>
        <button class="tool-btn" id="tool-eraser" onclick="hexMap.setTool('eraser')" title="Eraser (E)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>
        <button class="tool-btn" id="tool-text" onclick="hexMap.setTool('text')" title="Add Text (T)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Undo/Redo -->
      <div class="toolbar-group">
        <button class="tool-btn" id="undo-btn" onclick="hexMap.undo()" title="Undo (Ctrl+Z)" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
        </button>
        <button class="tool-btn" id="redo-btn" onclick="hexMap.redo()" title="Redo (Ctrl+Y)" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Color Selector -->
      <div class="color-selector" id="color-selector"></div>
    </div>

    <!-- Text Label Modal -->
    <div class="text-label-modal" id="text-modal" style="display:none">
      <div class="text-label-modal-content">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px">Add Label</h3>
        <input type="text" id="text-input" placeholder="Enter label text..." maxlength="20">
        <div class="text-label-modal-actions">
          <button class="btn btn-secondary" onclick="closeTextModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitTextLabel()">Add</button>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <div class="modal-overlay" id="share-modal" style="display:none">
      <div class="modal">
        <h3>Share Map</h3>
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <input type="text" id="share-search" placeholder="Search by name or game ID..." style="flex:1" oninput="searchShareUsers()">
          <select id="share-perm"><option value="edit">Can edit</option><option value="view">Can view</option></select>
        </div>
        <div id="share-results" style="max-height:150px;overflow-y:auto;margin-bottom:16px"></div>
        <h4 style="font-size:13px;color:var(--text2);margin-bottom:8px">Members</h4>
        <div id="share-members"></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeShareModal()">Done</button>
        </div>
      </div>
    </div>

    <!-- TOC Modal -->
    <div class="modal-overlay" id="toc-modal" style="display:none">
      <div class="modal">
        <h3>Map Contents</h3>
        <input type="text" id="toc-filter" placeholder="Filter by label or coordinates..." style="margin-bottom:12px" oninput="filterTOC()">
        <div class="toc-list" id="toc-list"></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeTOCModal()">Close</button>
        </div>
      </div>
    </div>

  <script>
    const MAP_ID = ${JSON.stringify(mapId)};
    const COLORS = ['#64748b','#3b82f6','#0ea5e9','#14b8a6','#22c55e','#eab308','#f97316','#ef4444','#ec4899','#8b5cf6'];

    class HexMap {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.hexSize = 20;
        this.offsetX = 100;
        this.offsetY = 100;
        this.zoom = 1;
        this.minZoom = 0.2;
        this.maxZoom = 5;
        this.tiles = new Map();
        this.version = 0;
        this.isDragging = false;
        this.dragStart = null;
        this.hoverHex = null;
        this.pendingUpdates = [];
        this.sendTimer = null;
        this.role = 'view';
        this.mapData = null;

        // Tool state: 'scroll', 'fill', 'eraser', 'text'
        this.currentTool = 'scroll';
        this.selectedColor = COLORS[0];

        // Pointer tracking
        this.pointerDownPos = null;
        this.pointerDownTime = 0;
        this.pointerDownHex = null;

        // Text modal state
        this.textModalHex = null;

        // Undo/Redo
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;

        this.resize();
        this.setupEvents();
        this.loadMap();
        this.startSync();

        const raf = () => { this.render(); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }

      resize() {
        const r = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = r.width * dpr;
        this.canvas.height = r.height * dpr;
        this.canvas.style.width = r.width + 'px';
        this.canvas.style.height = r.height + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.displayWidth = r.width;
        this.displayHeight = r.height;
      }

      hexToPixel(q, r) {
        const s = this.hexSize * this.zoom;
        return {
          x: s * 1.5 * q + this.offsetX,
          y: s * Math.sqrt(3) * (r + 0.5 * (q & 1)) + this.offsetY
        };
      }

      pixelToHex(px, py) {
        const s = this.hexSize * this.zoom;
        const x = px - this.offsetX;
        const y = py - this.offsetY;
        const approxQ = Math.round(x / (s * 1.5));
        let bestQ = approxQ, bestR = 0, bestDist = Infinity;
        for (let dq = -1; dq <= 1; dq++) {
          const cq = approxQ + dq;
          const yOff = (cq & 1) ? s * Math.sqrt(3) / 2 : 0;
          const approxR = Math.round((y - yOff) / (s * Math.sqrt(3)));
          for (let dr = -1; dr <= 1; dr++) {
            const cr = approxR + dr;
            const hx = s * 1.5 * cq + this.offsetX;
            const hy = s * Math.sqrt(3) * (cr + 0.5 * (cq & 1)) + this.offsetY;
            const d = (px - hx) ** 2 + (py - hy) ** 2;
            if (d < bestDist) { bestDist = d; bestQ = cq; bestR = cr; }
          }
        }
        return { q: bestQ, r: bestR };
      }

      inBounds(q, r) { return q >= 0 && q < 1000 && r >= 0 && r < 1000; }

      drawHex(cx, cy, sz, color, label, hover) {
        const ctx = this.ctx;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 180 * (60 * i);
          const hx = cx + sz * Math.cos(a);
          const hy = cy + sz * Math.sin(a);
          if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fillStyle = color || '#e5e7eb';
        ctx.fill();
        if (hover) {
          ctx.strokeStyle = 'rgba(59,130,246,0.6)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        if (label && sz > 6) {
          ctx.fillStyle = '#1f2937';
          ctx.font = Math.max(7, sz * 0.38) + 'px Inter,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const maxW = sz * 1.5;
          const txt = label.length > 6 && sz < 15 ? label.slice(0, 5) + '..' : label;
          ctx.fillText(txt, cx, cy, maxW);
        }
      }

      render() {
        const w = this.displayWidth;
        const h = this.displayHeight;
        const ctx = this.ctx;
        ctx.fillStyle = '#f0f2f5';
        ctx.fillRect(0, 0, w, h);

        const s = this.hexSize * this.zoom;
        if (s < 2) return;

        const pad = s * 2;
        const minQ = Math.max(0, Math.floor((-this.offsetX - pad) / (s * 1.5)));
        const maxQ = Math.min(999, Math.ceil((-this.offsetX + w + pad) / (s * 1.5)));
        const sqr3 = Math.sqrt(3);
        const minR = Math.max(0, Math.floor((-this.offsetY - pad) / (s * sqr3)) - 1);
        const maxR = Math.min(999, Math.ceil((-this.offsetY + h + pad) / (s * sqr3)) + 1);

        for (let q = minQ; q <= maxQ; q++) {
          for (let r = minR; r <= maxR; r++) {
            const { x, y } = this.hexToPixel(q, r);
            if (x < -pad || x > w + pad || y < -pad || y > h + pad) continue;
            const k = q + ',' + r;
            const tile = this.tiles.get(k);
            const isHover = this.hoverHex && this.hoverHex.q === q && this.hoverHex.r === r;
            this.drawHex(x, y, s, tile?.color, tile?.label, isHover);
          }
        }

        // Grid labels
        if (s > 6) {
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.font = '11px Inter,sans-serif';

          const topEdge = 56;
          const leftEdge = 0;
          const hexRadius = s;
          const hexHeight = s * Math.sqrt(3);
          const labelPadding = 4;

          // Q labels at top
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          for (let q = minQ; q <= maxQ; q++) {
            const { x, y } = this.hexToPixel(q, minR);
            const hexTop = y - hexHeight / 2;
            let labelY = hexTop - labelPadding;
            if (hexTop < topEdge) labelY = topEdge + 1;
            if (x >= leftEdge && x <= w) {
              ctx.fillText(String(q), x, labelY);
            }
          }

          // R labels at left
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          for (let r = minR; r <= maxR; r++) {
            const { x, y } = this.hexToPixel(minQ, r);
            const hexLeft = x - hexRadius;
            let labelX = hexLeft - labelPadding;
            if (hexLeft < leftEdge) labelX = leftEdge - labelPadding;
            if (y >= topEdge && y <= h) {
              ctx.fillText(String(r), labelX, y);
            }
          }
        }
      }

      setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('tool-' + tool)?.classList.add('active');
        this.canvas.className = '';
        if (tool === 'scroll') this.canvas.classList.add('cursor-scroll');
        else if (tool === 'text') this.canvas.classList.add('cursor-text');
      }

      setColor(color) {
        this.selectedColor = color;
        document.querySelectorAll('.color-swatch').forEach(swatch => {
          swatch.classList.toggle('active', swatch.dataset.color === color);
        });
      }

      setupEvents() {
        const c = this.canvas;
        c.addEventListener('pointerdown', e => this.onPointerDown(e));
        c.addEventListener('pointermove', e => this.onPointerMove(e));
        c.addEventListener('pointerup', e => this.onPointerUp(e));
        c.addEventListener('pointerleave', () => {
          this.isDragging = false;
          this.pointerDownPos = null;
        });
        c.addEventListener('wheel', e => { e.preventDefault(); this.onWheel(e); }, { passive: false });
        c.addEventListener('contextmenu', e => e.preventDefault());
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => this.onKeyDown(e));

        document.getElementById('map-name').addEventListener('change', async (e) => {
          const name = e.target.value.trim();
          if (!name) return;
          await fetch('/api/maps/' + MAP_ID, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          });
        });

        document.getElementById('search-input').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.handleSearch(e.target.value.trim());
          }
        });

        // Build color selector
        const colorSelector = document.getElementById('color-selector');
        COLORS.forEach((color, i) => {
          const swatch = document.createElement('button');
          swatch.className = 'color-swatch' + (i === 0 ? ' active' : '');
          swatch.dataset.color = color;
          swatch.style.backgroundColor = color;
          swatch.title = color;
          swatch.onclick = () => this.setColor(color);
          colorSelector.appendChild(swatch);
        });
      }

      onPointerDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.pointerDownPos = { x: e.clientX, y: e.clientY };
        this.pointerDownTime = Date.now();
        this.pointerDownHex = this.pixelToHex(x, y);

        // Scroll tool: always drag
        if (this.currentTool === 'scroll') {
          this.isDragging = true;
          this.dragStart = { x: e.clientX, y: e.clientY, ox: this.offsetX, oy: this.offsetY };
          this.canvas.classList.add('dragging');
          this.canvas.setPointerCapture(e.pointerId);
          return;
        }

        // Other tools: check bounds
        const hex = this.pointerDownHex;
        if (!this.inBounds(hex.q, hex.r)) return;

        if (this.currentTool === 'eraser') {
          this.saveState();
          this.applyErase(hex.q, hex.r);
        } else if (this.currentTool === 'fill') {
          this.saveState();
          this.applyPaint(hex.q, hex.r, this.selectedColor);
        }
      }

      onPointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging && this.dragStart) {
          const dx = (e.clientX - this.dragStart.x) * 0.8;
          const dy = (e.clientY - this.dragStart.y) * 0.8;
          this.offsetX = this.dragStart.ox + dx;
          this.offsetY = this.dragStart.oy + dy;
          return;
        }

        const hex = this.pixelToHex(x, y);
        if (this.inBounds(hex.q, hex.r)) {
          this.hoverHex = hex;
          document.getElementById('coords').textContent = hex.q + ', ' + hex.r;
        } else {
          this.hoverHex = null;
        }
      }

      onPointerUp(e) {
        if (this.pointerDownPos) {
          const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
          const duration = Date.now() - this.pointerDownTime;
          const isTap = dist < 15 && duration < 350;

          if (isTap && !this.isDragging && this.pointerDownHex) {
            const hex = this.pointerDownHex;
            if (this.inBounds(hex.q, hex.r)) {
              if (this.currentTool === 'text') {
                this.openTextModal(hex);
              }
            }
          }
        }

        this.isDragging = false;
        this.dragStart = null;
        this.pointerDownPos = null;
        this.canvas.classList.remove('dragging');
      }

      onWheel(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const delta = Math.abs(e.deltaY);
        const scaleFactor = delta > 100 ? 0.96 : 0.98;
        const zoomOut = e.deltaY > 0;
        const newZoom = zoomOut
          ? Math.max(this.minZoom, this.zoom * scaleFactor)
          : Math.min(this.maxZoom, this.zoom * (1/scaleFactor));

        const scale = newZoom / this.zoom;
        this.offsetX = mx - (mx - this.offsetX) * scale;
        this.offsetY = my - (my - this.offsetY) * scale;
        this.zoom = newZoom;
      }

      onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          this.undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          this.redo();
        }
        if (e.key === 's') { e.preventDefault(); this.setTool('scroll'); }
        if (e.key === 'f') { e.preventDefault(); this.setTool('fill'); }
        if (e.key === 'e') { e.preventDefault(); this.setTool('eraser'); }
        if (e.key === 't') { e.preventDefault(); this.setTool('text'); }
        if (e.key === '=' || e.key === '+') this.zoomIn();
        if (e.key === '-') this.zoomOut();
        if (e.key === '0') this.resetView();
        if (e.key === 'Escape') {
          closeTextModal();
        }
      }

      zoomIn() {
        const cx = this.displayWidth / 2;
        const cy = this.displayHeight / 2;
        const newZoom = Math.min(this.maxZoom, this.zoom * 1.15);
        const scale = newZoom / this.zoom;
        this.offsetX = cx - (cx - this.offsetX) * scale;
        this.offsetY = cy - (cy - this.offsetY) * scale;
        this.zoom = newZoom;
      }

      zoomOut() {
        const cx = this.displayWidth / 2;
        const cy = this.displayHeight / 2;
        const newZoom = Math.max(this.minZoom, this.zoom * 0.87);
        const scale = newZoom / this.zoom;
        this.offsetX = cx - (cx - this.offsetX) * scale;
        this.offsetY = cy - (cy - this.offsetY) * scale;
        this.zoom = newZoom;
      }

      resetView() { this.zoom = 1; this.offsetX = 100; this.offsetY = 100; }

      openTextModal(hex) {
        this.textModalHex = hex;
        document.getElementById('text-modal').style.display = 'flex';
        document.getElementById('text-input').value = this.tiles.get(hex.q + ',' + hex.r)?.label || '';
        document.getElementById('text-input').focus();
        document.getElementById('text-input').select();
      }

      submitTextLabel() {
        if (!this.textModalHex) return;
        const text = document.getElementById('text-input').value.trim();
        this.saveState();
        this.applyLabel(this.textModalHex.q, this.textModalHex.r, text || null);
        closeTextModal();
      }

      closeTextModal() {
        this.textModalHex = null;
        document.getElementById('text-modal').style.display = 'none';
      }

      saveState() {
        const state = new Map(this.tiles);
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
        this.redoStack = [];
        this.updateHistoryButtons();
      }

      undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(new Map(this.tiles));
        this.tiles = this.undoStack.pop();
        this.render();
        this.updateHistoryButtons();
        this.flushUpdates();
      }

      redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(new Map(this.tiles));
        this.tiles = this.redoStack.pop();
        this.render();
        this.updateHistoryButtons();
        this.flushUpdates();
      }

      updateHistoryButtons() {
        document.getElementById('undo-btn').disabled = this.undoStack.length === 0;
        document.getElementById('redo-btn').disabled = this.redoStack.length === 0;
      }

      handleSearch(query) {
        if (!query) return;

        const coordMatch = query.match(/^\\s*(-?\\d+)\\s*,\\s*(-?\\d+)\\s*$/);
        if (coordMatch) {
          const q = parseInt(coordMatch[1]);
          const r = parseInt(coordMatch[2]);
          this.panToHex(q, r);
          return;
        }

        for (const [key, tile] of this.tiles) {
          if (tile.label && tile.label.toLowerCase().includes(query.toLowerCase())) {
            const [q, r] = key.split(',').map(Number);
            this.panToHex(q, r);
            return;
          }
        }

        toast('Not found: ' + query);
      }

      panToHex(q, r) {
        if (!this.inBounds(q, r)) {
          toast('Coordinates out of bounds');
          return;
        }
        const { x, y } = this.hexToPixel(q, r);
        this.offsetX = this.displayWidth / 2 - x;
        this.offsetY = this.displayHeight / 2 - y;
        this.hoverHex = { q, r };
      }

      applyPaint(q, r, color) {
        if (this.role !== 'owner' && this.role !== 'edit') return;
        const k = q + ',' + r;
        const existing = this.tiles.get(k);
        if (existing?.color === color) return;
        this.tiles.set(k, { ...(existing || {}), color });
        this.queueUpdate({ q, r, color, label: existing?.label || null });
      }

      applyLabel(q, r, label) {
        if (this.role !== 'owner' && this.role !== 'edit') return;
        const k = q + ',' + r;
        const existing = this.tiles.get(k);
        if (!label && !existing?.color) {
          this.tiles.delete(k);
        } else {
          this.tiles.set(k, { ...(existing || {}), label });
        }
        this.queueUpdate({ q, r, color: existing?.color || null, label });
      }

      applyErase(q, r) {
        if (this.role !== 'owner' && this.role !== 'edit') return;
        const k = q + ',' + r;
        if (!this.tiles.has(k)) return;
        this.tiles.delete(k);
        this.queueUpdate({ q, r, color: null, label: null });
      }

      queueUpdate(update) {
        const idx = this.pendingUpdates.findIndex(u => u.q === update.q && u.r === update.r);
        if (idx >= 0) this.pendingUpdates[idx] = update;
        else this.pendingUpdates.push(update);

        if (!this.sendTimer) {
          this.sendTimer = setTimeout(() => this.flushUpdates(), 200);
        }
      }

      async flushUpdates() {
        clearTimeout(this.sendTimer);
        this.sendTimer = null;
        if (this.pendingUpdates.length === 0) return;

        const batch = this.pendingUpdates.splice(0);
        this.setSyncStatus('syncing');

        try {
          const res = await fetch('/api/maps/' + MAP_ID + '/tiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tiles: batch })
          });
          const data = await res.json();
          if (data.version) this.version = data.version;
          this.setSyncStatus('ok');
        } catch {
          this.pendingUpdates.unshift(...batch);
          this.setSyncStatus('error');
        }
      }

      setSyncStatus(s) {
        const dot = document.getElementById('sync-dot');
        const txt = document.getElementById('sync-text');
        dot.className = 'sync-dot ' + (s === 'ok' ? 'ok' : 'syncing');
        txt.textContent = s === 'ok' ? 'Synced' : s === 'syncing' ? 'Saving...' : 'Offline';
      }

      async loadMap() {
        const res = await fetch('/api/maps/' + MAP_ID);
        const data = await res.json();
        if (!data.map) { location.href = '/dashboard'; return; }
        this.mapData = data.map;
        this.role = data.role;
        this.version = data.map.version;
        document.getElementById('map-name').value = data.map.name;
        if (this.role === 'view') {
          document.getElementById('bottom-toolbar').style.display = 'none';
          document.getElementById('map-name').readOnly = true;
        }
        this.loadVisibleTiles();
      }

      async loadVisibleTiles() {
        const s = this.hexSize * this.zoom;
        const minQ = Math.max(0, Math.floor((-this.offsetX) / (s * 1.5)) - 5);
        const maxQ = Math.min(999, Math.ceil((-this.offsetX + this.displayWidth) / (s * 1.5)) + 5);
        const minR = Math.max(0, Math.floor((-this.offsetY) / (s * Math.sqrt(3))) - 5);
        const maxR = Math.min(999, Math.ceil((-this.offsetY + this.displayHeight) / (s * Math.sqrt(3))) + 5);

        const res = await fetch('/api/maps/' + MAP_ID + '/tiles?minQ=' + minQ + '&maxQ=' + maxQ + '&minR=' + minR + '&maxR=' + maxR);
        const data = await res.json();
        for (const t of (data.tiles || [])) {
          this.tiles.set(t.q + ',' + t.r, { color: t.color, label: t.label, icon: t.icon });
        }
        this.updateHistoryButtons();
      }

      startSync() {
        setInterval(async () => {
          try {
            const res = await fetch('/api/maps/' + MAP_ID + '/changes?since=' + this.version);
            const data = await res.json();
            if (data.changes && data.changes.length > 0) {
              for (const c of data.changes) {
                const k = c.q + ',' + c.r;
                if (c.color || c.label) {
                  this.tiles.set(k, { color: c.color, label: c.label, icon: c.icon });
                } else {
                  this.tiles.delete(k);
                }
              }
            }
            if (data.version > this.version) this.version = data.version;
          } catch {}
        }, 2000);
      }
    }

    // ─── Text Modal ───
    function closeTextModal() {
      hexMap.closeTextModal();
    }

    function submitTextLabel() {
      hexMap.submitTextLabel();
    }

    // ─── TOC Modal ───
    function openTOCModal() {
      document.getElementById('toc-modal').style.display = 'flex';
      document.getElementById('toc-filter').value = '';
      renderTOC();
    }

    function closeTOCModal() {
      document.getElementById('toc-modal').style.display = 'none';
    }

    function renderTOC(filter = '') {
      const list = document.getElementById('toc-list');
      const items = [];

      for (const [key, tile] of hexMap.tiles) {
        const [q, r] = key.split(',').map(Number);
        const label = tile.label || '';
        const coordStr = q + ',' + r;

        if (filter && !label.toLowerCase().includes(filter.toLowerCase()) && !coordStr.includes(filter)) {
          continue;
        }

        items.push({ q, r, label, color: tile.color });
      }

      items.sort((a, b) => {
        if (a.label && !b.label) return -1;
        if (!a.label && b.label) return 1;
        return a.q - b.q || a.r - b.r;
      });

      if (items.length === 0) {
        list.innerHTML = '<p style="color:var(--text2);font-size:13px;padding:20px;text-align:center">No tiles found</p>';
        return;
      }

      list.innerHTML = items.map(item =>
        '<div class="toc-item" onclick="hexMap.panToHex(' + item.q + ',' + item.r + ');closeTOCModal();">' +
          (item.color ? '<div class="toc-item-color" style="background:' + esc(item.color) + '"></div>' : '<div class="toc-item-color" style="background:#e5e7eb"></div>') +
          '<div style="flex:1">' +
            '<div style="font-size:13px;font-weight:500">' + (item.label ? esc(item.label) : '<em style="color:var(--text2)">No label</em>') + '</div>' +
            '<div class="toc-item-coord">' + item.q + ', ' + item.r + '</div>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    function filterTOC() {
      const filter = document.getElementById('toc-filter').value.trim();
      renderTOC(filter);
    }

    // ─── Share Modal ───
    let shareMembers = [];

    function openShareModal() {
      document.getElementById('share-modal').style.display = 'flex';
      document.getElementById('share-search').value = '';
      document.getElementById('share-results').innerHTML = '';
      loadShareMembers();
    }

    function closeShareModal() {
      document.getElementById('share-modal').style.display = 'none';
    }

    async function loadShareMembers() {
      const res = await fetch('/api/maps/' + MAP_ID);
      const data = await res.json();
      shareMembers = data.members || [];
      renderShareMembers();
    }

    function renderShareMembers() {
      const el = document.getElementById('share-members');
      if (shareMembers.length === 0) {
        el.innerHTML = '<p style="color:var(--text2);font-size:12px">Not shared with anyone</p>';
        return;
      }
      el.innerHTML = shareMembers.map(m =>
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">' +
          '<span style="font-size:13px">' + esc(m.name) + ' <span style="color:var(--text2)">Server ' + esc(m.game_id || '?') + '</span></span>' +
          '<div style="display:flex;align-items:center;gap:6px">' +
            '<span class="badge ' + (m.permission === 'edit' ? 'badge-edit' : 'badge-view') + '">' + m.permission + '</span>' +
            '<button class="btn-icon btn-sm" onclick="removeMember(' + m.user_id + ')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    let searchDebounce;

    function searchShareUsers() {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(async () => {
        const q = document.getElementById('share-search').value.trim();
        if (q.length < 2) {
          document.getElementById('share-results').innerHTML = '';
          return;
        }
        const res = await fetch('/api/users/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        const results = document.getElementById('share-results');
        results.innerHTML = (data.users || []).map(u =>
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">' +
            '<span style="font-size:13px">' + esc(u.name) + ' <span style="color:var(--text2)">Server ' + esc(u.server_id || '?') + '</span></span>' +
            '<button class="btn btn-sm btn-primary" onclick="addMember(' + u.id + ')">Add</button>' +
          '</div>'
        ).join('') || '<p style="color:var(--text2);font-size:12px">No users found</p>';
      }, 300);
    }

    async function addMember(userId) {
      const perm = document.getElementById('share-perm').value;
      await fetch('/api/maps/' + MAP_ID + '/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, permission: perm })
      });
      document.getElementById('share-search').value = '';
      document.getElementById('share-results').innerHTML = '';
      await loadShareMembers();
    }

    async function removeMember(userId) {
      await fetch('/api/maps/' + MAP_ID + '/share/' + userId, { method: 'DELETE' });
      await loadShareMembers();
    }

    // ─── Init ───
    let hexMap;
    const canvas = document.getElementById('map-canvas');
    hexMap = new HexMap(canvas);
  <\/script>
  `, { user, noNav: true });
}
