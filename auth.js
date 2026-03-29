// ─────────────────────────────────────────────
// TOP OF TALENT — Auth System v1.0
// localStorage-based demo. Swap DB calls for Firebase later.
// ─────────────────────────────────────────────
(function(){
'use strict';

// ── UTILS ──
function uid(){
  return 'TOT-'+Math.random().toString(36).substr(2,4).toUpperCase()+
         Math.random().toString(36).substr(2,4).toUpperCase();
}
function fanNum(){
  var n=Date.now().toString().slice(-6)+
    Math.floor(Math.random()*100).toString().padStart(2,'0');
  return '#'+n;
}
function today(){
  return new Date().toLocaleDateString('es-EC',{year:'numeric',month:'long',day:'numeric'});
}

// ── STORAGE ──
var USERS_KEY='tot_users';
var SESSION_KEY='tot_session';
function getUsers(){ try{return JSON.parse(localStorage.getItem(USERS_KEY)||'[]');}catch(e){return[];}}
function saveUsers(u){ localStorage.setItem(USERS_KEY,JSON.stringify(u)); }
function getSession(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY));}catch(e){return null;}}
function setSession(u){ localStorage.setItem(SESSION_KEY,JSON.stringify(u)); }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

// ── VALIDATION ──
function isStrongPwd(p){return p.length>=8 && /[A-Z]/.test(p) && /[0-9]/.test(p);}
function isValidEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}
function isValidUsername(u){return /^[a-zA-Z0-9_\.]{3,20}$/.test(u);}

