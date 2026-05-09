export const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:         #f0f2f5;
  --bg2:        #ffffff;
  --bg3:        #f8fafc;
  --bg-hover:   #f1f5f9;
  --glass:      rgba(255,255,255,0.9);
  --glass-border: rgba(0,0,0,0.08);
  --glass-strong: rgba(255,255,255,0.95);
  --accent:     #3b82f6;
  --accent2:    #2563eb;
  --accent-d:   rgba(59,130,246,0.12);
  --text:       #1f2937;
  --text2:      #6b7280;
  --text3:      #9ca3af;
  --border:     rgba(0,0,0,0.08);
  --danger:     #ef4444;
  --success:    #22c55e;
  --warn:       #f59e0b;
  --r:          10px;
  --r2:         16px;
  --r3:         24px;
}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none;transition:color .15s}
a:hover{color:var(--accent2)}

button,.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:10px 20px;border:none;border-radius:var(--r);
  font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;
  transition:all .2s ease;
}
button:active,.btn:active{transform:scale(.97)}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{background:var(--accent2);box-shadow:0 4px 12px rgba(59,130,246,0.25)}
.btn-secondary{background:var(--bg2);color:var(--text);border:1px solid var(--border)}
.btn-secondary:hover{background:var(--bg-hover);border-color:rgba(0,0,0,0.12)}
.btn-danger{background:rgba(239,68,68,0.1);color:var(--danger);border:1px solid rgba(239,68,68,0.2)}
.btn-danger:hover{background:rgba(239,68,68,0.15)}
.btn-sm{padding:6px 12px;font-size:12px}
.btn-icon{width:36px;height:36px;padding:0;background:transparent;color:var(--text2);border-radius:var(--r)}
.btn-icon:hover{background:var(--bg-hover);color:var(--text)}

input,select,textarea{
  width:100%;background:var(--bg2);color:var(--text);
  border:1px solid var(--border);border-radius:var(--r);
  padding:10px 14px;font-size:14px;font-family:inherit;outline:none;
  transition:border-color .2s,background .2s,box-shadow .2s;
}
input:focus,select:focus,textarea:focus{
  border-color:var(--accent);background:var(--bg2);
  box-shadow:0 0 0 3px rgba(59,130,246,0.1);
}
input::placeholder{color:var(--text3)}

.nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;height:60px;
  background:var(--bg2);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);
  position:sticky;top:0;z-index:100;
}
.nav-brand{font-size:20px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px;letter-spacing:-0.3px}
.nav-brand span{color:var(--accent)}
.nav-user{display:flex;align-items:center;gap:14px}
.nav-user-name{color:var(--text2);font-size:13px;font-weight:500}
.nav-user img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid var(--border)}
.avatar{width:34px;height:34px;border-radius:50%;background:var(--accent-d);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;color:var(--accent)}

.glass{
  background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border:1px solid var(--glass-border);
  border-radius:var(--r2);
}
.glass-strong{
  background:var(--glass-strong);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);
  border:1px solid var(--border);border-radius:var(--r3);
}

.card{
  background:var(--bg2);backdrop-filter:blur(12px);
  border:1px solid var(--border);border-radius:var(--r2);
  padding:20px;transition:border-color .2s,transform .2s,box-shadow .2s;
}
.card:hover{border-color:rgba(0,0,0,0.12);box-shadow:0 4px 20px rgba(0,0,0,0.06)}

.modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.3);backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;z-index:1000;
}
.modal{
  background:var(--bg2);backdrop-filter:blur(20px);
  border:1px solid var(--border);border-radius:var(--r3);
  padding:28px;width:90%;max-width:480px;max-height:80vh;overflow-y:auto;
  box-shadow:0 20px 60px rgba(0,0,0,0.15);
}
.modal h3{margin-bottom:20px;font-size:18px;font-weight:600;color:var(--text)}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:24px}

.toast{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
  background:var(--bg2);backdrop-filter:blur(20px);
  color:var(--text);border:1px solid var(--border);
  padding:12px 24px;border-radius:var(--r2);font-size:13px;
  z-index:2000;animation:toastIn .3s ease-out;
  box-shadow:0 8px 32px rgba(0,0,0,0.12);
}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

.badge{display:inline-flex;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.3px}
.badge-owner{background:var(--accent-d);color:var(--accent)}
.badge-edit{background:rgba(34,197,94,0.1);color:var(--success)}
.badge-view{background:rgba(245,158,11,0.1);color:var(--warn)}

.spinner{width:20px;height:20px;border:2px solid rgba(0,0,0,0.1);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.empty-state{text-align:center;padding:80px 20px;color:var(--text2)}
.empty-state h3{margin-bottom:8px;color:var(--text);font-size:18px}
`;
