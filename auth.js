// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT — Auth System v2.1
// Glass card modals · Entrance animations · Backdrop blur
// ─────────────────────────────────────────────────────────────────
(function(){
'use strict';

// ── STORAGE ──
var UK='tot_users', SK='tot_session';
function getUsers(){ try{return JSON.parse(localStorage.getItem(UK)||'[]');}catch(e){return[];}}
function saveUsers(u){ localStorage.setItem(UK,JSON.stringify(u)); }
function getSession(){ try{return JSON.parse(localStorage.getItem(SK));}catch(e){return null;}}
function setSession(u){ localStorage.setItem(SK,JSON.stringify(u)); }
function clearSession(){ localStorage.removeItem(SK); }

// ── UTILS ──
function uid(){ return 'TOT-'+Math.random().toString(36).substr(2,4).toUpperCase()+Math.random().toString(36).substr(2,4).toUpperCase(); }
function fanNum(){
  // Format: # + 6 last digits of timestamp + 2 random digits
  // Example: #847312-47 → unique per millisecond
  var ts = Date.now().toString().slice(-6);
  var rnd = Math.floor(Math.random()*100).toString().padStart(2,'0');
  return '#'+ts+rnd;
}
function today(){ return new Date().toLocaleDateString('es-EC',{year:'numeric',month:'long',day:'numeric'}); }
function calcAge(dob){ if(!dob)return 999; var b=new Date(dob),n=new Date(); var a=n.getFullYear()-b.getFullYear(); if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--; return a; }
function isStrongPwd(p){ return p.length>=8&&/[A-Z]/.test(p)&&/[0-9]/.test(p); }
function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidUsername(u){ return /^[a-zA-Z0-9_\.]{3,20}$/.test(u); }

// ── CSS ──────────────────────────────────────────────────────────
var css=`
.tot-auth *{box-sizing:border-box;margin:0;padding:0;font-family:Helvetica,'Helvetica Neue',Arial,sans-serif}
.tot-auth input,.tot-auth select{cursor:text!important}

/* USER ICON */
#tot-user-btn{
  position:fixed;top:20px;right:40px;z-index:500;
  width:38px;height:38px;border-radius:50%;
  background:rgba(200,108,255,.08);border:1.5px solid rgba(200,108,255,.35);
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;animation:ubg 3s ease-in-out infinite;
}
@keyframes ubg{0%,100%{box-shadow:0 0 8px rgba(200,108,255,.2)}50%{box-shadow:0 0 18px rgba(200,108,255,.5)}}
#tot-user-btn:hover{background:rgba(200,108,255,.2);border-color:#c86cff;transform:scale(1.06)}
#tot-user-btn svg{width:17px;height:17px;stroke:#c86cff;fill:none;stroke-width:1.8;stroke-linecap:round}
#tot-user-btn .tot-avatar-letter{font-weight:700;font-size:14px;color:#c86cff;display:none}
#tot-user-btn.logged-in .tot-avatar-letter{display:block}
#tot-user-btn.logged-in svg{display:none}

/* DROPDOWN */
#tot-dropdown{
  position:fixed;top:66px;right:40px;z-index:499;
  background:rgba(8,8,14,.96);border:1px solid rgba(200,108,255,.18);
  min-width:210px;border-radius:12px;overflow:hidden;
  opacity:0;transform:translateY(-8px) scale(.97);
  transition:opacity .2s,transform .2s;pointer-events:none;
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
}
#tot-dropdown.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}
.tot-dd-user{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.05);background:rgba(200,108,255,.04)}
.tot-dd-uname{font-weight:700;font-size:13px;color:#fff}
.tot-dd-fan{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(200,108,255,.6);letter-spacing:.1em;margin-top:3px}
.tot-dd-item{display:flex;align-items:center;gap:11px;padding:13px 18px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6);border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s,color .15s}
.tot-dd-item:last-child{border-bottom:none}
.tot-dd-item:hover{background:rgba(200,108,255,.1);color:#fff}
.tot-dd-item.danger{color:rgba(255,80,80,.65)}
.tot-dd-item.danger:hover{background:rgba(255,80,80,.08);color:#ff5050}
.tot-dd-sep{height:1px;background:rgba(255,255,255,.05)}

/* ── BACKDROP — blurs the page behind ── */
.tot-backdrop{
  position:fixed;inset:0;z-index:1000;
  background:rgba(0,0,0,.6);
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  display:flex;align-items:center;justify-content:center;
  opacity:0;transition:opacity .35s ease;pointer-events:none;
  padding:20px;
}
.tot-backdrop.open{opacity:1;pointer-events:all}

/* ── GLASS MODAL ── */
.tot-modal{
  background:rgba(10,8,16,.75);
  border:1px solid rgba(255,255,255,.1);
  border-radius:20px;
  width:100%;max-width:440px;max-height:90vh;overflow-y:auto;
  position:relative;overflow:hidden;
  /* entrance: slides up from below */
  transform:translateY(40px) scale(.96);opacity:0;
  transition:transform .45s cubic-bezier(.34,1.56,.64,1), opacity .35s ease;
  box-shadow:
    0 0 0 1px rgba(200,108,255,.08),
    0 40px 100px rgba(0,0,0,.85),
    0 0 80px rgba(200,108,255,.06);
}
.tot-backdrop.open .tot-modal{transform:translateY(0) scale(1);opacity:1}
.tot-modal::-webkit-scrollbar{width:3px}
.tot-modal::-webkit-scrollbar-thumb{background:#c86cff33}

/* Corner reflections */
.tot-modal::before{
  content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  border-radius:20px;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 60% 25% at 0% 0%, rgba(200,108,255,.14), transparent 70%),
    radial-gradient(ellipse 40% 20% at 100% 0%, rgba(63,169,255,.1), transparent 70%),
    radial-gradient(ellipse 50% 15% at 100% 100%, rgba(200,108,255,.08), transparent 60%);
}
/* Subtle grid texture */
.tot-modal::after{
  content:'';position:absolute;inset:0;border-radius:20px;pointer-events:none;z-index:0;opacity:.025;
  background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);
  background-size:28px 28px;
}
/* Traveling light beam on top edge */
.tot-modal-beam{
  position:absolute;top:0;left:0;right:0;height:1px;z-index:10;pointer-events:none;overflow:hidden;
  border-radius:20px 20px 0 0;
}
.tot-modal-beam::after{
  content:'';position:absolute;top:0;left:-60%;width:50%;height:100%;
  background:linear-gradient(to right,transparent,rgba(200,108,255,.8),transparent);
  animation:mbeam 3.5s ease-in-out infinite;
}
@keyframes mbeam{0%{left:-60%}100%{left:120%}}

/* All content sits above pseudo-elements */
.tot-modal > *{position:relative;z-index:1}
.tot-modal > .tot-modal-beam{z-index:2}

/* MODAL HEADER */
.tot-mh{
  padding:26px 28px 18px;
  border-bottom:1px solid rgba(255,255,255,.06);
  display:flex;align-items:flex-start;justify-content:space-between;
}
.tot-mh-logo{width:34px;height:34px;border-radius:50%;border:1px solid rgba(200,108,255,.3);display:flex;align-items:center;justify-content:center;margin-bottom:12px;background:rgba(200,108,255,.07)}
.tot-mh-logo img{width:20px;height:20px;object-fit:contain;filter:invert(1)}
.tot-mh-eyebrow{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.32em;color:#c86cff;text-transform:uppercase;margin-bottom:4px}
.tot-mh-title{font-weight:700;font-size:22px;color:#fff;letter-spacing:-.015em;line-height:1.1}
.tot-mh-sub{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.28);letter-spacing:.05em;margin-top:6px}
.tot-close{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:50%;color:rgba(255,255,255,.4);font-size:14px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;margin-top:2px}
.tot-close:hover{border-color:#c86cff;color:#c86cff;background:rgba(200,108,255,.12)}

/* MODAL BODY */
.tot-mb{padding:20px 28px 28px}

/* Steps */
.tot-steps{display:flex;gap:4px;margin-bottom:20px}
.tot-step{height:2px;flex:1;background:rgba(255,255,255,.07);border-radius:2px;transition:background .3s}
.tot-step.done{background:#c86cff}
.tot-step.active{background:rgba(200,108,255,.5)}
.tot-section{display:none}.tot-section.active{display:block}

/* Labels */
.tot-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.25em;color:rgba(255,255,255,.3);text-transform:uppercase;display:block;margin-bottom:6px}

/* Input with icon */
.tot-input-group{position:relative;margin-bottom:13px}
.tot-input-group .tot-input{margin-bottom:0;padding-left:40px}
.tot-input-group .iico{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.26);font-size:13px;pointer-events:none;transition:color .2s;z-index:1;font-style:normal}
.tot-input-group:focus-within .iico{color:#c86cff}
.tot-input-group .ieye{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.26);background:none;border:none;font-size:14px;z-index:1;transition:color .2s;padding:2px}
.tot-input-group .ieye:hover{color:#fff}

/* Inputs */
.tot-input{
  width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);
  border-radius:10px;color:#fff;font-family:'JetBrains Mono',monospace;font-size:12px;
  padding:11px 14px;margin-bottom:13px;outline:none;
  transition:border-color .2s,background .2s,box-shadow .2s;
}
.tot-input:focus{border-color:rgba(200,108,255,.55);background:rgba(200,108,255,.05);box-shadow:0 0 0 3px rgba(200,108,255,.1)}
.tot-input.error{border-color:rgba(255,80,80,.55)}
.tot-input::placeholder{color:rgba(255,255,255,.17)}

/* Select */
.tot-select{
  width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);
  border-radius:10px;color:#fff;font-family:'JetBrains Mono',monospace;font-size:12px;
  padding:11px 14px;margin-bottom:13px;outline:none;transition:border-color .2s;appearance:none;
}
.tot-select:focus{border-color:rgba(200,108,255,.55)}
.tot-select option{background:#111;color:#fff}

.tot-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}

/* Errors / hints */
.tot-err{font-family:'JetBrains Mono',monospace;font-size:10px;color:#ff5050;letter-spacing:.04em;margin:-8px 0 12px;display:none}
.tot-err.show{display:block}
.tot-hint{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,.2);letter-spacing:.04em;margin:-8px 0 12px;line-height:1.6}

/* Badges */
.tot-info-badge{background:rgba(200,108,255,.07);border:1px solid rgba(200,108,255,.18);border-radius:10px;padding:11px 14px;margin-bottom:13px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(200,108,255,.7);display:flex;align-items:center;gap:10px}
.tot-info-badge strong{color:#c86cff;font-weight:700;font-size:13px}
.tot-warn-badge{background:rgba(255,170,0,.06);border:1px solid rgba(255,170,0,.22);border-radius:10px;padding:11px 14px;margin-bottom:13px;font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,200,0,.75);line-height:1.65}

/* Output fields */
.tot-output{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:11px 14px;margin-bottom:10px}
.tot-output-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.25em;color:rgba(255,255,255,.28);text-transform:uppercase;margin-bottom:3px}
.tot-output-val{font-family:'JetBrains Mono',monospace;font-size:13px;color:#fff}
.tot-output-val.purple{color:#c86cff;font-weight:700;font-size:16px;letter-spacing:.05em}

/* Buttons */
.tot-btn{
  width:100%;background:#fff;color:#000;
  font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;border:none;
  padding:13px;margin-top:8px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;gap:10px;
  transition:all .22s;position:relative;overflow:hidden;
}
.tot-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(to right,transparent,rgba(255,255,255,.12),transparent);transform:translateX(-100%);transition:transform .5s}
.tot-btn:hover::after{transform:translateX(100%)}
.tot-btn:hover{background:#c86cff;color:#fff;box-shadow:0 0 22px 4px rgba(200,108,255,.45)}
.tot-btn.ghost{background:transparent;color:rgba(255,255,255,.38);border:1px solid rgba(255,255,255,.1);margin-top:8px;border-radius:10px}
.tot-btn.ghost::after{display:none}
.tot-btn.ghost:hover{border-color:#c86cff;color:#c86cff;background:rgba(200,108,255,.07);box-shadow:none}
.tot-btn.danger-btn{background:rgba(255,80,80,.07);color:#ff5050;border:1px solid rgba(255,80,80,.22);margin-top:20px;border-radius:10px}
.tot-btn.danger-btn:hover{background:#ff5050;color:#fff}
.tot-btn.danger-btn::after{display:none}
.tot-btn.success-btn{background:linear-gradient(135deg,#c86cff,#3fa9ff);color:#fff;border-radius:10px}
.tot-btn.success-btn:hover{opacity:.9;box-shadow:0 0 24px 6px rgba(200,108,255,.4)}

/* Social providers */
.tot-providers{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.tot-provider{
  display:flex;align-items:center;gap:12px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  border-radius:10px;padding:11px 16px;transition:all .2s;
  font-size:13px;font-weight:700;color:rgba(255,255,255,.65);letter-spacing:.04em;
  position:relative;overflow:hidden;
}
.tot-provider::after{content:'';position:absolute;inset:0;background:linear-gradient(to right,transparent,rgba(200,108,255,.06),transparent);transform:translateX(-100%);transition:transform .4s}
.tot-provider:hover::after{transform:translateX(100%)}
.tot-provider:hover{border-color:rgba(200,108,255,.35);background:rgba(200,108,255,.06);color:#fff}
.tot-provider-icon{width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px}

.tot-divider{display:flex;align-items:center;gap:12px;margin:14px 0}
.tot-divider::before,.tot-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06)}
.tot-divider span{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.2em;color:rgba(255,255,255,.18);text-transform:uppercase}

/* T&C */
.tot-tc{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:10px;padding:14px;max-height:130px;overflow-y:auto;margin-bottom:14px}
.tot-tc::-webkit-scrollbar{width:3px}
.tot-tc::-webkit-scrollbar-thumb{background:#c86cff33}
.tot-tc p{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.8;color:rgba(255,255,255,.36);margin-bottom:8px}
.tot-tc p:last-child{margin-bottom:0}
.tot-checkbox-row{display:flex;align-items:flex-start;gap:11px;margin-bottom:10px}
.tot-checkbox-row input[type=checkbox]{width:15px;height:15px;flex-shrink:0;margin-top:2px;accent-color:#c86cff}
.tot-checkbox-label{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.65;color:rgba(255,255,255,.5)}
.tot-checkbox-label a{color:#c86cff;text-decoration:none}

/* Password */
.tot-pwd-meter{display:flex;gap:3px;margin:-6px 0 12px}
.tot-pwd-bar{height:2px;flex:1;background:rgba(255,255,255,.07);border-radius:2px;transition:background .3s}
.tot-pwd-bar.weak{background:#ff5050}
.tot-pwd-bar.medium{background:#ffaa00}
.tot-pwd-bar.strong{background:#4cff91}
.tot-pwd-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;margin-bottom:12px}

/* Profile tabs */
.tot-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:20px}
.tot-tab{padding:11px 18px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.28);border-bottom:2px solid transparent;transition:all .2s;flex:1;text-align:center}
.tot-tab.active{color:#c86cff;border-bottom-color:#c86cff}
.tot-tab:hover:not(.active){color:rgba(255,255,255,.6)}

/* Toggles */
.tot-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.tot-toggle-row:last-child{border-bottom:none}
.tot-toggle-title{font-weight:700;font-size:12px;color:#fff;margin-bottom:2px}
.tot-toggle-desc{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,.26);letter-spacing:.05em}
.tot-toggle{position:relative;width:38px;height:20px;flex-shrink:0}
.tot-toggle input{opacity:0;width:0;height:0;position:absolute}
.tot-toggle-slider{position:absolute;inset:0;background:rgba(255,255,255,.1);border-radius:10px;transition:background .2s}
.tot-toggle-slider::after{content:'';position:absolute;left:3px;top:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s}
.tot-toggle input:checked + .tot-toggle-slider{background:#c86cff}
.tot-toggle input:checked + .tot-toggle-slider::after{transform:translateX(18px)}

/* Success */
.tot-success{text-align:center;padding:16px 0 8px}
.tot-success-icon{width:68px;height:68px;border-radius:50%;background:rgba(200,108,255,.1);border:2px solid rgba(200,108,255,.28);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:30px;box-shadow:0 0 24px rgba(200,108,255,.22)}
.tot-success-title{font-weight:700;font-size:24px;color:#fff;letter-spacing:-.01em;margin-bottom:8px}
.tot-success-sub{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.38);letter-spacing:.06em;line-height:1.7}

/* Delete */
.tot-delete-warn{background:rgba(255,80,80,.05);border:1px solid rgba(255,80,80,.18);border-radius:10px;padding:14px;margin-bottom:18px}
.tot-delete-warn p{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,100,100,.75);line-height:1.7}
.tot-delete-warn strong{color:#ff5050;font-weight:700}

/* Toast */
#tot-toast{
  position:fixed;top:74px;left:50%;transform:translateX(-50%) translateY(-12px);z-index:10000;
  background:linear-gradient(135deg,rgba(200,108,255,.92),rgba(63,169,255,.9));
  color:#fff;font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  padding:11px 28px;border-radius:40px;opacity:0;
  transition:opacity .35s,transform .35s;pointer-events:none;white-space:nowrap;
  backdrop-filter:blur(12px);box-shadow:0 4px 24px rgba(200,108,255,.35);
}
#tot-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

@media(max-width:600px){
  .tot-modal{max-width:100%;border-radius:20px 20px 0 0}
  .tot-backdrop{align-items:flex-end;padding:0}
  #tot-user-btn{right:20px;top:18px}
  #tot-dropdown{right:20px}
  .tot-grid-2{grid-template-columns:1fr}
}
`;

// ── HTML ─────────────────────────────────────────────────────────
var HTML=`
<div class="tot-auth">

<button id="tot-user-btn" onclick="TotAuth.toggleDropdown()" title="Mi cuenta">
  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
  <span class="tot-avatar-letter" id="tot-avatar-letter">?</span>
</button>

<div id="tot-dropdown">
  <div id="tot-dd-out">
    <div class="tot-dd-item" onclick="TotAuth.openLogin()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      Iniciar Sesión
    </div>
    <div class="tot-dd-item" onclick="TotAuth.openRegister()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      Registrarse
    </div>
  </div>
  <div id="tot-dd-in" style="display:none">
    <div class="tot-dd-user">
      <div class="tot-dd-uname" id="tot-dd-uname">–</div>
      <div class="tot-dd-fan" id="tot-dd-fan"></div>
    </div>
    <div class="tot-dd-item" onclick="TotAuth.openProfile('account')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      Mi Cuenta
    </div>
    <div class="tot-dd-item" onclick="TotAuth.openProfile('notifications')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      Notificaciones
    </div>
    <div class="tot-dd-sep"></div>
    <div class="tot-dd-item danger" onclick="TotAuth.logout()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Cerrar Sesión
    </div>
  </div>
</div>

<div id="tot-toast"></div>

<!-- ══ REGISTER ══ -->
<div class="tot-backdrop" id="tot-reg-backdrop" onclick="TotAuth.closeOnBg(event,'tot-reg-backdrop')">
<div class="tot-modal tot-auth">
  <div class="tot-modal-beam"></div>
  <div class="tot-mh">
    <div>
      <div class="tot-mh-logo"><img src="logo.png" alt="TT"></div>
      <div class="tot-mh-eyebrow">Top of Talent</div>
      <div class="tot-mh-title" id="reg-title">Crear Cuenta</div>
      <div class="tot-mh-sub" id="reg-sub">Únete a la comunidad</div>
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

    <!-- Step 1: Método -->
    <div class="tot-section active" id="reg-step1">
      <div class="tot-providers">
        <div class="tot-provider" onclick="TotAuth.socialReg('Google')"><div class="tot-provider-icon">G</div>Continuar con Google</div>
        <div class="tot-provider" onclick="TotAuth.socialReg('Apple')"><div class="tot-provider-icon">🍎</div>Continuar con Apple</div>
        <div class="tot-provider" onclick="TotAuth.socialReg('Facebook')"><div class="tot-provider-icon">f</div>Continuar con Facebook</div>
        <div class="tot-provider" onclick="TotAuth.socialReg('X')"><div class="tot-provider-icon">𝕏</div>Continuar con X</div>
      </div>
      <div class="tot-divider"><span>o con email</span></div>
      <button class="tot-btn ghost" onclick="TotAuth.goRegEmail()" style="margin-top:0">✉ Registrarse con Email</button>
    </div>

    <!-- Step 2: Email -->
    <div class="tot-section" id="reg-step2">
      <div class="tot-grid-2">
        <div><label class="tot-label">Nombre</label><input class="tot-input" id="reg-first" placeholder="Tu nombre"></div>
        <div><label class="tot-label">Apellido</label><input class="tot-input" id="reg-last" placeholder="Tu apellido"></div>
      </div>
      <label class="tot-label">Email</label>
      <div class="tot-input-group"><i class="iico">✉</i><input class="tot-input" id="reg-email" type="email" placeholder="tu@email.com"></div>
      <div class="tot-err" id="reg-email-err">Email inválido o ya registrado</div>
      <label class="tot-label">Nombre de usuario</label>
      <div class="tot-input-group"><i class="iico">@</i><input class="tot-input" id="reg-user" placeholder="tu_usuario" oninput="TotAuth.checkUsername(this)"></div>
      <div class="tot-err" id="reg-user-err">No disponible (3–20 chars, sin espacios)</div>
      <div class="tot-hint">Letras, números, _ y . únicamente</div>
      <label class="tot-label">Contraseña</label>
      <div class="tot-input-group"><i class="iico">🔒</i><input class="tot-input" id="reg-pwd" type="password" placeholder="Mín. 8 chars, 1 mayúscula, 1 número" oninput="TotAuth.checkPwd(this)"><button class="ieye" onclick="TotAuth.togglePwd('reg-pwd',this)" type="button">👁</button></div>
      <div class="tot-pwd-meter"><div class="tot-pwd-bar" id="pb1"></div><div class="tot-pwd-bar" id="pb2"></div><div class="tot-pwd-bar" id="pb3"></div></div>
      <div class="tot-pwd-label" id="pwd-label" style="color:rgba(255,255,255,.22)">Seguridad de contraseña</div>
      <div class="tot-err" id="reg-pwd-err">Mínimo 8 caracteres, 1 mayúscula y 1 número</div>
      <div class="tot-grid-2">
        <div><label class="tot-label">Fecha de nacimiento</label><input class="tot-input" id="reg-dob" type="date" style="color-scheme:dark"></div>
        <div><label class="tot-label">País / Región</label><select class="tot-select" id="reg-country" style="margin-bottom:0"><option value="">Selecciona…</option><option value="EC">Ecuador 🇪🇨</option><option value="CO">Colombia 🇨🇴</option><option value="PE">Perú 🇵🇪</option><option value="CL">Chile 🇨🇱</option><option value="AR">Argentina 🇦🇷</option><option value="MX">México 🇲🇽</option><option value="US">EE.UU. 🇺🇸</option><option value="ES">España 🇪🇸</option><option value="OTHER">Otro</option></select></div>
      </div>
      <div class="tot-err" id="reg-dob-err" style="margin-top:6px">Debes tener al menos 13 años</div>
      <div class="tot-warn-badge" id="reg-parental-warn" style="display:none">⚠️ Eres menor de 16 años. Necesitas autorización de un padre o tutor (RGPD europeo).</div>
      <button class="tot-btn" onclick="TotAuth.submitEmailReg()" style="margin-top:12px">Continuar →</button>
      <button class="tot-btn ghost" onclick="TotAuth.backToStep1()">← Volver</button>
    </div>

    <!-- Step 2b: Social -->
    <div class="tot-section" id="reg-step2b">
      <div class="tot-info-badge"><span>Conectado con</span><strong id="reg-social-name">Google</strong></div>
      <label class="tot-label">Nombre de usuario</label>
      <div class="tot-input-group"><i class="iico">@</i><input class="tot-input" id="reg-s2b-user" placeholder="tu_usuario" oninput="TotAuth.checkUsername(this)"></div>
      <div class="tot-err" id="reg-s2b-user-err">No disponible o inválido</div>
      <label class="tot-label">Fecha de nacimiento</label>
      <input class="tot-input" id="reg-s2b-dob" type="date" style="color-scheme:dark">
      <div class="tot-err" id="reg-s2b-dob-err">Debes tener al menos 13 años</div>
      <div class="tot-warn-badge" id="reg-s2b-parental-warn" style="display:none">⚠️ Se requiere autorización parental (RGPD).</div>
      <label class="tot-label">País / Región</label>
      <select class="tot-select" id="reg-s2b-country"><option value="">Selecciona…</option><option value="EC">Ecuador 🇪🇨</option><option value="CO">Colombia 🇨🇴</option><option value="PE">Perú 🇵🇪</option><option value="CL">Chile 🇨🇱</option><option value="AR">Argentina 🇦🇷</option><option value="MX">México 🇲🇽</option><option value="US">EE.UU. 🇺🇸</option><option value="ES">España 🇪🇸</option><option value="OTHER">Otro</option></select>
      <button class="tot-btn" onclick="TotAuth.goTC()">Continuar →</button>
      <button class="tot-btn ghost" onclick="TotAuth.backToStep1()">← Volver</button>
    </div>

    <!-- Step 3: T&C -->
    <div class="tot-section" id="reg-step3">
      <div class="tot-tc">
        <p><strong style="color:rgba(255,255,255,.7)">Términos — Top of Talent</strong></p>
        <p>Al registrarte aceptas nuestros términos de servicio y política de privacidad. El contenido es de uso personal y no comercial.</p>
        <p>Tu información no será vendida a terceros. Top of Talent opera desde Milán y Praga, dirigido al público ecuatoriano.</p>
        <p>Tienes derecho a acceder, rectificar y suprimir tus datos. Contacto: contactoftalent@gmail.com</p>
        <p>© 2026 topoftalentoficial.com</p>
      </div>
      <div class="tot-checkbox-row"><input type="checkbox" id="tc1" onchange="TotAuth.checkTC()"><label class="tot-checkbox-label" for="tc1">Acepto los <a href="#" onclick="if(window.TotLegal)TotLegal.open('terminos');return false">Términos y Condiciones</a> y la <a href="#" onclick="if(window.TotLegal)TotLegal.open('privacidad');return false">Política de Privacidad</a></label></div>
      <div class="tot-checkbox-row"><input type="checkbox" id="tc2" onchange="TotAuth.checkTC()"><label class="tot-checkbox-label" for="tc2">Confirmo que tengo al menos 13 años</label></div>
      <div class="tot-checkbox-row" id="tc-parental-row" style="display:none"><input type="checkbox" id="tc-parental" onchange="TotAuth.checkTC()"><label class="tot-checkbox-label" for="tc-parental">Cuento con autorización de mi padre, madre o tutor legal</label></div>
      <div class="tot-checkbox-row"><input type="checkbox" id="tc3"><label class="tot-checkbox-label" for="tc3">Acepto recibir notificaciones de Top of Talent (opcional)</label></div>
      <button class="tot-btn" id="tc-btn" onclick="TotAuth.completeRegistration()" disabled style="opacity:.4">Crear cuenta →</button>
    </div>

    <!-- Step 4: Success -->
    <div class="tot-section" id="reg-step4">
      <div class="tot-success">
        <div class="tot-success-icon">✓</div>
        <div class="tot-success-title">Sign Up Complete</div>
        <div class="tot-success-sub">Bienvenido a Top of Talent.<br>Tu cuenta ha sido creada exitosamente.</div>
      </div>
      <div class="tot-output"><div class="tot-output-label">Tu número de fan</div><div class="tot-output-val purple" id="out-fan-val">–</div></div>
      <div class="tot-output"><div class="tot-output-label">Nombre de usuario</div><div class="tot-output-val" id="out-user-val">–</div></div>
      <div class="tot-output"><div class="tot-output-label">Fecha de creación</div><div class="tot-output-val" id="out-date-val">–</div></div>
      <button class="tot-btn success-btn" onclick="TotAuth.closeRegister()">Entrar a Top of Talent →</button>
    </div>
  </div>
</div>
</div>

<!-- ══ LOGIN ══ -->
<div class="tot-backdrop" id="tot-log-backdrop" onclick="TotAuth.closeOnBg(event,'tot-log-backdrop')">
<div class="tot-modal tot-auth">
  <div class="tot-modal-beam"></div>
  <div class="tot-mh">
    <div>
      <div class="tot-mh-logo"><img src="logo.png" alt="TT"></div>
      <div class="tot-mh-eyebrow">Top of Talent</div>
      <div class="tot-mh-title">Bienvenido de vuelta</div>
      <div class="tot-mh-sub">Inicia sesión para continuar</div>
    </div>
    <button class="tot-close" onclick="TotAuth.closeLogin()">✕</button>
  </div>
  <div class="tot-mb">
    <div class="tot-providers">
      <div class="tot-provider" onclick="TotAuth.socialLogin('Google')"><div class="tot-provider-icon">G</div>Continuar con Google</div>
      <div class="tot-provider" onclick="TotAuth.socialLogin('Apple')"><div class="tot-provider-icon">🍎</div>Continuar con Apple</div>
      <div class="tot-provider" onclick="TotAuth.socialLogin('Facebook')"><div class="tot-provider-icon">f</div>Continuar con Facebook</div>
      <div class="tot-provider" onclick="TotAuth.socialLogin('X')"><div class="tot-provider-icon">𝕏</div>Continuar con X</div>
    </div>
    <div class="tot-divider"><span>o con tu email</span></div>
    <label class="tot-label">Email</label>
    <div class="tot-input-group"><i class="iico">✉</i><input class="tot-input" id="log-email" type="email" placeholder="tu@email.com"></div>
    <label class="tot-label">Contraseña</label>
    <div class="tot-input-group"><i class="iico">🔒</i><input class="tot-input" id="log-pwd" type="password" placeholder="Tu contraseña"><button class="ieye" onclick="TotAuth.togglePwd('log-pwd',this)" type="button">👁</button></div>
    <div class="tot-err" id="log-err">Email o contraseña incorrectos</div>
    <button class="tot-btn" onclick="TotAuth.submitLogin()">Iniciar Sesión →</button>
    <button class="tot-btn ghost" onclick="TotAuth.closeLogin();TotAuth.openRegister()" style="margin-top:10px">¿No tienes cuenta? Regístrate</button>
  </div>
</div>
</div>

<!-- ══ PROFILE ══ -->
<div class="tot-backdrop" id="tot-prof-backdrop" onclick="TotAuth.closeOnBg(event,'tot-prof-backdrop')">
<div class="tot-modal tot-auth">
  <div class="tot-modal-beam"></div>
  <div class="tot-mh">
    <div>
      <div class="tot-mh-logo"><img src="logo.png" alt="TT"></div>
      <div class="tot-mh-eyebrow" id="prof-eyebrow">Mi Cuenta</div>
      <div class="tot-mh-title" id="prof-title">Perfil</div>
      <div class="tot-mh-sub" id="prof-sub"></div>
    </div>
    <button class="tot-close" onclick="TotAuth.closeProfile()">✕</button>
  </div>
  <div class="tot-mb">
    <div class="tot-tabs">
      <div class="tot-tab active" id="tab-account" onclick="TotAuth.switchTab('account')">Cuenta</div>
      <div class="tot-tab" id="tab-notifications" onclick="TotAuth.switchTab('notifications')">Avisos</div>
      <div class="tot-tab" id="tab-tc" onclick="TotAuth.switchTab('tc')">T&C</div>
    </div>
    <div class="tot-section active" id="tab-panel-account">
      <div class="tot-grid-2">
        <div class="tot-output"><div class="tot-output-label">Número de Fan</div><div class="tot-output-val purple" id="prof-fan">–</div></div>
        <div class="tot-output"><div class="tot-output-label">Miembro desde</div><div class="tot-output-val" id="prof-date">–</div></div>
      </div>
      <div class="tot-grid-2">
        <div class="tot-output"><div class="tot-output-label">Método</div><div class="tot-output-val" id="prof-method">–</div></div>
        <div class="tot-output"><div class="tot-output-label">País</div><div class="tot-output-val" id="prof-country-display">–</div></div>
      </div>
      <label class="tot-label" style="margin-top:14px">Nombre</label>
      <input class="tot-input" id="prof-first" placeholder="Tu nombre">
      <label class="tot-label">Apellido</label>
      <input class="tot-input" id="prof-last" placeholder="Tu apellido">
      <label class="tot-label">Nombre de usuario</label>
      <div class="tot-input-group"><i class="iico">@</i><input class="tot-input" id="prof-user" placeholder="username"></div>
      <label class="tot-label">País / Región</label>
      <select class="tot-select" id="prof-country"><option value="">Selecciona…</option><option value="EC">Ecuador 🇪🇨</option><option value="CO">Colombia 🇨🇴</option><option value="PE">Perú 🇵🇪</option><option value="CL">Chile 🇨🇱</option><option value="AR">Argentina 🇦🇷</option><option value="MX">México 🇲🇽</option><option value="US">EE.UU. 🇺🇸</option><option value="ES">España 🇪🇸</option><option value="OTHER">Otro</option></select>
      <button class="tot-btn" onclick="TotAuth.saveProfile()">Guardar Cambios</button>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4cff91;display:none;margin-top:8px" id="prof-saved">✓ Cambios guardados</div>
      <button class="tot-btn danger-btn" onclick="TotAuth.showDeleteConfirm()">⚠ Eliminar Cuenta</button>
      <div id="delete-confirm" style="display:none;margin-top:16px">
        <div class="tot-delete-warn"><p><strong>ACCIÓN IRREVERSIBLE</strong><br><br>Perderás tu número de fan, historial y acceso a funciones exclusivas.</p></div>
        <label class="tot-label">Escribe <strong style="color:#ff5050">ELIMINAR</strong> para confirmar</label>
        <input class="tot-input" id="delete-confirm-input" placeholder="ELIMINAR">
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="tot-btn danger-btn" style="flex:1;margin-top:0" onclick="TotAuth.deleteAccount()">Eliminar para siempre</button>
          <button class="tot-btn ghost" style="flex:1;margin-top:0" onclick="TotAuth.cancelDelete()">Cancelar</button>
        </div>
      </div>
    </div>
    <div class="tot-section" id="tab-panel-notifications">
      <div class="tot-toggle-row"><div><div class="tot-toggle-title">Email importantes</div><div class="tot-toggle-desc">Actualizaciones de tu cuenta</div></div><label class="tot-toggle"><input type="checkbox" id="notif-email" checked><div class="tot-toggle-slider"></div></label></div>
      <div class="tot-toggle-row"><div><div class="tot-toggle-title">Nuevos Rankings</div><div class="tot-toggle-desc">Cuando se actualiza el Top 7</div></div><label class="tot-toggle"><input type="checkbox" id="notif-rankings" checked><div class="tot-toggle-slider"></div></label></div>
      <div class="tot-toggle-row"><div><div class="tot-toggle-title">Nuevos Artistas</div><div class="tot-toggle-desc">Cuando se agrega un artista</div></div><label class="tot-toggle"><input type="checkbox" id="notif-artists"><div class="tot-toggle-slider"></div></label></div>
      <div class="tot-toggle-row"><div><div class="tot-toggle-title">Eventos</div><div class="tot-toggle-desc">Nuevos festivales y eventos</div></div><label class="tot-toggle"><input type="checkbox" id="notif-events" checked><div class="tot-toggle-slider"></div></label></div>
      <div class="tot-toggle-row"><div><div class="tot-toggle-title">Marketing</div><div class="tot-toggle-desc">Promociones y comunicaciones</div></div><label class="tot-toggle"><input type="checkbox" id="notif-marketing"><div class="tot-toggle-slider"></div></label></div>
      <button class="tot-btn" style="margin-top:20px" onclick="TotAuth.saveNotifications()">Guardar Preferencias</button>
    </div>
    <div class="tot-section" id="tab-panel-tc">
      <div class="tot-tc" style="max-height:260px">
        <p><strong style="color:rgba(255,255,255,.7)">Términos y Condiciones de Top of Talent</strong></p>
        <p>Al registrarte aceptas nuestros términos de servicio y política de privacidad.</p>
        <p>El contenido es de uso personal y no comercial. Está prohibida su reproducción sin autorización.</p>
        <p>Tu información no será vendida a terceros. Operamos desde Milán y Praga para el público ecuatoriano.</p>
        <p>Tienes derecho a acceder, rectificar y eliminar tus datos (RGPD). Menores de 16 años requieren autorización parental.</p>
        <p>© 2026 topoftalentoficial.com</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
        <button class="tot-btn ghost" style="margin-top:0" onclick="if(window.TotLegal)TotLegal.open('terminos')">Ver Términos completos</button>
        <button class="tot-btn ghost" style="margin-top:0" onclick="if(window.TotLegal)TotLegal.open('privacidad')">Ver Política de Privacidad</button>
        <button class="tot-btn ghost" style="margin-top:0" onclick="if(window.TotLegal)TotLegal.open('cookies')">Ver Política de Cookies</button>
      </div>
    </div>
  </div>
</div>
</div>
</div>`;

// Inject
var styleEl=document.createElement('style');
styleEl.textContent=css;
document.head.appendChild(styleEl);
var wrapper=document.createElement('div');
wrapper.innerHTML=HTML;
document.body.insertBefore(wrapper,document.body.firstChild);

// Set max date for DOB
var maxDate=new Date().toISOString().split('T')[0];
['reg-dob','reg-s2b-dob'].forEach(function(id){var el=document.getElementById(id);if(el)el.setAttribute('max',maxDate);});

var _regProvider=null, _pendingUser={};

window.TotAuth={
  toggleDropdown:function(){
    var dd=document.getElementById('tot-dropdown');
    dd.classList.toggle('open');
    if(dd.classList.contains('open')){
      setTimeout(function(){document.addEventListener('click',TotAuth._closeDD,{once:true});},10);
    }
  },
  _closeDD:function(e){if(!e.target.closest('#tot-dropdown')&&!e.target.closest('#tot-user-btn'))document.getElementById('tot-dropdown').classList.remove('open');},

  openRegister:function(){
    document.getElementById('tot-dropdown').classList.remove('open');
    TotAuth._resetReg();
    document.getElementById('tot-reg-backdrop').classList.add('open');
    document.body.style.overflow='hidden';
  },
  closeRegister:function(){document.getElementById('tot-reg-backdrop').classList.remove('open');document.body.style.overflow='';TotAuth._updateBtn();},
  _resetReg:function(){
    _regProvider=null;_pendingUser={};
    TotAuth._showRegStep(1);
    ['reg-first','reg-last','reg-email','reg-user','reg-pwd','reg-s2b-user','reg-dob','reg-s2b-dob'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
    ['reg-email-err','reg-user-err','reg-pwd-err','reg-dob-err','reg-s2b-dob-err','reg-s2b-user-err'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove('show');});
    ['reg-parental-warn','reg-s2b-parental-warn'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
    document.getElementById('tc1').checked=false;
    document.getElementById('tc2').checked=false;
    document.getElementById('tc-btn').disabled=true;
    document.getElementById('tc-btn').style.opacity='.4';
  },
  _showRegStep:function(n){
    ['reg-step1','reg-step2','reg-step2b','reg-step3','reg-step4'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove('active');});
    for(var s=1;s<=4;s++){var b=document.getElementById('reg-s'+s);if(!b)continue;b.classList.remove('active','done');if(s<n)b.classList.add('done');else if(s===n)b.classList.add('active');}
    var titles={1:['Crear Cuenta','Únete a la comunidad'],2:['Tu información','Completa tu perfil'],3:['Términos','Último paso'],4:['¡Listo!','Cuenta creada']};
    var t=titles[n]||titles[1];
    document.getElementById('reg-title').textContent=t[0];
    document.getElementById('reg-sub').textContent=t[1];
  },
  socialReg:function(provider){
    _regProvider=provider;
    document.getElementById('reg-social-name').textContent=provider;
    _pendingUser={provider:provider,fanNum:fanNum(),createdAt:today()};
    TotAuth._showRegStep(2);document.getElementById('reg-step2b').classList.add('active');
  },
  goRegEmail:function(){TotAuth._showRegStep(2);document.getElementById('reg-step2').classList.add('active');},
  backToStep1:function(){TotAuth._showRegStep(1);document.getElementById('reg-step1').classList.add('active');},
  _checkDob:function(dobId,errId,warnId){
    var dob=document.getElementById(dobId).value;
    if(!dob)return false;
    var age=calcAge(dob);
    var err=document.getElementById(errId);
    var warn=document.getElementById(warnId);
    if(age<13){err.classList.add('show');return false;}
    err.classList.remove('show');
    if(warn){warn.style.display=(age<16)?'block':'none';}
    var pRow=document.getElementById('tc-parental-row');
    if(pRow)pRow.style.display=(age<16)?'flex':'none';
    return true;
  },
  submitEmailReg:function(){
    var first=document.getElementById('reg-first').value.trim();
    var last=document.getElementById('reg-last').value.trim();
    var email=document.getElementById('reg-email').value.trim();
    var user=document.getElementById('reg-user').value.trim();
    var pwd=document.getElementById('reg-pwd').value;
    var country=document.getElementById('reg-country').value;
    var ok=true;
    if(!isValidEmail(email)||TotAuth._emailExists(email)){document.getElementById('reg-email-err').classList.add('show');ok=false;}else document.getElementById('reg-email-err').classList.remove('show');
    if(!isValidUsername(user)||TotAuth._userExists(user)){document.getElementById('reg-user-err').classList.add('show');ok=false;}else document.getElementById('reg-user-err').classList.remove('show');
    if(!isStrongPwd(pwd)){document.getElementById('reg-pwd-err').classList.add('show');ok=false;}else document.getElementById('reg-pwd-err').classList.remove('show');
    if(!TotAuth._checkDob('reg-dob','reg-dob-err','reg-parental-warn'))ok=false;
    if(!first||!last||!country)ok=false;
    if(!ok)return;
    var dob=document.getElementById('reg-dob').value;
    _pendingUser={provider:'email',firstName:first,lastName:last,email:email,username:user,password:pwd,country:country,dob:dob,age:calcAge(dob),fanNum:fanNum(),createdAt:today()};
    TotAuth.goTC();
  },
  goTC:function(){
    if(_regProvider){
      var user=document.getElementById('reg-s2b-user').value.trim();
      var country=document.getElementById('reg-s2b-country').value;
      var dob=document.getElementById('reg-s2b-dob').value;
      if(!user||!country||!dob){alert('Completa todos los campos');return;}
      if(!isValidUsername(user)||TotAuth._userExists(user)){document.getElementById('reg-s2b-user-err').classList.add('show');return;}
      document.getElementById('reg-s2b-user-err').classList.remove('show');
      if(!TotAuth._checkDob('reg-s2b-dob','reg-s2b-dob-err','reg-s2b-parental-warn'))return;
      _pendingUser.username=user;_pendingUser.country=country;_pendingUser.dob=dob;_pendingUser.age=calcAge(dob);
      _pendingUser.email=_regProvider.toLowerCase()+'_'+Date.now()+'@social.tot';
      _pendingUser.firstName=_regProvider+' User';_pendingUser.lastName='';
    }
    TotAuth._showRegStep(3);document.getElementById('reg-step3').classList.add('active');
  },
  checkTC:function(){
    var age=_pendingUser.age||99;
    var needsParental=(age<16);
    var parentalOk=!needsParental||document.getElementById('tc-parental').checked;
    var ok=document.getElementById('tc1').checked&&document.getElementById('tc2').checked&&parentalOk;
    document.getElementById('tc-btn').disabled=!ok;
    document.getElementById('tc-btn').style.opacity=ok?'1':'.4';
  },
  completeRegistration:function(){
    var users=getUsers();
    var newUser=Object.assign({id:uid()},_pendingUser);
    users.push(newUser);saveUsers(users);setSession(newUser);
    document.getElementById('out-fan-val').textContent=newUser.fanNum;
    document.getElementById('out-user-val').textContent='@'+newUser.username;
    document.getElementById('out-date-val').textContent=newUser.createdAt;
    TotAuth._showRegStep(4);document.getElementById('reg-step4').classList.add('active');
    TotAuth._updateBtn();
    setTimeout(function(){TotAuth.showToast('Hola, @'+newUser.username+'!');},400);
  },

  openLogin:function(){
    document.getElementById('tot-dropdown').classList.remove('open');
    document.getElementById('log-email').value='';
    document.getElementById('log-pwd').value='';
    document.getElementById('log-err').classList.remove('show');
    document.getElementById('tot-log-backdrop').classList.add('open');
    document.body.style.overflow='hidden';
  },
  closeLogin:function(){document.getElementById('tot-log-backdrop').classList.remove('open');document.body.style.overflow='';},
  socialLogin:function(provider){
    var found=getUsers().find(function(u){return u.provider===provider;});
    if(found){setSession(found);TotAuth.closeLogin();TotAuth._updateBtn();TotAuth.showToast('Hola, @'+found.username+'!');}
    else{
      var u={id:uid(),provider:provider,firstName:provider,lastName:'User',
        email:provider.toLowerCase()+'_'+Date.now()+'@social.tot',
        username:provider.toLowerCase()+'_'+Math.floor(Math.random()*9999),
        country:'EC',fanNum:fanNum(),createdAt:today(),age:18,
        notifications:{email:true,rankings:true,artists:false,events:true,marketing:false}};
      var users=getUsers();users.push(u);saveUsers(users);setSession(u);
      TotAuth.closeLogin();TotAuth._updateBtn();TotAuth.showToast('Hola, @'+u.username+'!');
    }
  },
  submitLogin:function(){
    var email=document.getElementById('log-email').value.trim();
    var pwd=document.getElementById('log-pwd').value;
    var found=getUsers().find(function(u){return u.email===email&&u.password===pwd;});
    if(found){setSession(found);TotAuth.closeLogin();TotAuth._updateBtn();TotAuth.showToast('Hola, @'+found.username+'!');}
    else document.getElementById('log-err').classList.add('show');
  },

  openProfile:function(tab){
    document.getElementById('tot-dropdown').classList.remove('open');
    var u=getSession();if(!u)return;
    var cNames={EC:'Ecuador',CO:'Colombia',PE:'Perú',CL:'Chile',AR:'Argentina',MX:'México',US:'EE.UU.',ES:'España',OTHER:'Otro'};
    document.getElementById('prof-eyebrow').textContent='@'+u.username;
    document.getElementById('prof-title').textContent=(u.firstName||'')+' '+(u.lastName||'');
    document.getElementById('prof-sub').textContent='Fan desde '+u.createdAt;
    document.getElementById('prof-fan').textContent=u.fanNum;
    document.getElementById('prof-date').textContent=u.createdAt;
    document.getElementById('prof-method').textContent=u.provider||'email';
    document.getElementById('prof-country-display').textContent=cNames[u.country]||u.country||'—';
    document.getElementById('prof-first').value=u.firstName||'';
    document.getElementById('prof-last').value=u.lastName||'';
    document.getElementById('prof-user').value=u.username||'';
    document.getElementById('prof-country').value=u.country||'';
    var n=u.notifications||{};
    document.getElementById('notif-email').checked=n.email!==false;
    document.getElementById('notif-rankings').checked=n.rankings!==false;
    document.getElementById('notif-artists').checked=!!n.artists;
    document.getElementById('notif-events').checked=n.events!==false;
    document.getElementById('notif-marketing').checked=!!n.marketing;
    document.getElementById('delete-confirm').style.display='none';
    document.getElementById('prof-saved').style.display='none';
    TotAuth.switchTab(tab||'account');
    document.getElementById('tot-prof-backdrop').classList.add('open');
    document.body.style.overflow='hidden';
  },
  closeProfile:function(){document.getElementById('tot-prof-backdrop').classList.remove('open');document.body.style.overflow='';},
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
    var users=getUsers();var idx=users.findIndex(function(x){return x.id===u.id;});
    if(idx>=0){users[idx]=u;saveUsers(users);}
    setSession(u);TotAuth._updateBtn();
    var s=document.getElementById('prof-saved');s.style.display='block';
    setTimeout(function(){s.style.display='none';},3000);
  },
  saveNotifications:function(){
    var u=getSession();if(!u)return;
    u.notifications={email:document.getElementById('notif-email').checked,rankings:document.getElementById('notif-rankings').checked,artists:document.getElementById('notif-artists').checked,events:document.getElementById('notif-events').checked,marketing:document.getElementById('notif-marketing').checked};
    var users=getUsers();var idx=users.findIndex(function(x){return x.id===u.id;});
    if(idx>=0){users[idx]=u;saveUsers(users);}
    setSession(u);TotAuth.showToast('Preferencias guardadas ✓');
  },
  showDeleteConfirm:function(){document.getElementById('delete-confirm').style.display='block';document.getElementById('delete-confirm-input').value='';},
  cancelDelete:function(){document.getElementById('delete-confirm').style.display='none';},
  deleteAccount:function(){
    var val=document.getElementById('delete-confirm-input').value.trim();
    if(val!=='ELIMINAR'){alert('Escribe ELIMINAR para confirmar');return;}
    var u=getSession();saveUsers(getUsers().filter(function(x){return x.id!==u.id;}));
    clearSession();TotAuth.closeProfile();TotAuth._updateBtn();TotAuth.showToast('Cuenta eliminada');
  },
  logout:function(){clearSession();document.getElementById('tot-dropdown').classList.remove('open');TotAuth._updateBtn();},

  closeOnBg:function(e,id){if(e.target.id===id)document.getElementById(id).classList.remove('open');},
  checkUsername:function(input){
    var v=input.value.trim();
    var errMap={'reg-user':'reg-user-err','reg-s2b-user':'reg-s2b-user-err'};
    var errId=errMap[input.id];var err=errId&&document.getElementById(errId);if(!err)return;
    if(v&&(!isValidUsername(v)||TotAuth._userExists(v))){err.classList.add('show');input.classList.add('error');}
    else{err.classList.remove('show');input.classList.remove('error');}
  },
  checkPwd:function(input){
    var p=input.value;
    var bars=['pb1','pb2','pb3'].map(function(id){return document.getElementById(id);});
    var label=document.getElementById('pwd-label');
    bars.forEach(function(b){if(b)b.className='tot-pwd-bar';});
    if(!p){if(label){label.style.color='rgba(255,255,255,.22)';label.textContent='Seguridad de contraseña';}return;}
    var score=0;if(p.length>=8)score++;if(/[A-Z]/.test(p)&&/[0-9]/.test(p))score++;if(p.length>=12&&/[^a-zA-Z0-9]/.test(p))score++;
    var levels=['weak','medium','strong'],labels=['Débil','Media','Fuerte'],colors=['rgba(255,80,80,.8)','rgba(255,170,0,.8)','rgba(76,255,145,.8)'];
    for(var i=0;i<score;i++){if(bars[i])bars[i].classList.add(levels[score-1]);}
    if(label){label.textContent=labels[score-1]||'Débil';label.style.color=colors[score-1]||colors[0];}
  },
  togglePwd:function(id,btn){var inp=document.getElementById(id);if(!inp)return;inp.type=inp.type==='password'?'text':'password';btn.textContent=inp.type==='password'?'👁':'🙈';},
  showToast:function(msg){
    var t=document.getElementById('tot-toast');if(!t)return;
    t.textContent=msg;t.classList.add('show');
    setTimeout(function(){t.classList.remove('show');},3200);
  },
  _emailExists:function(e){return getUsers().some(function(u){return u.email===e;});},
  _userExists:function(u){return getUsers().some(function(x){return x.username===u;});},
  _updateBtn:function(){
    var u=getSession();
    var btn=document.getElementById('tot-user-btn');
    var letter=document.getElementById('tot-avatar-letter');
    var ddOut=document.getElementById('tot-dd-out');
    var ddIn=document.getElementById('tot-dd-in');
    if(u){
      btn.classList.add('logged-in');
      letter.textContent=(u.username||'?')[0].toUpperCase();
      ddOut.style.display='none';ddIn.style.display='block';
      document.getElementById('tot-dd-uname').textContent='@'+(u.username||'');
      document.getElementById('tot-dd-fan').textContent=u.fanNum||'';
      var wm=document.getElementById('inicio-welcome-msg');
      if(wm)wm.textContent='Hola, @'+u.username;
      var wa=document.getElementById('inicio-auth-area');
      var wi=document.getElementById('inicio-welcome');
      if(wa&&wi){wa.style.display='none';wi.style.display='flex';}
    }else{
      btn.classList.remove('logged-in');letter.textContent='?';
      ddOut.style.display='block';ddIn.style.display='none';
      var wa2=document.getElementById('inicio-auth-area');
      var wi2=document.getElementById('inicio-welcome');
      if(wa2&&wi2){wa2.style.display='block';wi2.style.display='none';}
    }
  }
};


// Keyboard: Escape closes any open modal
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  if (document.getElementById('tot-reg-backdrop').classList.contains('open')) TotAuth.closeRegister();
  else if (document.getElementById('tot-log-backdrop').classList.contains('open')) TotAuth.closeLogin();
  else if (document.getElementById('tot-prof-backdrop').classList.contains('open')) TotAuth.closeProfile();
});

TotAuth._updateBtn();
})();