// ── CSS ──
var css=`
/* AUTH SYSTEM STYLES */
.tot-auth *{box-sizing:border-box;margin:0;padding:0;cursor:none !important}
.tot-auth input,.tot-auth select,.tot-auth textarea{cursor:text !important}

/* User icon button — always visible */
#tot-user-btn{
  position:fixed;top:20px;right:40px;z-index:500;
  width:38px;height:38px;border-radius:50%;
  background:rgba(200,108,255,.15);
  border:1.5px solid rgba(200,108,255,.4);
  display:flex;align-items:center;justify-content:center;
  transition:background .2s,border-color .2s,transform .2s;
}
#tot-user-btn:hover{background:rgba(200,108,255,.25);border-color:#c86cff;transform:scale(1.05)}
#tot-user-btn svg{width:18px;height:18px;stroke:#c86cff;fill:none;stroke-width:1.8;stroke-linecap:round}
#tot-user-btn .tot-avatar-letter{
  font-family:Helvetica,Arial,sans-serif;font-weight:700;font-size:14px;
  color:#c86cff;display:none;
}
#tot-user-btn.logged-in .tot-avatar-letter{display:block}
#tot-user-btn.logged-in svg{display:none}
#tot-user-btn.logged-in{background:rgba(200,108,255,.2);border-color:#c86cff}

/* Dropdown */
#tot-dropdown{
  position:fixed;top:68px;right:40px;z-index:499;
  background:#111;border:1px solid rgba(200,108,255,.25);
  min-width:200px;
  opacity:0;transform:translateY(-8px) scale(.97);
  transition:opacity .2s,transform .2s;
  pointer-events:none;
}
#tot-dropdown.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}
.tot-dd-item{
  display:flex;align-items:center;gap:12px;
  padding:14px 20px;
  font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.75);
  border-bottom:1px solid rgba(255,255,255,.06);transition:background .15s,color .15s;
}
.tot-dd-item:last-child{border-bottom:none}
.tot-dd-item:hover{background:rgba(200,108,255,.1);color:#fff}
.tot-dd-item.danger{color:rgba(255,80,80,.7)}
.tot-dd-item.danger:hover{background:rgba(255,80,80,.1);color:#ff5050}
.tot-dd-sep{height:1px;background:rgba(255,255,255,.08);margin:0}
.tot-dd-user{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08)}
.tot-dd-uname{font-family:Helvetica,Arial,sans-serif;font-weight:700;font-size:13px;color:#fff}
.tot-dd-fan{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(200,108,255,.7);letter-spacing:.1em;margin-top:3px}

/* MODAL BACKDROP */
.tot-backdrop{
  position:fixed;inset:0;z-index:1000;
  background:rgba(0,0,0,.88);backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;
  opacity:0;transition:opacity .3s;pointer-events:none;
  padding:20px;
}
.tot-backdrop.open{opacity:1;pointer-events:all}

/* MODAL */
.tot-modal{
  background:#0d0d0d;border:1px solid rgba(200,108,255,.2);
  width:100%;max-width:480px;max-height:90vh;overflow-y:auto;
  transform:translateY(20px) scale(.97);
  transition:transform .35s cubic-bezier(.68,-.05,.27,1.05);
  position:relative;
}
.tot-backdrop.open .tot-modal{transform:translateY(0) scale(1)}
.tot-modal::-webkit-scrollbar{width:4px}
.tot-modal::-webkit-scrollbar-track{background:#111}
.tot-modal::-webkit-scrollbar-thumb{background:#c86cff44}

/* Modal header */
.tot-mh{
  padding:28px 28px 20px;
  border-bottom:1px solid rgba(255,255,255,.06);
  display:flex;align-items:flex-start;justify-content:space-between;
}
.tot-mh-left{}
.tot-mh-eyebrow{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.35em;color:#c86cff;text-transform:uppercase;margin-bottom:6px}
.tot-mh-title{font-family:Helvetica,Arial,sans-serif;font-weight:700;font-size:clamp(22px,4vw,30px);color:#fff;letter-spacing:-.02em}
.tot-close{background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;line-height:1;transition:color .2s;padding:4px}
.tot-close:hover{color:#fff}

/* Modal body */
.tot-mb{padding:24px 28px}

/* Steps */
.tot-steps{display:flex;gap:6px;margin-bottom:24px}
.tot-step{height:3px;flex:1;background:rgba(255,255,255,.1);transition:background .3s}
.tot-step.done{background:#c86cff}
.tot-step.active{background:rgba(200,108,255,.5)}

/* Section */
.tot-section{display:none}
.tot-section.active{display:block}

/* Labels */
.tot-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.28em;color:rgba(255,255,255,.4);text-transform:uppercase;display:block;margin-bottom:7px}

/* Inputs */
.tot-input{
  width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  color:#fff;font-family:'JetBrains Mono',monospace;font-size:13px;
  padding:13px 16px;margin-bottom:16px;outline:none;
  transition:border-color .2s;
}
.tot-input:focus{border-color:#c86cff;background:rgba(200,108,255,.05)}
.tot-input.error{border-color:#ff5050}
.tot-input::placeholder{color:rgba(255,255,255,.2)}

/* Select */
.tot-select{
  width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  color:#fff;font-family:'JetBrains Mono',monospace;font-size:13px;
  padding:13px 16px;margin-bottom:16px;outline:none;
  transition:border-color .2s;appearance:none;
}
.tot-select:focus{border-color:#c86cff}
.tot-select option{background:#111;color:#fff}

/* Error msg */
.tot-err{font-family:'JetBrains Mono',monospace;font-size:10px;color:#ff5050;letter-spacing:.05em;margin:-10px 0 14px;display:none}
.tot-err.show{display:block}

/* Hint */
.tot-hint{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.05em;margin:-10px 0 14px}

/* Success badge */
.tot-badge{
  background:rgba(200,108,255,.08);border:1px solid rgba(200,108,255,.25);
  padding:12px 16px;margin-bottom:14px;
  font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(200,108,255,.8);
  letter-spacing:.08em;display:flex;align-items:center;gap:10px;
}
.tot-badge-val{color:#c86cff;font-weight:700;font-size:13px}

/* Output fields (read only) */
.tot-output{
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
  padding:12px 16px;margin-bottom:12px;
}
.tot-output-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.28em;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:4px}
.tot-output-val{font-family:'JetBrains Mono',monospace;font-size:13px;color:#fff}
.tot-output-val.purple{color:#c86cff}

/* Buttons */
.tot-btn{
  width:100%;background:#fff;color:#000;
  font-family:Helvetica,Arial,sans-serif;font-weight:700;font-size:11px;
  letter-spacing:.2em;text-transform:uppercase;border:none;
  padding:15px;margin-top:8px;transition:background .2s,color .2s;
  display:flex;align-items:center;justify-content:center;gap:10px;
}
.tot-btn:hover{background:#c86cff;color:#fff}
.tot-btn.ghost{background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.15);margin-top:6px}
.tot-btn.ghost:hover{border-color:#c86cff;color:#c86cff;background:transparent}
.tot-btn.danger-btn{background:rgba(255,80,80,.1);color:#ff5050;border:1px solid rgba(255,80,80,.3);margin-top:24px}
.tot-btn.danger-btn:hover{background:#ff5050;color:#fff}
.tot-btn.success{background:linear-gradient(135deg,#c86cff,#3fa9ff);color:#fff}
.tot-btn.success:hover{opacity:.9}

/* Social providers */
.tot-providers{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.tot-provider{
  display:flex;align-items:center;gap:14px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  padding:14px 18px;transition:border-color .2s,background .2s;
  font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;
  color:#fff;letter-spacing:.02em;
}
.tot-provider:hover{border-color:#c86cff;background:rgba(200,108,255,.07)}
.tot-provider-icon{width:22px;height:22px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px}
.tot-divider{display:flex;align-items:center;gap:12px;margin:20px 0}
.tot-divider::before,.tot-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08)}
.tot-divider span{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.2em;color:rgba(255,255,255,.25);text-transform:uppercase}

/* T&C */
.tot-tc{
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
  padding:16px;max-height:140px;overflow-y:auto;margin-bottom:16px;
}
.tot-tc::-webkit-scrollbar{width:3px}
.tot-tc::-webkit-scrollbar-thumb{background:#c86cff44}
.tot-tc p{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.8;color:rgba(255,255,255,.4);margin-bottom:10px}
.tot-tc p:last-child{margin-bottom:0}
.tot-checkbox-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
.tot-checkbox-row input[type=checkbox]{
  width:16px;height:16px;flex-shrink:0;margin-top:2px;
  accent-color:#c86cff;
}
.tot-checkbox-label{font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6;color:rgba(255,255,255,.6)}
.tot-checkbox-label a{color:#c86cff;text-decoration:none}

/* Notifications toggle */
.tot-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.tot-toggle-row:last-child{border-bottom:none}
.tot-toggle-info{}
.tot-toggle-title{font-family:Helvetica,Arial,sans-serif;font-weight:700;font-size:13px;color:#fff;margin-bottom:3px}
.tot-toggle-desc{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.05em}
.tot-toggle{position:relative;width:40px;height:22px;flex-shrink:0}
.tot-toggle input{opacity:0;width:0;height:0;position:absolute}
.tot-toggle-slider{
  position:absolute;inset:0;background:rgba(255,255,255,.1);
  border-radius:11px;transition:background .2s;
}
.tot-toggle-slider::after{
  content:'';position:absolute;left:3px;top:3px;
  width:16px;height:16px;background:#fff;border-radius:50%;
  transition:transform .2s;
}
.tot-toggle input:checked + .tot-toggle-slider{background:#c86cff}
.tot-toggle input:checked + .tot-toggle-slider::after{transform:translateX(18px)}

/* Profile tabs */
.tot-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:24px}
.tot-tab{
  padding:12px 20px;font-family:'JetBrains Mono',monospace;font-size:10px;
  letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.35);
  border-bottom:2px solid transparent;transition:color .2s,border-color .2s;
  flex:1;text-align:center;
}
.tot-tab.active{color:#c86cff;border-bottom-color:#c86cff}
.tot-tab:hover:not(.active){color:rgba(255,255,255,.6)}

/* Success screen */
.tot-success{text-align:center;padding:20px 0}
.tot-success-icon{
  width:72px;height:72px;border-radius:50%;
  background:rgba(200,108,255,.1);border:2px solid rgba(200,108,255,.3);
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 24px;font-size:32px;
}
.tot-success-title{font-family:Helvetica,Arial,sans-serif;font-weight:700;font-size:clamp(20px,4vw,28px);color:#fff;letter-spacing:-.02em;margin-bottom:10px}
.tot-success-sub{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.4);letter-spacing:.08em;line-height:1.7}

/* Delete confirm */
.tot-delete-warn{
  background:rgba(255,80,80,.07);border:1px solid rgba(255,80,80,.25);
  padding:16px;margin-bottom:20px;
}
.tot-delete-warn p{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,100,100,.8);line-height:1.7}
.tot-delete-warn strong{color:#ff5050;font-weight:700}

/* Password strength */
.tot-pwd-meter{display:flex;gap:4px;margin:-8px 0 14px}
.tot-pwd-bar{height:3px;flex:1;background:rgba(255,255,255,.1);transition:background .3s}
.tot-pwd-bar.weak{background:#ff5050}
.tot-pwd-bar.medium{background:#ffaa00}
.tot-pwd-bar.strong{background:#4cff91}
.tot-pwd-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.15em;margin-bottom:14px}


/* Welcome toast */
#tot-toast{
  position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-20px);
  z-index:10000;
  background:linear-gradient(135deg,#c86cff,#3fa9ff);
  color:#fff;
  font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;
  font-weight:700;font-size:13px;letter-spacing:.12em;text-transform:uppercase;
  padding:14px 32px;
  opacity:0;
  transition:opacity .4s,transform .4s;
  pointer-events:none;
  white-space:nowrap;
}
#tot-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* Responsive */
@media(max-width:600px){
  .tot-modal{max-width:100%;border-left:none;border-right:none}
  #tot-user-btn{right:20px;top:18px}
  #tot-dropdown{right:20px}
}
`;

// ── INJECT CSS ──
var styleEl=document.createElement('style');
styleEl.textContent=css;
document.head.appendChild(styleEl);

// ── HTML TEMPLATES ──
var HTML=`
<div class="tot-auth">

<!-- USER BUTTON -->
<button id="tot-user-btn" onclick="TotAuth.toggleDropdown()" title="Mi cuenta">
  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
  <span class="tot-avatar-letter" id="tot-avatar-letter">?</span>
</button>

<!-- DROPDOWN -->
<div id="tot-dropdown">
  <!-- logged out -->
  <div id="tot-dd-out">
    <div class="tot-dd-item" onclick="TotAuth.openLogin()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      Iniciar Sesión
    </div>
    <div class="tot-dd-item" onclick="TotAuth.openRegister()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      Registrarse
    </div>
  </div>
  <!-- logged in -->
  <div id="tot-dd-in" style="display:none">
    <div class="tot-dd-user">
      <div class="tot-dd-uname" id="tot-dd-uname">–</div>
      <div class="tot-dd-fan" id="tot-dd-fan">Fan #–</div>
    </div>
    <div class="tot-dd-item" onclick="TotAuth.openProfile('account')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      Mi Cuenta
    </div>
    <div class="tot-dd-item" onclick="TotAuth.openProfile('notifications')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      Notificaciones
    </div>
    <div class="tot-dd-sep"></div>
    <div class="tot-dd-item danger" onclick="TotAuth.logout()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Cerrar Sesión
    </div>
  </div>
</div>

<!-- ══ REGISTER MODAL ══ -->
<div class="tot-backdrop" id="tot-reg-backdrop" onclick="TotAuth.closeOnBg(event,'tot-reg-backdrop')">
<div class="tot-modal tot-auth">
  <div class="tot-mh">
    <div class="tot-mh-left">
      <div class="tot-mh-eyebrow">Top of Talent</div>
      <div class="tot-mh-title" id="reg-title">Registrarse</div>
    </div>
    <button class="tot-close" onclick="TotAuth.closeRegister()">✕</button>
  </div>
  <div class="tot-mb">
    <div class="tot-steps">
      <div class="tot-step active" id="reg-s1"></div>
      <div class="tot-step" id="reg-s2"></div>
      <div class="tot-step" id="reg-s3"></div>
      <div class="tot-step" id="reg-s4"></div>
    </div>

    <!-- Step 1: Choose method -->
    <div class="tot-section active" id="reg-step1">
      <div class="tot-providers">
        <div class="tot-provider" onclick="TotAuth.socialReg('Google')">
          <div class="tot-provider-icon">🇬</div>Continuar con Google
        </div>
        <div class="tot-provider" onclick="TotAuth.socialReg('Apple')">
          <div class="tot-provider-icon">🍎</div>Continuar con Apple
        </div>
        <div class="tot-provider" onclick="TotAuth.socialReg('Facebook')">
          <div class="tot-provider-icon">ƒ</div>Continuar con Facebook
        </div>
        <div class="tot-provider" onclick="TotAuth.socialReg('X')">
          <div class="tot-provider-icon">𝕏</div>Continuar con X
        </div>
      </div>
      <div class="tot-divider"><span>o regístrate con email</span></div>
      <button class="tot-btn ghost" onclick="TotAuth.goRegEmail()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        Registrarse con Email
      </button>
    </div>

    <!-- Step 2a: Social (auto-fill) -->
    <div class="tot-section" id="reg-step2a">
      <div id="reg-social-badge" class="tot-badge">
        <span>Conectado con</span>
        <span class="tot-badge-val" id="reg-social-name">Google</span>
      </div>
      <label class="tot-label">Nombre de usuario</label>
      <input class="tot-input" id="reg-s2a-user" placeholder="ej. top_fan_01" oninput="TotAuth.checkUsername(this)">
      <div class="tot-err" id="reg-s2a-user-err">Nombre de usuario no disponible o inválido</div>
      <div class="tot-hint">Solo letras, números, _ y . (3–20 chars)</div>
      <label class="tot-label">País / Región</label>
      <select class="tot-select" id="reg-s2a-country">
        <option value="">Selecciona…</option>
        <option value="EC">Ecuador 🇪🇨</option>
        <option value="CO">Colombia 🇨🇴</option>
        <option value="PE">Perú 🇵🇪</option>
        <option value="CL">Chile 🇨🇱</option>
        <option value="AR">Argentina 🇦🇷</option>
        <option value="MX">México 🇲🇽</option>
        <option value="US">Estados Unidos 🇺🇸</option>
        <option value="ES">España 🇪🇸</option>
        <option value="OTHER">Otro</option>
      </select>
      <button class="tot-btn" onclick="TotAuth.goTC()">Continuar →</button>
      <button class="tot-btn ghost" onclick="TotAuth.backToStep1()">← Volver</button>
    </div>

    <!-- Step 2b: Email form -->
    <div class="tot-section" id="reg-step2b">
      <label class="tot-label">Nombre</label>
      <input class="tot-input" id="reg-first" placeholder="Tu nombre">
      <label class="tot-label">Apellido</label>
      <input class="tot-input" id="reg-last" placeholder="Tu apellido">
      <label class="tot-label">Email</label>
      <input class="tot-input" id="reg-email" type="email" placeholder="tu@email.com">
      <div class="tot-err" id="reg-email-err">Email inválido o ya registrado</div>
      <label class="tot-label">Nombre de usuario</label>
      <input class="tot-input" id="reg-user" placeholder="ej. top_fan_01" oninput="TotAuth.checkUsername(this)">
      <div class="tot-err" id="reg-user-err">Nombre de usuario no disponible o inválido</div>
      <div class="tot-hint">Solo letras, números, _ y . (3–20 chars)</div>
      <label class="tot-label">Contraseña</label>
      <input class="tot-input" id="reg-pwd" type="password" placeholder="Mínimo 8 chars, 1 mayúscula, 1 número" oninput="TotAuth.checkPwd(this)">
      <div class="tot-pwd-meter"><div class="tot-pwd-bar" id="pb1"></div><div class="tot-pwd-bar" id="pb2"></div><div class="tot-pwd-bar" id="pb3"></div></div>
      <div class="tot-pwd-label" id="pwd-label" style="color:rgba(255,255,255,.25)">Seguridad de contraseña</div>
      <div class="tot-err" id="reg-pwd-err">Contraseña débil: mínimo 8 caracteres, 1 mayúscula, 1 número</div>
      <label class="tot-label">País / Región</label>
      <select class="tot-select" id="reg-country">
        <option value="">Selecciona…</option>
        <option value="EC">Ecuador 🇪🇨</option>
        <option value="CO">Colombia 🇨🇴</option>
        <option value="PE">Perú 🇵🇪</option>
        <option value="CL">Chile 🇨🇱</option>
        <option value="AR">Argentina 🇦🇷</option>
        <option value="MX">México 🇲🇽</option>
        <option value="US">Estados Unidos 🇺🇸</option>
        <option value="ES">España 🇪🇸</option>
        <option value="OTHER">Otro</option>
      </select>
      <button class="tot-btn" onclick="TotAuth.submitEmailReg()">Continuar →</button>
      <button class="tot-btn ghost" onclick="TotAuth.backToStep1()">← Volver</button>
    </div>

    <!-- Step 3: T&C -->
    <div class="tot-section" id="reg-step3">
      <div class="tot-tc">
        <p><strong style="color:rgba(255,255,255,.7)">Términos y Condiciones de Top of Talent</strong></p>
        <p>Al registrarte en Top of Talent aceptas nuestros términos de servicio y política de privacidad. Nos reservamos el derecho de modificar estos términos con previo aviso.</p>
        <p>El contenido de la plataforma es de uso personal y no comercial. Está prohibida la reproducción sin autorización expresa de Top of Talent.</p>
        <p>Tu información personal será tratada conforme a nuestra política de privacidad y no será vendida a terceros.</p>
        <p>Top of Talent puede enviar comunicaciones relacionadas con tu cuenta y actualizaciones de la plataforma según tus preferencias de notificación.</p>
        <p>© 2025 Top of Talent. Todos los derechos reservados. Ecuador.</p>
      </div>
      <div class="tot-checkbox-row">
        <input type="checkbox" id="tc1" onchange="TotAuth.checkTC()">
        <label class="tot-checkbox-label" for="tc1">Acepto los <a href="#">Términos y Condiciones</a> y la <a href="#">Política de Privacidad</a></label>
      </div>
      <div class="tot-checkbox-row">
        <input type="checkbox" id="tc2" onchange="TotAuth.checkTC()">
        <label class="tot-checkbox-label" for="tc2">Confirmo que soy mayor de 13 años</label>
      </div>
      <div class="tot-checkbox-row">
        <input type="checkbox" id="tc3">
        <label class="tot-checkbox-label" for="tc3">Acepto recibir notificaciones y comunicaciones de Top of Talent (opcional)</label>
      </div>
      <button class="tot-btn" id="tc-btn" onclick="TotAuth.completeRegistration()" disabled style="opacity:.4">Crear cuenta</button>
    </div>

    <!-- Step 4: Success -->
    <div class="tot-section" id="reg-step4">
      <div class="tot-success">
        <div class="tot-success-icon">✓</div>
        <div class="tot-success-title">Sign Up Complete</div>
        <div class="tot-success-sub">Bienvenido a Top of Talent.<br>Tu cuenta ha sido creada exitosamente.</div>
      </div>
      <div class="tot-output" id="out-fan"><div class="tot-output-label">Tu número de fan</div><div class="tot-output-val purple" id="out-fan-val">–</div></div>
      <div class="tot-output" id="out-user"><div class="tot-output-label">Nombre de usuario</div><div class="tot-output-val" id="out-user-val">–</div></div>
      <div class="tot-output" id="out-date"><div class="tot-output-label">Fecha de creación</div><div class="tot-output-val" id="out-date-val">–</div></div>
      <button class="tot-btn success" onclick="TotAuth.closeRegister()">Entrar a Top of Talent →</button>
    </div>
  </div>
</div>
</div>

<!-- ══ LOGIN MODAL ══ -->
<div class="tot-backdrop" id="tot-log-backdrop" onclick="TotAuth.closeOnBg(event,'tot-log-backdrop')">
<div class="tot-modal tot-auth">
  <div class="tot-mh">
    <div class="tot-mh-left">
      <div class="tot-mh-eyebrow">Top of Talent</div>
      <div class="tot-mh-title">Iniciar Sesión</div>
    </div>
    <button class="tot-close" onclick="TotAuth.closeLogin()">✕</button>
  </div>
  <div class="tot-mb">
    <div class="tot-providers">
      <div class="tot-provider" onclick="TotAuth.socialLogin('Google')">
        <div class="tot-provider-icon">🇬</div>Continuar con Google
      </div>
      <div class="tot-provider" onclick="TotAuth.socialLogin('Apple')">
        <div class="tot-provider-icon">🍎</div>Continuar con Apple
      </div>
      <div class="tot-provider" onclick="TotAuth.socialLogin('Facebook')">
        <div class="tot-provider-icon">ƒ</div>Continuar con Facebook
      </div>
      <div class="tot-provider" onclick="TotAuth.socialLogin('X')">
        <div class="tot-provider-icon">𝕏</div>Continuar con X
      </div>
    </div>
    <div class="tot-divider"><span>o con tu email</span></div>
    <label class="tot-label">Email</label>
    <input class="tot-input" id="log-email" type="email" placeholder="tu@email.com">
    <label class="tot-label">Contraseña</label>
    <input class="tot-input" id="log-pwd" type="password" placeholder="Tu contraseña">
    <div class="tot-err" id="log-err">Email o contraseña incorrectos</div>
    <button class="tot-btn" onclick="TotAuth.submitLogin()">Iniciar Sesión →</button>
    <button class="tot-btn ghost" onclick="TotAuth.closeLogin();TotAuth.openRegister()">¿No tienes cuenta? Regístrate</button>
  </div>
</div>
</div>

<!-- ══ PROFILE MODAL ══ -->
<div class="tot-backdrop" id="tot-prof-backdrop" onclick="TotAuth.closeOnBg(event,'tot-prof-backdrop')">
<div class="tot-modal tot-auth">
  <div class="tot-mh">
    <div class="tot-mh-left">
      <div class="tot-mh-eyebrow" id="prof-eyebrow">Mi Cuenta</div>
      <div class="tot-mh-title" id="prof-title">Perfil</div>
    </div>
    <button class="tot-close" onclick="TotAuth.closeProfile()">✕</button>
  </div>
  <div class="tot-mb">
    <div class="tot-tabs">
      <div class="tot-tab active" id="tab-account" onclick="TotAuth.switchTab('account')">Cuenta</div>
      <div class="tot-tab" id="tab-notifications" onclick="TotAuth.switchTab('notifications')">Avisos</div>
      <div class="tot-tab" id="tab-tc" onclick="TotAuth.switchTab('tc')">T&C</div>
    </div>

    <!-- Account tab -->
    <div class="tot-section active" id="tab-panel-account">
      <div class="tot-output"><div class="tot-output-label">Número de Fan</div><div class="tot-output-val purple" id="prof-fan">–</div></div>
      <div class="tot-output"><div class="tot-output-label">Miembro desde</div><div class="tot-output-val" id="prof-date">–</div></div>
      <label class="tot-label" style="margin-top:16px">Nombre</label>
      <input class="tot-input" id="prof-first" placeholder="Tu nombre">
      <label class="tot-label">Apellido</label>
      <input class="tot-input" id="prof-last" placeholder="Tu apellido">
      <label class="tot-label">Nombre de usuario</label>
      <input class="tot-input" id="prof-user" placeholder="username">
      <label class="tot-label">País / Región</label>
      <select class="tot-select" id="prof-country">
        <option value="">Selecciona…</option>
        <option value="EC">Ecuador 🇪🇨</option>
        <option value="CO">Colombia 🇨🇴</option>
        <option value="PE">Perú 🇵🇪</option>
        <option value="CL">Chile 🇨🇱</option>
        <option value="AR">Argentina 🇦🇷</option>
        <option value="MX">México 🇲🇽</option>
        <option value="US">Estados Unidos 🇺🇸</option>
        <option value="ES">España 🇪🇸</option>
        <option value="OTHER">Otro</option>
      </select>
      <button class="tot-btn" onclick="TotAuth.saveProfile()">Guardar Cambios</button>
      <div class="tot-err show" id="prof-saved" style="color:#4cff91;display:none">✓ Cambios guardados</div>

      <button class="tot-btn danger-btn" onclick="TotAuth.showDeleteConfirm()">⚠ Eliminar Cuenta</button>

      <!-- Delete confirm -->
      <div id="delete-confirm" style="display:none;margin-top:16px">
        <div class="tot-delete-warn">
          <p><strong>POR FAVOR LEE ANTES DE CONTINUAR</strong><br><br>
          Esta acción es <strong>irreversible</strong>. Al eliminar tu cuenta perderás:<br>
          • Tu número de fan único<br>
          • Todo tu historial en la plataforma<br>
          • Acceso a funciones exclusivas<br><br>
          ¿Estás completamente seguro?</p>
        </div>
        <label class="tot-label">Escribe <strong style="color:#ff5050">ELIMINAR</strong> para confirmar</label>
        <input class="tot-input" id="delete-confirm-input" placeholder="ELIMINAR">
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="tot-btn danger-btn" style="flex:1;margin-top:0" onclick="TotAuth.deleteAccount()">Eliminar para siempre</button>
          <button class="tot-btn ghost" style="flex:1;margin-top:0" onclick="TotAuth.cancelDelete()">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Notifications tab -->
    <div class="tot-section" id="tab-panel-notifications">
      <div class="tot-toggle-row">
        <div class="tot-toggle-info">
          <div class="tot-toggle-title">Notificaciones por Email</div>
          <div class="tot-toggle-desc">Actualizaciones importantes de tu cuenta</div>
        </div>
        <label class="tot-toggle"><input type="checkbox" id="notif-email" checked><div class="tot-toggle-slider"></div></label>
      </div>
      <div class="tot-toggle-row">
        <div class="tot-toggle-info">
          <div class="tot-toggle-title">Nuevos Rankings</div>
          <div class="tot-toggle-desc">Cuando se actualiza el Top 7 semanal</div>
        </div>
        <label class="tot-toggle"><input type="checkbox" id="notif-rankings" checked><div class="tot-toggle-slider"></div></label>
      </div>
      <div class="tot-toggle-row">
        <div class="tot-toggle-info">
          <div class="tot-toggle-title">Nuevos Artistas</div>
          <div class="tot-toggle-desc">Cuando se agrega un artista a la plataforma</div>
        </div>
        <label class="tot-toggle"><input type="checkbox" id="notif-artists"><div class="tot-toggle-slider"></div></label>
      </div>
      <div class="tot-toggle-row">
        <div class="tot-toggle-info">
          <div class="tot-toggle-title">Eventos</div>
          <div class="tot-toggle-desc">Nuevos eventos y festivales agregados</div>
        </div>
        <label class="tot-toggle"><input type="checkbox" id="notif-events" checked><div class="tot-toggle-slider"></div></label>
      </div>
      <div class="tot-toggle-row">
        <div class="tot-toggle-info">
          <div class="tot-toggle-title">Marketing y Novedades</div>
          <div class="tot-toggle-desc">Promociones y comunicaciones comerciales</div>
        </div>
        <label class="tot-toggle"><input type="checkbox" id="notif-marketing"><div class="tot-toggle-slider"></div></label>
      </div>
      <button class="tot-btn" style="margin-top:20px" onclick="TotAuth.saveNotifications()">Guardar Preferencias</button>
    </div>

    <!-- T&C tab -->
    <div class="tot-section" id="tab-panel-tc">
      <div class="tot-tc" style="max-height:280px">
        <p><strong style="color:rgba(255,255,255,.7)">Términos y Condiciones de Top of Talent</strong></p>
        <p>Al registrarte en Top of Talent aceptas nuestros términos de servicio y política de privacidad.</p>
        <p>El contenido de la plataforma es de uso personal y no comercial. Está prohibida la reproducción sin autorización expresa de Top of Talent.</p>
        <p>Tu información personal será tratada conforme a nuestra política de privacidad y no será vendida a terceros.</p>
        <p>Top of Talent puede enviar comunicaciones relacionadas con tu cuenta y actualizaciones de la plataforma según tus preferencias de notificación.</p>
        <p><strong style="color:rgba(255,255,255,.5)">Política de Privacidad</strong></p>
        <p>Recopilamos únicamente la información necesaria para operar la plataforma. No compartimos datos personales con terceros sin tu consentimiento explícito.</p>
        <p>Puedes solicitar la eliminación de tus datos en cualquier momento desde la configuración de tu cuenta.</p>
        <p>© 2025 Top of Talent. Todos los derechos reservados. Ecuador.</p>
      </div>
      <p style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.08em;line-height:1.7;margin-top:16px">
        Última actualización: Enero 2025<br>
        Contacto: contactoftalent@gmail.com
      </p>
    </div>
  </div>
</div>
</div>

</div>
`;

// ── INJECT HTML ──
var wrapper=document.createElement('div');
wrapper.innerHTML=HTML;
document.body.insertBefore(wrapper,document.body.firstChild);

// ── STATE ──
var _regProvider=null;
var _pendingUser={};

// ── PUBLIC API ──
window.TotAuth={

  // ── DROPDOWN ──
  toggleDropdown:function(){
    var dd=document.getElementById('tot-dropdown');
    dd.classList.toggle('open');
    // close on outside click
    if(dd.classList.contains('open')){
      setTimeout(function(){
        document.addEventListener('click',TotAuth._closeDD,{once:true});
      },10);
    }
  },
  _closeDD:function(e){
    if(!e.target.closest('#tot-dropdown')&&!e.target.closest('#tot-user-btn')){
      document.getElementById('tot-dropdown').classList.remove('open');
    }
  },


  // ── TOAST ──
  showToast:function(msg){
    var t=document.getElementById('tot-toast');
    if(!t)return;
    t.textContent=msg;
    t.classList.add('show');
    setTimeout(function(){t.classList.remove('show');},3200);
  },
  // ── REGISTER ──
  openRegister:function(){
    document.getElementById('tot-dropdown').classList.remove('open');
    TotAuth._resetRegister();
    document.getElementById('tot-reg-backdrop').classList.add('open');
  },
  closeRegister:function(){
    document.getElementById('tot-reg-backdrop').classList.remove('open');
    TotAuth._updateUserBtn();
  },
  _resetRegister:function(){
    TotAuth._showRegStep(1);
    _pendingUser={};
    _regProvider=null;
    ['reg-first','reg-last','reg-email','reg-user','reg-pwd','reg-s2a-user'].forEach(function(id){
      var el=document.getElementById(id);if(el)el.value='';
    });
    ['reg-email-err','reg-user-err','reg-pwd-err','reg-s2a-user-err'].forEach(function(id){
      var el=document.getElementById(id);if(el)el.classList.remove('show');
    });
    document.getElementById('tc1').checked=false;
    document.getElementById('tc2').checked=false;
    document.getElementById('tc3').checked=false;
    document.getElementById('tc-btn').disabled=true;
    document.getElementById('tc-btn').style.opacity='.4';
  },
  _showRegStep:function(n){
    for(var i=1;i<=4;i++){
      var sec=document.getElementById('reg-step'+i) ||
              document.getElementById('reg-step'+i+'a') ||
              document.getElementById('reg-step'+i+'b');
    }
    // hide all
    ['reg-step1','reg-step2a','reg-step2b','reg-step3','reg-step4'].forEach(function(id){
      var el=document.getElementById(id);
      if(el){el.classList.remove('active');}
    });
    // steps bar
    for(var s=1;s<=4;s++){
      var bar=document.getElementById('reg-s'+s);
      if(!bar)continue;
      bar.classList.remove('active','done');
      if(s<n)bar.classList.add('done');
      else if(s===n)bar.classList.add('active');
    }
    // titles
    var titles=['Registrarse','Información','Términos','Completo'];
    document.getElementById('reg-title').textContent=titles[n-1]||'Registrarse';
  },

  socialReg:function(provider){
    _regProvider=provider;
    document.getElementById('reg-social-name').textContent=provider;
    _pendingUser={provider:provider,fanNum:fanNum(),createdAt:today()};
    TotAuth._showRegStep(2);
    document.getElementById('reg-step2a').classList.add('active');
  },
  goRegEmail:function(){
    TotAuth._showRegStep(2);
    document.getElementById('reg-step2b').classList.add('active');
  },
  backToStep1:function(){
    TotAuth._showRegStep(1);
    document.getElementById('reg-step1').classList.add('active');
  },
  submitEmailReg:function(){
    var first=document.getElementById('reg-first').value.trim();
    var last=document.getElementById('reg-last').value.trim();
    var email=document.getElementById('reg-email').value.trim();
    var user=document.getElementById('reg-user').value.trim();
    var pwd=document.getElementById('reg-pwd').value;
    var country=document.getElementById('reg-country').value;
    var ok=true;
    if(!isValidEmail(email)||TotAuth._emailExists(email)){
      document.getElementById('reg-email-err').classList.add('show');ok=false;
    } else {document.getElementById('reg-email-err').classList.remove('show');}
    if(!isValidUsername(user)||TotAuth._userExists(user)){
      document.getElementById('reg-user-err').classList.add('show');ok=false;
    } else {document.getElementById('reg-user-err').classList.remove('show');}
    if(!isStrongPwd(pwd)){
      document.getElementById('reg-pwd-err').classList.add('show');ok=false;
    } else {document.getElementById('reg-pwd-err').classList.remove('show');}
    if(!first||!last||!country)ok=false;
    if(!ok)return;
    _pendingUser={provider:'email',firstName:first,lastName:last,email:email,username:user,password:pwd,country:country,fanNum:fanNum(),createdAt:today()};
    TotAuth.goTC();
  },
  goTC:function(){
    var user=document.getElementById('reg-s2a-user')?document.getElementById('reg-s2a-user').value.trim():'';
    var country=document.getElementById('reg-s2a-country')?document.getElementById('reg-s2a-country').value:'';
    if(_regProvider&&(!user||!country)){alert('Completa todos los campos');return;}
    if(_regProvider){
      if(!isValidUsername(user)||TotAuth._userExists(user)){
        document.getElementById('reg-s2a-user-err').classList.add('show');return;
      }
      document.getElementById('reg-s2a-user-err').classList.remove('show');
      _pendingUser.username=user;_pendingUser.country=country;
      _pendingUser.email=_regProvider.toLowerCase()+'_'+Date.now()+'@social.tot';
      _pendingUser.firstName=_regProvider+' User';_pendingUser.lastName='';
    }
    TotAuth._showRegStep(3);
    document.getElementById('reg-step3').classList.add('active');
  },
  checkTC:function(){
    var ok=document.getElementById('tc1').checked&&document.getElementById('tc2').checked;
    document.getElementById('tc-btn').disabled=!ok;
    document.getElementById('tc-btn').style.opacity=ok?'1':'.4';
  },
  completeRegistration:function(){
    var users=getUsers();
    var newUser=Object.assign({id:uid()},_pendingUser);
    users.push(newUser);
    saveUsers(users);
    setSession(newUser);
    // fill success screen
    document.getElementById('out-fan-val').textContent=newUser.fanNum;
    document.getElementById('out-user-val').textContent='@'+newUser.username;
    document.getElementById('out-date-val').textContent=newUser.createdAt;
    TotAuth._showRegStep(4);
    document.getElementById('reg-step4').classList.add('active');
    TotAuth._updateUserBtn();
    setTimeout(function(){TotAuth.showToast('Bienvenido, @'+newUser.username+'!');},400);
  },

  // ── LOGIN ──
  openLogin:function(){
    document.getElementById('tot-dropdown').classList.remove('open');
    document.getElementById('log-email').value='';
    document.getElementById('log-pwd').value='';
    document.getElementById('log-err').classList.remove('show');
    document.getElementById('tot-log-backdrop').classList.add('open');
  },
  closeLogin:function(){document.getElementById('tot-log-backdrop').classList.remove('open');},
  socialLogin:function(provider){
    // Find social user or simulate
    var users=getUsers();
    var found=users.find(function(u){return u.provider===provider;});
    if(found){setSession(found);TotAuth.closeLogin();TotAuth._updateUserBtn();TotAuth.showToast('Bienvenido, @'+found.username+'!');}
    else{
      // simulate social login — create account automatically
      var u={id:uid(),provider:provider,firstName:provider,lastName:'User',
        email:provider.toLowerCase()+'_'+Date.now()+'@social.tot',
        username:provider.toLowerCase()+'_'+Math.floor(Math.random()*9999),
        country:'EC',fanNum:fanNum(),createdAt:today(),
        notifications:{email:true,rankings:true,artists:false,events:true,marketing:false}};
      users.push(u);saveUsers(users);setSession(u);
      TotAuth.closeLogin();TotAuth._updateUserBtn();TotAuth.showToast('Bienvenido, @'+u.username+'!');
    }
  },
  submitLogin:function(){
    var email=document.getElementById('log-email').value.trim();
    var pwd=document.getElementById('log-pwd').value;
    var users=getUsers();
    var found=users.find(function(u){return u.email===email&&u.password===pwd;});
    if(found){
      setSession(found);TotAuth.closeLogin();TotAuth._updateUserBtn();TotAuth.showToast('Bienvenido, @'+found.username+'!');
    } else {
      document.getElementById('log-err').classList.add('show');
    }
  },

  // ── PROFILE ──
  openProfile:function(tab){
    document.getElementById('tot-dropdown').classList.remove('open');
    var u=getSession();
    if(!u)return;
    document.getElementById('prof-eyebrow').textContent='@'+u.username;
    document.getElementById('prof-title').textContent=(u.firstName||'')+' '+(u.lastName||'');
    document.getElementById('prof-fan').textContent=u.fanNum;
    document.getElementById('prof-date').textContent=u.createdAt;
    document.getElementById('prof-first').value=u.firstName||'';
    document.getElementById('prof-last').value=u.lastName||'';
    document.getElementById('prof-user').value=u.username||'';
    document.getElementById('prof-country').value=u.country||'';
    var notif=u.notifications||{};
    document.getElementById('notif-email').checked=notif.email!==false;
    document.getElementById('notif-rankings').checked=notif.rankings!==false;
    document.getElementById('notif-artists').checked=!!notif.artists;
    document.getElementById('notif-events').checked=notif.events!==false;
    document.getElementById('notif-marketing').checked=!!notif.marketing;
    document.getElementById('delete-confirm').style.display='none';
    document.getElementById('prof-saved').style.display='none';
    TotAuth.switchTab(tab||'account');
    document.getElementById('tot-prof-backdrop').classList.add('open');
  },
  closeProfile:function(){document.getElementById('tot-prof-backdrop').classList.remove('open');},
  switchTab:function(tab){
    ['account','notifications','tc'].forEach(function(t){
      document.getElementById('tab-'+t).classList.toggle('active',t===tab);
      document.getElementById('tab-panel-'+t).classList.toggle('active',t===tab);
    });
  },
  saveProfile:function(){
    var u=getSession();if(!u)return;
    u.firstName=document.getElementById('prof-first').value.trim();
    u.lastName=document.getElementById('prof-last').value.trim();
    u.username=document.getElementById('prof-user').value.trim();
    u.country=document.getElementById('prof-country').value;
    var users=getUsers();
    var idx=users.findIndex(function(x){return x.id===u.id;});
    if(idx>=0){users[idx]=u;saveUsers(users);}
    setSession(u);
    TotAuth._updateUserBtn();
    var saved=document.getElementById('prof-saved');
    saved.style.display='block';
    setTimeout(function(){saved.style.display='none';},3000);
  },
  saveNotifications:function(){
    var u=getSession();if(!u)return;
    u.notifications={
      email:document.getElementById('notif-email').checked,
      rankings:document.getElementById('notif-rankings').checked,
      artists:document.getElementById('notif-artists').checked,
      events:document.getElementById('notif-events').checked,
      marketing:document.getElementById('notif-marketing').checked
    };
    var users=getUsers();
    var idx=users.findIndex(function(x){return x.id===u.id;});
    if(idx>=0){users[idx]=u;saveUsers(users);}
    setSession(u);
    alert('Preferencias guardadas ✓');
  },
  showDeleteConfirm:function(){
    document.getElementById('delete-confirm').style.display='block';
    document.getElementById('delete-confirm-input').value='';
  },
  cancelDelete:function(){
    document.getElementById('delete-confirm').style.display='none';
  },
  deleteAccount:function(){
    var val=document.getElementById('delete-confirm-input').value.trim();
    if(val!=='ELIMINAR'){alert('Escribe ELIMINAR para confirmar');return;}
    var u=getSession();
    var users=getUsers().filter(function(x){return x.id!==u.id;});
    saveUsers(users);
    clearSession();
    TotAuth.closeProfile();
    TotAuth._updateUserBtn();
    alert('Cuenta eliminada. Hasta pronto.');
  },

  // ── LOGOUT ──
  logout:function(){
    clearSession();
    document.getElementById('tot-dropdown').classList.remove('open');
    TotAuth._updateUserBtn();
  },

  // ── HELPERS ──
  closeOnBg:function(e,id){
    if(e.target.id===id)document.getElementById(id).classList.remove('open');
  },
  checkUsername:function(input){
    var v=input.value.trim();
    var errId=input.id==='reg-user'?'reg-user-err':'reg-s2a-user-err';
    var err=document.getElementById(errId);
    if(!err)return;
    if(v&&(!isValidUsername(v)||TotAuth._userExists(v))){
      err.classList.add('show');input.classList.add('error');
    } else {
      err.classList.remove('show');input.classList.remove('error');
    }
  },
  checkPwd:function(input){
    var p=input.value;
    var bars=[document.getElementById('pb1'),document.getElementById('pb2'),document.getElementById('pb3')];
    var label=document.getElementById('pwd-label');
    bars.forEach(function(b){if(b){b.className='tot-pwd-bar';}});
    if(!p){label.style.color='rgba(255,255,255,.25)';label.textContent='Seguridad de contraseña';return;}
    var score=0;
    if(p.length>=8)score++;
    if(/[A-Z]/.test(p)&&/[0-9]/.test(p))score++;
    if(p.length>=12&&/[^a-zA-Z0-9]/.test(p))score++;
    var levels=['weak','medium','strong'];
    var labels=['Débil','Media','Fuerte'];
    var colors=['rgba(255,80,80,.8)','rgba(255,170,0,.8)','rgba(76,255,145,.8)'];
    for(var i=0;i<score;i++){if(bars[i])bars[i].classList.add(levels[score-1]);}
    label.textContent=labels[score-1]||'Débil';
    label.style.color=colors[score-1]||colors[0];
  },
  _emailExists:function(e){return getUsers().some(function(u){return u.email===e;});},
  _userExists:function(u){return getUsers().some(function(x){return x.username===u;});},
  _updateUserBtn:function(){
    var u=getSession();
    var btn=document.getElementById('tot-user-btn');
    var letter=document.getElementById('tot-avatar-letter');
    var ddOut=document.getElementById('tot-dd-out');
    var ddIn=document.getElementById('tot-dd-in');
    if(u){
      btn.classList.add('logged-in');
      letter.textContent=(u.username||'?')[0].toUpperCase();
      ddOut.style.display='none';
      ddIn.style.display='block';
      document.getElementById('tot-dd-uname').textContent='@'+(u.username||'');
      document.getElementById('tot-dd-fan').textContent=u.fanNum||'';
    } else {
      btn.classList.remove('logged-in');
      letter.textContent='?';
      ddOut.style.display='block';
      ddIn.style.display='none';
    }
  }
};

// ── INIT ──
TotAuth._updateUserBtn();

})();
