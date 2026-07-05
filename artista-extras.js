// artista-extras.js — ES Module, Firestore-backed votes & comments
import {
  getMyVoteData, castVote, getTotalVotes, getAllVoteTotals,
  listenTopFans, listenComments,
  addComment as fbAddComment,
  getCommentCountToday, incrementCommentCount,
  getArtistName, reportComment as fbReportComment,
  deleteComment as fbDeleteComment,
  resetArtistVotes as fbResetArtistVotes
} from './votes-firebase.js?v=6';

var artistId  = document.body.dataset.artistId || 'artista1';
var CMT_LIMIT = 5;

// Unsubscribe handles for real-time listeners
var _unsubFans = null;
var _unsubCmts = null;

/* ── AUTH ─────────────────────────────────────────────────────── */
function getUser()     { return window._totCurrentUser || null; }
function getIsMember() { var u = getUser(); return !!(u && (u.isMember || u.isAdmin)); }
function getUsername() { var u = getUser(); return u ? ('@' + u.username) : null; }
function getUid()      { var u = getUser(); return u ? u.uid : null; }

/* ── XSS PROTECTION ──────────────────────────────────────────── */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── INJECT STYLES ───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById('tot-artista-styles')) return;
  var s = document.createElement('style');
  s.id = 'tot-artista-styles';
  s.textContent = [
    /* ── VOTE CARD (paso2) — glass sobre fondo claro, igual sección 5 ── */
    '.vote-area{position:relative;margin-top:0;display:flex;flex-direction:column;align-items:center;gap:16px;',
    'padding:32px 32px 24px;border-radius:16px;min-width:220px;overflow:hidden;',
    'background:rgba(200,108,255,.05);backdrop-filter:blur(24px);',
    'box-shadow:inset 2px 2px 0.5px -2px rgba(255,255,255,.8),inset -2px -2px 0.5px -2px rgba(255,255,255,.25),',
    'inset 0 0 12px 4px rgba(200,108,255,.06),0 0 0 1px rgba(200,108,255,.18),',
    '0 12px 48px rgba(0,0,0,.07),0 0 60px rgba(200,108,255,.1);}',
    '.vote-area::before{content:"";position:absolute;top:0;left:8%;right:8%;height:1px;',
    'background:linear-gradient(to right,transparent,rgba(200,108,255,.7),transparent);border-radius:50%}',
    '.vote-counter{font-family:"JetBrains Mono",monospace;color:#000;text-align:center;margin:0;',
    'display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;z-index:1}',
    '.vote-counter strong{font-size:32px;font-weight:700;color:#c86cff;letter-spacing:-.02em;line-height:1}',
    '.vote-counter-label{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#888}',
    /* ── LIQUID GLASS BUTTON (light bg version, igual .upsell-cta de sección 5) ── */
    '.va-btn{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;',
    'letter-spacing:.2em;text-transform:uppercase;padding:14px 28px;border:none;border-radius:12px;',
    'cursor:none!important;display:inline-flex;align-items:center;justify-content:center;gap:9px;',
    'position:relative;z-index:1;text-decoration:none;',
    'color:#c86cff;background:rgba(200,108,255,.09);backdrop-filter:blur(20px);',
    'box-shadow:inset 2px 2px 0.5px -2px rgba(255,255,255,.75),inset -2px -2px 0.5px -2px rgba(255,255,255,.2),',
    'inset 1px 1px 1px -0.5px rgba(255,255,255,.55),inset -1px -1px 1px -0.5px rgba(255,255,255,.22),',
    'inset 0 0 10px 4px rgba(200,108,255,.08),0 0 0 1px rgba(200,108,255,.28),',
    '0 6px 28px rgba(0,0,0,.1),0 0 28px rgba(200,108,255,.28);',
    'transition:all .35s cubic-bezier(.34,1.2,.64,1);animation:vapulse 3s ease-in-out infinite;',
    'white-space:nowrap}',
    '.va-btn::before{content:"";position:absolute;top:0;left:12%;right:12%;height:1px;',
    'background:linear-gradient(to right,transparent,rgba(200,108,255,.65),transparent);border-radius:50%}',
    '.va-btn:hover{background:rgba(200,108,255,.15);transform:translateY(-2px) scale(1.02);',
    'box-shadow:inset 2px 2px 0.5px -2px rgba(255,255,255,.85),inset 0 0 14px 6px rgba(200,108,255,.12),',
    '0 0 0 1px rgba(200,108,255,.5),0 8px 36px rgba(0,0,0,.12),0 0 50px rgba(200,108,255,.45)}',
    '.va-btn:active{transform:translateY(0) scale(.99)}',
    '.va-btn[disabled]{opacity:.4;animation:none;cursor:not-allowed!important}',
    '.va-btn-copied{color:#16a34a!important;background:rgba(22,163,74,.1)!important;animation:none!important;',
    'box-shadow:0 0 0 1px rgba(22,163,74,.4),0 0 20px rgba(22,163,74,.15)!important}',
    '@keyframes vapulse{0%,100%{box-shadow:inset 2px 2px 0.5px -2px rgba(255,255,255,.75),',
    'inset 0 0 10px 4px rgba(200,108,255,.08),0 0 0 1px rgba(200,108,255,.22),',
    '0 6px 28px rgba(0,0,0,.08),0 0 22px rgba(200,108,255,.2)}',
    '50%{box-shadow:inset 2px 2px 0.5px -2px rgba(255,255,255,.85),',
    'inset 0 0 12px 5px rgba(200,108,255,.14),0 0 0 1px rgba(200,108,255,.42),',
    '0 6px 28px rgba(0,0,0,.1),0 0 40px rgba(200,108,255,.38)}}',
    '.va-legend{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.12em;',
    'color:#999;text-transform:uppercase;text-align:center;margin:0;position:relative;z-index:1}',
    '#paso2 .paso-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap}',
    '.ph-left{display:flex;align-items:baseline;gap:24px}',
    '.resumen-block{margin-top:72px;padding-top:56px;border-top:1px solid rgba(0,0,0,.1);',
    'display:flex;flex-direction:column;gap:20px}',
    '.resumen-eyebrow{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.3em;',
    'color:#666;text-transform:uppercase;display:flex;align-items:center;gap:14px}',
    '.resumen-eyebrow::before{content:"";display:block;width:30px;height:1px;background:#c86cff}',
    '.resumen-quote-big{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-weight:700;',
    'font-size:clamp(22px,3.5vw,42px);letter-spacing:-.02em;line-height:1.2;',
    'font-style:italic;color:#000;max-width:900px}',
    '.resumen-attr{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.15em;',
    'color:#999;text-transform:uppercase}',
    '.community-section{position:relative;overflow:hidden}',
    '.community-section::before{content:"";position:absolute;inset:0;pointer-events:none;',
    'background:radial-gradient(ellipse 60% 50% at 50% 100%,rgba(200,108,255,.07) 0%,transparent 70%);',
    'animation:sect-glow 5s ease-in-out infinite alternate}',
    '@keyframes sect-glow{0%{opacity:.6;transform:scale(1)}100%{opacity:1;transform:scale(1.05)}}',
    '.community-section::after{content:"";position:absolute;top:0;left:0;right:0;height:1px;',
    'background:linear-gradient(to right,transparent,rgba(200,108,255,.5) 30%,rgba(200,108,255,.8) 50%,rgba(200,108,255,.5) 70%,transparent);',
    'animation:border-glow 3s ease-in-out infinite alternate}',
    '@keyframes border-glow{0%{opacity:.4;filter:blur(0px)}100%{opacity:1;filter:blur(1px)}}',
    '.community-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;position:relative;z-index:1}',
    /* ── TOP FANS AVATAR GRID ── */
    '.fan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 12px;',
    'max-height:420px;overflow-y:auto;padding-right:4px}',
    '.fan-grid::-webkit-scrollbar{width:3px}',
    '.fan-grid::-webkit-scrollbar-track{background:transparent}',
    '.fan-grid::-webkit-scrollbar-thumb{background:rgba(200,108,255,.3);border-radius:3px}',
    '.fan-item{display:flex;flex-direction:column;align-items:center;gap:6px;position:relative}',
    '.fan-avatar{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:16px;font-weight:700;color:#fff;',
    'position:relative;flex-shrink:0;transition:transform .2s}',
    '.fan-avatar:hover{transform:scale(1.08)}',
    '.fan-avatar.top-glow{animation:top-pulse 2.4s ease-in-out infinite alternate}',
    '@keyframes top-pulse{',
    '0%{filter:drop-shadow(0 0 4px rgba(200,108,255,.35))}',
    '100%{filter:drop-shadow(0 0 10px rgba(200,108,255,.6))}}',
    '.fan-avatar.top-1{animation-duration:1.8s}',
    '.fan-avatar.top-2{animation-duration:2.4s}',
    '.fan-avatar.top-3{animation-duration:3s}',
    '.fan-uname{font-family:"JetBrains Mono",monospace;font-size:9px;color:#333;letter-spacing:.04em;',
    'text-align:center;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.fan-count{font-family:"JetBrains Mono",monospace;font-size:8px;color:#c86cff;font-weight:700;',
    'letter-spacing:.06em;text-align:center}',
    '.fan-pos-num{position:absolute;top:-5px;left:50%;transform:translateX(-50%);',
    'font-family:"JetBrains Mono",monospace;font-size:8px;font-weight:700;color:rgba(255,255,255,.7);',
    'background:rgba(0,0,0,.35);border-radius:4px;padding:1px 4px;letter-spacing:.05em}',
    '.empty-state{font-family:"JetBrains Mono",monospace;font-size:11px;color:#aaa;padding:20px 0}',
    /* ── SCORE TOT CARD ── */
    '.tot-score-card{display:flex;flex-direction:column;gap:22px;padding:28px 28px 24px;border-radius:14px;',
    'background:rgba(200,108,255,.04);border:1px solid rgba(200,108,255,.15);margin:4px 0}',
    '.score-header{display:flex;align-items:center;justify-content:space-between;gap:12px}',
    '.score-title{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-weight:700;',
    'font-size:clamp(18px,2.5vw,26px);letter-spacing:-.01em;color:#000;text-transform:uppercase}',
    '.score-breakdown{display:flex;flex-direction:column;gap:12px}',
    '.score-row{display:grid;grid-template-columns:110px 1fr 40px;align-items:center;gap:12px}',
    '.score-row-label{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.1em;',
    'color:#555;text-transform:uppercase}',
    '.score-bar{height:4px;background:rgba(0,0,0,.08);border-radius:2px;overflow:hidden}',
    '.score-bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#c86cff,#7c3aed);',
    'transition:width .9s cubic-bezier(.34,1.2,.64,1)}',
    '.score-row-val{font-family:"JetBrains Mono",monospace;font-size:13px;font-weight:700;',
    'color:#000;text-align:right;letter-spacing:.02em}',
    '.score-row-val.fan-val{color:#c86cff}',
    '.score-footer{display:flex;flex-direction:column;align-items:flex-end;gap:4px;',
    'padding-top:16px;border-top:1px solid rgba(0,0,0,.07)}',
    '.score-avg-num{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-weight:700;',
    'font-size:36px;letter-spacing:-.02em;color:#c86cff;line-height:1}',
    '.score-avg-label{font-family:"JetBrains Mono",monospace;font-size:8px;letter-spacing:.2em;',
    'color:#aaa;text-transform:uppercase}',
    '.score-pending{font-family:"JetBrains Mono",monospace;font-size:9px;color:#aaa;',
    'letter-spacing:.04em;text-align:right;margin-top:4px}',
    /* ── INFO BUTTON ── */
    '.comm-col-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:1px solid rgba(0,0,0,.1);margin-bottom:20px}',
    '.comm-col-title{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:22px;font-weight:700;',
    'letter-spacing:-.01em;color:#000;padding-bottom:0;border-bottom:none;margin-bottom:0}',
    '.info-btn{width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(200,108,255,.5);',
    'background:rgba(200,108,255,.08);color:#c86cff;font-size:11px;font-weight:700;',
    'cursor:none!important;display:flex;align-items:center;justify-content:center;',
    'position:relative;flex-shrink:0;transition:all .2s}',
    '.info-btn:hover{background:rgba(200,108,255,.18);border-color:#c86cff}',
    '.info-tooltip{position:absolute;top:28px;right:0;width:220px;',
    'background:#fff;border:1px solid rgba(200,108,255,.25);border-radius:10px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.12),0 0 20px rgba(200,108,255,.1);',
    'padding:14px 16px;z-index:100;display:none}',
    '.info-tooltip p{font-family:"JetBrains Mono",monospace;font-size:10px;color:#444;line-height:1.7;margin:0;text-transform:none;letter-spacing:normal}',
    '.info-btn:hover .info-tooltip,.info-btn:focus .info-tooltip{display:block}',
    /* ── COMMENT ALERT ── */
    '.cmt-alert{display:none;font-family:"JetBrains Mono",monospace;font-size:10px;color:#dc2626;',
    'background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.25);border-radius:8px;',
    'padding:10px 14px;margin-top:8px;letter-spacing:.02em;line-height:1.5}',
    /* ── REPORT BUTTON ── */
    '.cmt-report{font-family:"JetBrains Mono",monospace;font-size:8px;letter-spacing:.1em;',
    'color:#bbb;background:none;border:none;cursor:none!important;padding:2px 0;',
    'text-transform:uppercase;transition:color .2s;display:block;margin-top:4px}',
    '.cmt-report:hover{color:#dc2626}',
    '.cmt-actions{display:flex;gap:10px;align-items:center}',
    '.cmt-delete{font-family:"JetBrains Mono",monospace;font-size:8px;letter-spacing:.1em;',
    'color:#bbb;background:none;border:none;cursor:pointer;padding:2px 0;',
    'text-transform:uppercase;transition:color .2s;display:block;margin-top:4px}',
    '.cmt-delete:hover{color:#c86cff}',
    /* ── ADMIN BAR ── */
    '#tot-admin-bar{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:12px;',
    'background:rgba(200,108,255,.12);backdrop-filter:blur(20px);border:1px solid rgba(200,108,255,.35);',
    'border-radius:12px;padding:10px 16px;box-shadow:0 4px 24px rgba(200,108,255,.2)}',
    '.admin-bar-label{font-family:"JetBrains Mono",monospace;font-size:8px;letter-spacing:.3em;',
    'color:#c86cff;text-transform:uppercase}',
    '.admin-bar-btn{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.1em;',
    'text-transform:uppercase;background:rgba(200,108,255,.15);color:#c86cff;border:1px solid rgba(200,108,255,.4);',
    'border-radius:8px;padding:6px 12px;cursor:pointer;transition:all .2s}',
    '.admin-bar-btn:hover{background:rgba(200,108,255,.28)}',
    /* ── ADMIN MODAL ── */
    '#tot-admin-modal{display:none;position:fixed;inset:0;z-index:10000;align-items:center;justify-content:center;',
    'background:rgba(0,0,0,.45);backdrop-filter:blur(6px)}',
    '.admin-modal-box{background:#fff;border-radius:16px;padding:32px;width:min(90vw,420px);',
    'box-shadow:0 20px 60px rgba(0,0,0,.2),0 0 0 1px rgba(200,108,255,.2)}',
    '.admin-modal-title{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-weight:700;font-size:16px;margin:0 0 8px}',
    '.admin-modal-sub{font-family:"JetBrains Mono",monospace;font-size:11px;color:#666;margin:0 0 20px;line-height:1.6}',
    '.admin-modal-input{width:100%;box-sizing:border-box;font-family:"JetBrains Mono",monospace;font-size:13px;',
    'border:1px solid rgba(200,108,255,.4);border-radius:8px;padding:10px 14px;outline:none;',
    'transition:border .2s;margin-bottom:6px}',
    '.admin-modal-input:focus{border-color:#c86cff}',
    '.admin-modal-err{font-family:"JetBrains Mono",monospace;font-size:10px;color:#dc2626;min-height:16px;margin-bottom:16px}',
    '.admin-modal-actions{display:flex;gap:10px;justify-content:flex-end}',
    '.admin-modal-cancel{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;',
    'background:none;border:1px solid #ddd;border-radius:8px;padding:8px 16px;cursor:pointer;color:#666;transition:all .2s}',
    '.admin-modal-cancel:hover{border-color:#999;color:#333}',
    '.admin-modal-confirm{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;',
    'background:#c86cff;color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;transition:all .2s}',
    '.admin-modal-confirm:hover{background:#b44ee8}.admin-modal-confirm:disabled{opacity:.5;cursor:not-allowed}',
    '.cmt-ticker-wrap{height:300px;overflow:hidden;position:relative}',
    '.cmt-ticker-wrap::after{content:"";position:absolute;bottom:0;left:0;right:0;height:60px;',
    'background:linear-gradient(to top,#fff,transparent);pointer-events:none}',
    '.cmt-ticker{will-change:transform}',
    '.cmt-card{padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06)}',
    '.cmt-uname{font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;color:#c86cff;',
    'letter-spacing:.08em;display:block;margin-bottom:5px}',
    '.cmt-body{font-family:"JetBrains Mono",monospace;font-size:11px;color:#333;line-height:1.75;margin:0}',
    '.cmt-form{display:flex;gap:0;margin-top:16px;border:1px solid rgba(0,0,0,.15)}',
    '.cmt-input{flex:1;font-family:"JetBrains Mono",monospace;font-size:11px;padding:10px 14px;',
    'border:none;background:#fff;color:#000;outline:none}',
    '.cmt-limit-note{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.1em;',
    'color:#bbb;margin-top:8px;text-align:right}',
    '.cmt-btn{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:700;',
    'letter-spacing:.12em;padding:10px 18px;background:#000;color:#fff;border:none;',
    'cursor:none!important;transition:background .2s;white-space:nowrap}',
    '.cmt-btn:hover{background:#c86cff}',
    '.cmt-btn[disabled]{opacity:.4;cursor:not-allowed!important;background:#999}',
    /* ── MEMBER UPSELL CARD ── */
    '.member-upsell{display:flex;flex-direction:column;align-items:flex-start;gap:20px;padding:36px 32px;',
    'border-radius:16px;position:relative;overflow:hidden;',
    'background:rgba(200,108,255,.05);backdrop-filter:blur(24px);',
    'box-shadow:',
    '  inset 2px 2px 0.5px -2px rgba(255,255,255,.8),',
    '  inset -2px -2px 0.5px -2px rgba(255,255,255,.25),',
    '  inset 0 0 12px 4px rgba(200,108,255,.06),',
    '  0 0 0 1px rgba(200,108,255,.18),',
    '  0 12px 48px rgba(0,0,0,.07),',
    '  0 0 60px rgba(200,108,255,.1);}',
    '.member-upsell::before{content:"";position:absolute;top:0;left:8%;right:8%;height:1px;',
    'background:linear-gradient(to right,transparent,rgba(200,108,255,.7),transparent);border-radius:50%}',
    '.member-upsell::after{content:"";position:absolute;inset:-1px;border-radius:16px;',
    'background:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(200,108,255,.1),transparent 70%);',
    'pointer-events:none;z-index:0}',
    '.upsell-eye{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.35em;color:#c86cff;',
    'text-transform:uppercase;margin:0;position:relative;z-index:1}',
    '.upsell-desc{font-family:"JetBrains Mono",monospace;font-size:11px;color:#555;line-height:1.8;margin:0;',
    'position:relative;z-index:1;max-width:340px}',
    /* ── LIQUID GLASS CTA BUTTON ── */
    '.upsell-cta{position:relative;z-index:1;display:inline-flex;align-items:center;gap:9px;text-decoration:none;',
    'font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;',
    'letter-spacing:.2em;text-transform:uppercase;padding:14px 28px;border-radius:12px;',
    'color:#c86cff;',
    'background:rgba(200,108,255,.09);backdrop-filter:blur(20px);',
    'box-shadow:',
    '  inset 2px 2px 0.5px -2px rgba(255,255,255,.75),',
    '  inset -2px -2px 0.5px -2px rgba(255,255,255,.2),',
    '  inset 1px 1px 1px -0.5px rgba(255,255,255,.55),',
    '  inset -1px -1px 1px -0.5px rgba(255,255,255,.22),',
    '  inset 0 0 10px 4px rgba(200,108,255,.08),',
    '  0 0 0 1px rgba(200,108,255,.28),',
    '  0 6px 28px rgba(0,0,0,.1),',
    '  0 0 28px rgba(200,108,255,.28);',
    'transition:all .35s cubic-bezier(.34,1.2,.64,1);',
    'animation:vpulse 3s ease-in-out infinite}',
    '.upsell-cta::before{content:"";position:absolute;top:0;left:12%;right:12%;height:1px;',
    'background:linear-gradient(to right,transparent,rgba(200,108,255,.65),transparent);',
    'border-radius:50%;pointer-events:none}',
    '.upsell-cta::after{content:"";position:absolute;bottom:0;left:12%;right:12%;height:1px;',
    'background:linear-gradient(to right,transparent,rgba(0,0,0,.15),transparent);',
    'border-radius:50%;pointer-events:none}',
    '.upsell-cta:hover{background:rgba(200,108,255,.15);transform:translateY(-2px) scale(1.02);',
    'box-shadow:',
    '  inset 2px 2px 0.5px -2px rgba(255,255,255,.85),',
    '  inset 0 0 14px 6px rgba(200,108,255,.12),',
    '  0 0 0 1px rgba(200,108,255,.5),',
    '  0 8px 36px rgba(0,0,0,.12),',
    '  0 0 50px rgba(200,108,255,.45)}',
    '.upsell-cta:active{transform:translateY(0) scale(.99)}',
    '.community-cta{position:relative;z-index:1}',
    '.vote-total-public{display:none}',
    '@media(max-width:768px){.community-grid{grid-template-columns:1fr;gap:40px}',
    '.cmt-ticker-wrap{height:220px}.vote-area{align-items:flex-start}',
    '.vote-legend{text-align:left}.resumen-quote-big{font-size:clamp(18px,5vw,28px)}}',
  ].join('');
  document.head.appendChild(s);
}

/* ── BOTÓN COMPARTIR ─────────────────────────────────────────── */
function buildShareBtn(container) {
  var btn = document.createElement('button');
  btn.className = 'share-btn';
  btn.innerHTML = '↗ Invitar a votar';
  btn.addEventListener('click', function () {
    var url = window.location.href.split('?')[0];
    var copy = function (text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      }
    };
    var done = function () {
      btn.innerHTML = '✓ Link copiado';
      btn.classList.add('copied');
      setTimeout(function () { btn.innerHTML = '↗ Invitar a votar'; btn.classList.remove('copied'); }, 2500);
    };
    copy(url);
  });
  container.appendChild(btn);
}

/* ── 1. VOTE BUTTON ──────────────────────────────────────────── */
function startVoteDotMatrix(card) {
  var prev = card.querySelector('canvas');
  if (prev) prev.remove();
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.15;border-radius:14px';
  card.insertBefore(canvas, card.firstChild);
  var ctx = canvas.getContext('2d');
  var DOT = 2.5, GRID = 18;
  var cols, rows, dots = [], startTime = Date.now(), running = true;
  function resize() {
    var rect = card.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    cols = Math.ceil(rect.width / GRID); rows = Math.ceil(rect.height / GRID);
    dots = [];
    var cx = cols / 2, cy = rows / 2;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var d = Math.sqrt(Math.pow(c - cx, 2) + Math.pow(r - cy, 2));
      dots.push({ c: c, r: r, delay: d * .05 + Math.random() * .4, target: .2 + Math.random() * .8 });
    }
  }
  function draw() {
    if (!running || !canvas.isConnected) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var t = (Date.now() - startTime) / 1000;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var p = Math.max(0, Math.min(1, (t - d.delay) * 1.8));
      var op = p * d.target;
      if (op < .01) continue;
      if (t > d.delay + 3 + Math.random() * 2) { d.target = .2 + Math.random() * .8; d.delay = t + Math.random() * .5; }
      ctx.beginPath();
      ctx.arc(d.c * GRID + GRID / 2, d.r * GRID + GRID / 2, DOT / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,108,255,' + Math.min(1, op) + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); draw();
}

async function updateHeroRank() {
  try {
    var totals = await getAllVoteTotals();
    var sorted = Object.keys(totals).sort(function(a, b) {
      return (totals[b] || 0) - (totals[a] || 0);
    });
    var rank = sorted.indexOf(artistId) + 1;
    if (rank < 1) rank = sorted.length;
    var el = document.querySelector('.hero-rank');
    if (el) { el.textContent = '#' + String(rank).padStart(2, '0') + ' TOP OF TALENT'; el.style.visibility = 'visible'; }
    updateScoreBlock(rank, sorted.length);
    updateNextArtist(sorted, rank);
  } catch(e) { /* keep hidden */ }
}

async function updateNextArtist(sorted, rank) {
  // Next in vote order (wraps to first if current is last)
  var nextId = sorted[rank % sorted.length];
  if (!nextId || nextId === artistId) return;
  var nombre = await getArtistName(nextId);

  var btnNext = document.querySelector('.btn-next');
  if (btnNext) {
    btnNext.href = nextId + '.html';
    btnNext.textContent = 'Siguiente: ' + nombre + ' →';
    btnNext.style.display = '';
  }

  var nextArtistEl = document.querySelector('a.next-artist');
  if (nextArtistEl) {
    nextArtistEl.href = nextId + '.html';
    var nextName = nextArtistEl.querySelector('.next-name');
    if (nextName) nextName.textContent = nombre;
    nextArtistEl.style.display = '';
  }
}

function updateScoreBlock(rank, total) {
  var block = document.getElementById('tot-score-block');
  if (!block) return;

  var sd = window._totScoreData || {};
  var scoreTot      = (typeof sd.tot      === 'number') ? sd.tot      : null;
  var scoreCriticos = (typeof sd.criticos === 'number') ? sd.criticos : null;

  var n = Math.max(total, 1);
  var scoreFans = Math.round(100 - ((rank - 1) / Math.max(n - 1, 1)) * 90);

  var hasFinal = scoreTot !== null && scoreCriticos !== null;
  var avg = hasFinal
    ? Math.round((scoreTot * 0.25 + scoreCriticos * 0.25 + scoreFans * 0.50) * 10) / 10
    : null;

  function row(label, val, isFan) {
    var pct = val !== null ? val : 0;
    return '<div class="score-row">' +
      '<span class="score-row-label">' + label + '</span>' +
      '<div class="score-bar"><div class="score-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="score-row-val' + (isFan ? ' fan-val' : '') + '">' + (val !== null ? val : '--') + '</span>' +
    '</div>';
  }

  var infoTooltipText = 'El Score TOT refleja el nivel artistico y proyeccion del artista. Combina la valoracion del equipo editorial de Top of Talent, la opinion de criticos del medio musical ecuatoriano, y el respaldo de los fans a traves de sus votos. Es un promedio ponderado que se actualiza mensualmente.';

  block.innerHTML =
    '<div class="tot-score-card">' +
      '<div class="score-header">' +
        '<span class="score-title">Score Top of Talent</span>' +
        '<div class="info-btn" tabindex="0">ⓘ' +
          '<div class="info-tooltip"><p>' + infoTooltipText + '</p></div>' +
        '</div>' +
      '</div>' +
      '<div class="score-breakdown">' +
        row('TOT Editorial', scoreTot, false) +
        row('Criticos', scoreCriticos, false) +
        row('Fans', scoreFans, true) +
      '</div>' +
      '<div class="score-footer">' +
        '<span class="score-avg-label">Promedio general</span>' +
        '<span class="score-avg-num">' + (avg !== null ? avg : '--') + '</span>' +
        (!hasFinal ? '<p class="score-pending">En espera de calificacion de criticos y editores</p>' : '') +
      '</div>' +
    '</div>';
}

var _voteToken = null;
async function buildVoteArea() {
  var token = {};
  _voteToken = token;

  var p2 = document.getElementById('paso2');
  if (!p2) return;
  var ph = p2.querySelector('.paso-header');
  if (!ph) return;

  // Synchronously reserve slot — prevents race-condition duplicates
  ph.querySelectorAll('.vote-area').forEach(function(el) { el.remove(); });

  // Keep title on the left
  var phLeft = ph.querySelector('.ph-left');
  if (!phLeft) {
    phLeft = document.createElement('div');
    phLeft.className = 'ph-left';
    while (ph.firstChild) phLeft.appendChild(ph.firstChild);
    ph.appendChild(phLeft);
  }

  var total = await getTotalVotes(artistId);
  if (_voteToken !== token) return; // superseded by a newer call

  var isMember = getIsMember();

  // Build the card
  var card = document.createElement('div');
  card.className = 'vote-area';

  var counterHTML = '<p class="vote-counter"><strong id="tot-public-votes">' + total + '</strong><span class="vote-counter-label">votos totales</span></p>';

  if (isMember) {
    var uid   = getUid();
    var vdata = await getMyVoteData(artistId, uid);
    if (_voteToken !== token) return;
    var canVote = vdata.canVote;

    if (canVote) {
      card.innerHTML = counterHTML +
        '<button id="voteBtn" class="va-btn va-btn-vote">Votar</button>';
    } else {
      card.innerHTML = counterHTML +
        '<button id="inviteBtn" class="va-btn va-btn-invite">Copiar link para invitar</button>' +
        '<p class="va-legend">Se reactiva cada 8 horas</p>';
    }

    // Wire up vote button
    var vBtn = card.querySelector('#voteBtn');
    if (vBtn) {
      vBtn.addEventListener('click', async function () {
        vBtn.disabled = true;
        vBtn.textContent = 'Votando…';
        try {
          await castVote(artistId, uid);
          // Update counter and rank
          var newTotal = await getTotalVotes(artistId);
          var pc = document.getElementById('tot-public-votes');
          if (pc) pc.textContent = newTotal;
          updateHeroRank();
          // Swap to invite state
          vBtn.remove();
          var legend = card.querySelector('.va-legend');
          if (legend) legend.remove();
          var invBtn = document.createElement('button');
          invBtn.id = 'inviteBtn';
          invBtn.className = 'va-btn va-btn-invite';
          invBtn.textContent = 'Copiar link para invitar';
          card.appendChild(invBtn);
          card.insertAdjacentHTML('beforeend', '<p class="va-legend">Se reactiva cada 8 horas</p>');
          wireInvite(invBtn);
        } catch(e) {
          vBtn.disabled = false;
          vBtn.textContent = 'Votar';
        }
      });
    }

    // Wire up invite button if already voted
    var iBtn = card.querySelector('#inviteBtn');
    if (iBtn) wireInvite(iBtn);

  } else {
    card.innerHTML = counterHTML +
      '<a href="membresia.html" class="va-btn va-btn-member">Hazte Miembro</a>' +
      '<p class="va-legend">Solo los miembros pueden votar</p>';
  }

  ph.appendChild(card);
  startVoteDotMatrix(card);
}

function wireInvite(btn) {
  btn.addEventListener('click', function () {
    navigator.clipboard.writeText(window.location.href).then(function () {
      btn.textContent = 'Link copiado';
      btn.classList.add('va-btn-copied');
      setTimeout(function () {
        btn.textContent = 'Copiar link para invitar';
        btn.classList.remove('va-btn-copied');
      }, 2500);
    });
  });
}

/* ── 2. RESUMEN DE CARRERA ───────────────────────────────────── */
function moveResumen() {
  if (document.querySelector('.resumen-block')) return; // only once
  var quoteEl = document.querySelector('#paso5 .quote-text');
  var paso4   = document.getElementById('paso4');
  if (!quoteEl || !paso4) return;

  var block = document.createElement('div');
  block.className = 'resumen-block fade-up';
  block.innerHTML =
    '<p class="resumen-eyebrow">Resumen de carrera</p>' +
    '<blockquote class="resumen-quote-big">' + quoteEl.innerHTML + '</blockquote>' +
    '<p class="resumen-attr">— Top of Talent, 2025</p>';
  paso4.appendChild(block);

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .15 });
  obs.observe(block);
}

/* ── 3. COMMUNITY SECTION ────────────────────────────────────── */
async function buildCommunity() {
  var paso5 = document.getElementById('paso5');
  if (!paso5) return;

  // Cancel previous real-time listeners
  if (_unsubFans) { _unsubFans(); _unsubFans = null; }
  if (_unsubCmts) { _unsubCmts(); _unsubCmts = null; }

  var ctaEl    = paso5.querySelector('.profile-cta');
  var ctaInner = ctaEl ? ctaEl.innerHTML : '';

  paso5.className = 'snap-section community-section';
  paso5.style.cssText = 'background:#fff;color:#000;padding:80px 40px 80px;display:flex;flex-direction:column';

  var rankHTML, cmtHTML;

  if (getIsMember()) {
    var uid  = getUid();
    var used = await getCommentCountToday(uid);
    var left = CMT_LIMIT - used;

    rankHTML = '<p class="empty-state">Cargando ranking…</p>';
    cmtHTML  =
      '<div class="cmt-ticker-wrap"><div class="cmt-ticker" id="cmtTicker"><p class="empty-state">Cargando comentarios…</p></div></div>' +
      '<div class="cmt-form">' +
        '<input id="cmtInput" class="cmt-input" type="text" placeholder="Escribe tu comentario..." maxlength="200"' + (left <= 0 ? ' disabled' : '') + '>' +
        '<button id="cmtBtn" class="cmt-btn" onclick="TotArtista.addComment()"' + (left <= 0 ? ' disabled' : '') + '>Comentar →</button>' +
      '</div>' +
      '<div class="cmt-alert" id="cmtAlert"></div>' +
      '<p class="cmt-limit-note" id="cmtLimitNote">*Máximo ' + CMT_LIMIT + ' comentarios por día · quedan ' + Math.max(0, left) + '</p>';
  } else {
    var upsell = '<div class="member-upsell">' +
      '<p class="upsell-eye">Acceso exclusivo</p>' +
      '<p class="upsell-desc">Los miembros de Top of Talent votan por sus artistas, aparecen en el ranking de fans y dejan su huella en la comunidad.</p>' +
      '<a href="membresia.html" class="upsell-cta">Hazte Miembro</a>' +
      '</div>';
    rankHTML = '<div class="member-upsell">' +
      '<p class="upsell-eye">Solo miembros</p>' +
      '<p class="upsell-desc">El ranking de fans más activos solo es visible para los miembros de Top of Talent.</p>' +
      '<a href="membresia.html" class="upsell-cta">Hazte Miembro</a>' +
      '</div>';
    cmtHTML  = upsell;
  }

  paso5.innerHTML =
    '<div class="paso-header fade-up" style="border-bottom:1px solid rgba(0,0,0,.1);padding-bottom:24px;margin-bottom:28px">' +
      '<span class="paso-num" style="color:#c86cff">05 —</span>' +
      '<h2 class="paso-title" style="color:#000">Comunidad de Fans</h2>' +
    '</div>' +
    '<div class="community-grid">' +
      '<div class="community-col">' +
        '<div class="comm-col-header">' +
          '<p class="comm-col-title">Top Fans</p>' +
          '<div class="info-btn" tabindex="0">ⓘ' +
            '<div class="info-tooltip"><p>Los fans que más votan por este artista aparecen aquí. Cada voto cuenta, mientras más apoyes, más visible serás para tu artista y su comunidad.</p></div>' +
          '</div>' +
        '</div>' +
        (getIsMember()
          ? '<div class="fan-grid" id="rankingList">' + rankHTML + '</div>'
          : '<div id="rankingList">' + rankHTML + '</div>') +
      '</div>' +
      '<div class="community-col">' +
        '<div class="comm-col-header">' +
          '<p class="comm-col-title">Comentarios de Fans</p>' +
          '<div class="info-btn" tabindex="0">ⓘ' +
            '<div class="info-tooltip"><p>Este espacio es para apoyar al artista, compartir tus experiencias y mostrar amor a su música. Los comentarios positivos pueden beneficiar su carrera. No se permite el odio ni el irrespeto de ningún tipo.</p></div>' +
          '</div>' +
        '</div>' +
        '<div class="comments-area">' + cmtHTML + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="profile-cta community-cta fade-up" style="margin-top:52px">' + ctaInner + '</div>';

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .15 });
  paso5.querySelectorAll('.fade-up').forEach(function (el) { obs.observe(el); });

  startDotMatrix();

  if (getIsMember()) {
    // Real-time ranking
    var AVATAR_GRADIENTS = [
      'linear-gradient(135deg,#c86cff,#7c3aed)',
      'linear-gradient(135deg,#f472b6,#c026d3)',
      'linear-gradient(135deg,#818cf8,#6d28d9)',
      'linear-gradient(135deg,#e879f9,#9333ea)',
      'linear-gradient(135deg,#a78bfa,#7c3aed)',
      'linear-gradient(135deg,#f0abfc,#c86cff)',
      'linear-gradient(135deg,#c084fc,#7e22ce)',
      'linear-gradient(135deg,#d946ef,#9333ea)',
      'linear-gradient(135deg,#a855f7,#6d28d9)',
      'linear-gradient(135deg,#e879f9,#7c3aed)',
      'linear-gradient(135deg,#c026d3,#9333ea)',
      'linear-gradient(135deg,#7c3aed,#4c1d95)',
      'linear-gradient(135deg,#9d4edd,#5b21b6)',
      'linear-gradient(135deg,#c86cff,#6d28d9)',
      'linear-gradient(135deg,#d8b4fe,#9333ea)',
    ];
    _unsubFans = listenTopFans(artistId, function (fans) {
      var rl = document.getElementById('rankingList');
      if (!rl) return;
      if (!fans.length) { rl.innerHTML = '<p class="empty-state">Sé el primero en votar</p>'; return; }
      rl.innerHTML = fans.map(function (f, i) {
        var letter    = (f.username || '?').replace(/^@/, '')[0].toUpperCase();
        var grad      = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
        var glowClass = i < 3 ? ' top-glow top-' + (i + 1) : '';
        var uname     = escapeHTML(f.username || '?');
        return '<div class="fan-item">' +
          '<div class="fan-avatar' + glowClass + '" style="background:' + grad + '">' +
            letter +
          '</div>' +
          '<span class="fan-uname">' + uname + '</span>' +
          '<span class="fan-count">' + f.total + ' voto' + (f.total !== 1 ? 's' : '') + '</span>' +
        '</div>';
      }).join('');
    });

    // Real-time comments
    _unsubCmts = listenComments(artistId, function (comments) {
      var ticker = document.getElementById('cmtTicker');
      if (!ticker) return;
      if (!comments.length) {
        ticker.innerHTML = '<p class="empty-state">Sé el primero en comentar</p>';
        return;
      }
      var isAdmin = !!(window._totCurrentUser && window._totCurrentUser.isAdmin);
      ticker.innerHTML = comments.map(function (cm) {
        var id = cm.id || Math.random().toString(36).slice(2);
        var deletBtn = isAdmin
          ? '<button class="cmt-delete" data-cid="' + escapeHTML(id) + '">· Eliminar</button>'
          : '';
        return '<div class="cmt-card">' +
          '<span class="cmt-uname">' + escapeHTML(cm.u) + '</span>' +
          '<p class="cmt-body">' + escapeHTML(cm.t) + '</p>' +
          '<div class="cmt-actions">' +
            '<button class="cmt-report" data-cid="' + escapeHTML(id) + '" data-user="' + escapeHTML(cm.u) + '">· Reportar</button>' +
            deletBtn +
          '</div>' +
        '</div>';
      }).join('');

      // Delegated click — safe regardless of username characters
      ticker.onclick = function(e) {
        var reportBtn = e.target.closest('.cmt-report');
        if (reportBtn && !reportBtn.disabled) {
          window.TotArtista.reportComment(reportBtn.dataset.cid, reportBtn.dataset.user);
          return;
        }
        var delBtn = e.target.closest('.cmt-delete');
        if (delBtn && !delBtn.disabled) {
          window.TotArtista.deleteComment(delBtn.dataset.cid);
        }
      };

      startTicker();
    });
  }
}

/* ── DOT MATRIX BACKGROUND ───────────────────────────────────── */
function startDotMatrix() {
  var section = document.getElementById('paso5');
  if (!section) return;
  // Remove existing canvas if rebuilding
  var prev = section.querySelector('canvas');
  if (prev) prev.remove();

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.18';
  section.style.position = 'relative';
  section.insertBefore(canvas, section.firstChild);

  var ctx = canvas.getContext('2d');
  var DOT = 3, GRID = 22;
  var cols, rows, dots = [], startTime = Date.now();
  var running = true;

  function resize() {
    var rect = section.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    cols = Math.ceil(rect.width / GRID);
    rows = Math.ceil(rect.height / GRID);
    buildDots();
  }
  function buildDots() {
    dots = [];
    var cx = cols / 2, cy = rows / 2;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var d = Math.sqrt(Math.pow(c - cx, 2) + Math.pow(r - cy, 2));
      dots.push({ c: c, r: r, delay: d * .04 + Math.random() * .3, target: .2 + Math.random() * .8 });
    }
  }
  function draw() {
    if (!running || !canvas.isConnected) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var t = (Date.now() - startTime) / 1000;
    var opLevels = [.05,.1,.18,.28,.38,.5,.62,.75,.88,1];
    for (var i = 0; i < dots.length; i++) {
      var d  = dots[i];
      var p  = Math.max(0, Math.min(1, (t - d.delay) * 1.8));
      var op = p * d.target;
      if (op < .01) continue;
      var opIdx = Math.min(9, Math.floor(op * 10));
      if (t > d.delay + 3 + Math.random() * 2) { d.target = .2 + Math.random() * .8; d.delay = t + Math.random() * .5; }
      ctx.beginPath();
      ctx.arc(d.c * GRID + GRID / 2, d.r * GRID + GRID / 2, DOT / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,108,255,' + opLevels[opIdx] + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize);
  draw();
}

/* ── TICKER ANIMATION ────────────────────────────────────────── */
var _tickerRunning = false;
function startTicker() {
  if (_tickerRunning) return;
  _tickerRunning = true;
  setTimeout(function () {
    var ticker = document.getElementById('cmtTicker');
    if (!ticker) { _tickerRunning = false; return; }
    var halfH = ticker.scrollHeight / 2;
    var pos   = 0;
    (function tick() {
      if (!ticker.isConnected) { _tickerRunning = false; return; }
      pos += 0.45;
      if (pos >= halfH) pos = 0;
      ticker.style.transform = 'translateY(-' + pos + 'px)';
      requestAnimationFrame(tick);
    })();
  }, 400);
}

/* ── BAD WORD FILTER ─────────────────────────────────────────── */
var BAD_WORDS = [
  // ── Ecuatorianas / jerga local ──────────────────────────────────
  'mmvrg','mvrg','mamaverga','mama verga','mama v','mam4verga',
  'hijueputa','hijuepcha','hijuep','h1jueputa','hp','h.p.','h,p',
  'gonorrea','gonore','g0norrea',
  'malparido','malparida','malpari',
  'monda','mondá','care monda','caremonda',
  'chucha','chuchita','chuche','ch0cha',
  'culiao','culiado','ql','q.l.','culia0',
  'verga','v3rga','vergota',
  'mecachis','miechica','mechica','méchica',
  'sapo','sapaso','sapazo',
  'conchetumare','conchetumadre',
  'huevon','huevón','weon','weón','huevas','hueva','hu3von',
  'pichurria','pichurri',
  'pendejo','pendeja','pend3jo',
  'ñaño malo','ladrón','ladron',
  // ── Generales español ───────────────────────────────────────────
  'idiota','idiot4','1diota',
  'imbecil','imbécil','imb3cil',
  'estupido','estúpido','3stupido',
  'mierda','mi3rda','mrd','mrda',
  'puta','put4','p.u.t.a','puto','put0',
  'maldito','maldita','maldit0',
  'cabron','cabrón','cabr0n',
  'hdp','hijodeputa','hijo de puta','hijadeputa',
  'bastardo','bastarda',
  'inutil','inútil',
  'malparido','malparida',
  'desgraciado','desgraciada',
  'zorra','p3rra','perra','p.e.r.r.a',
  'cerdo','cerda',
  'marica','maricon','maricón','mar1ca',
  'suicidio','matate','muérete','muerete','matense','matalo',
  'racista','discriminar','xenofobia',
  'negro de mierda','indio de mierda',
  'fracasado','fracasada','frac4sado',
  'mediocre',
  // ── Inglés ──────────────────────────────────────────────────────
  'fuck','f.u.c.k','fck','f*ck','fu*k',
  'shit','sh1t','sh*t',
  'bitch','b1tch','b*tch',
  'asshole','a**hole','a55hole',
  'cunt','c*nt',
  'retard','ret4rd',
  'loser','l0ser',
  'hate','h8',
  'kill yourself','kys',
];

function normalizeText(t) {
  return t.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[0@]/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/\$/g, 's')
    .replace(/[.*,\-_]/g, '');
}

function containsBadWord(text) {
  var normalized = normalizeText(text);
  var plain      = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return BAD_WORDS.some(function(w) {
    var nw = normalizeText(w);
    return normalized.includes(nw) || plain.includes(nw);
  });
}

function showCmtAlert(msg) {
  var el = document.getElementById('cmtAlert');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._hide);
  el._hide = setTimeout(function() { el.style.display = 'none'; }, 5000);
}

/* ── PUBLIC API ──────────────────────────────────────────────── */
window.TotArtista = {
  addComment: async function () {
    var uid      = getUid();
    var username = getUsername();
    if (!uid || !username) return;

    var input = document.getElementById('cmtInput');
    var btn   = document.getElementById('cmtBtn');
    if (!input || !input.value.trim()) return;

    var text = input.value.trim();

    if (containsBadWord(text)) {
      showCmtAlert('Este comentario contiene lenguaje inapropiado. Por favor mantén un ambiente de respeto.');
      return;
    }

    var used = await getCommentCountToday(uid);
    if (used >= CMT_LIMIT) return;

    input.value = '';
    if (btn) btn.disabled = true;

    try {
      await fbAddComment(artistId, uid, username, text);
      await incrementCommentCount(uid);

      var newUsed = await getCommentCountToday(uid);
      var left = CMT_LIMIT - newUsed;
      var note = document.getElementById('cmtLimitNote');
      if (note) note.textContent = '*Máximo ' + CMT_LIMIT + ' comentarios por día · quedan ' + Math.max(0, left);
      if (left <= 0) {
        if (input) input.disabled = true;
      } else {
        if (btn) btn.disabled = false;
      }
    } catch(e) {
      if (btn) btn.disabled = false;
      console.error('Error al comentar:', e);
    }
  },

  reportComment: async function(commentId, reportedUser) {
    var uid = getUid();
    if (!uid) return;
    try {
      await fbReportComment(commentId, reportedUser, uid, artistId);
      var btn = document.getElementById('rep-' + commentId);
      if (btn) { btn.textContent = 'Reportado'; btn.disabled = true; btn.style.color = '#dc2626'; }
    } catch(e) { console.error('Error al reportar:', e); }
  },

  deleteComment: async function(commentId) {
    if (!(window._totCurrentUser && window._totCurrentUser.isAdmin)) return;
    try {
      await fbDeleteComment(artistId, commentId);
    } catch(e) { console.error('Error al eliminar comentario:', e); }
  },

  resetVotes: async function() {
    if (!(window._totCurrentUser && window._totCurrentUser.isAdmin)) return;
    var modal = document.getElementById('tot-admin-modal');
    if (!modal) return;
    modal.querySelectorAll('.admin-modal-input').forEach(function(i){ i.value = ''; });
    modal.querySelector('.admin-modal-err').textContent = '';
    modal.style.display = 'flex';
    modal.querySelector('.admin-modal-input').focus();
  }
};

/* ── ADMIN PANEL ─────────────────────────────────────────────── */
function buildAdminPanel() {
  if (!( window._totCurrentUser && window._totCurrentUser.isAdmin)) return;
  if (document.getElementById('tot-admin-bar')) return;

  // Floating bar
  var bar = document.createElement('div');
  bar.id = 'tot-admin-bar';
  bar.innerHTML =
    '<span class="admin-bar-label">ADMIN</span>' +
    '<button class="admin-bar-btn" id="tot-btn-reset-votes">Resetear votos · ' + artistId + '</button>';
  document.body.appendChild(bar);

  // Modal overlay
  var modal = document.createElement('div');
  modal.id = 'tot-admin-modal';
  modal.innerHTML =
    '<div class="admin-modal-box">' +
      '<p class="admin-modal-title">Confirmar reset de votos</p>' +
      '<p class="admin-modal-sub">Reiniciar votos de <strong>' + artistId + '</strong> a cero. Ambos campos son obligatorios.</p>' +
      '<input class="admin-modal-input" id="admin-input-who" type="text" placeholder="Quien reinicia">' +
      '<input class="admin-modal-input" id="admin-input-pwd" type="password" placeholder="Contrasena de verificacion" style="margin-top:10px">' +
      '<p class="admin-modal-err"></p>' +
      '<div class="admin-modal-actions">' +
        '<button class="admin-modal-cancel">Cancelar</button>' +
        '<button class="admin-modal-confirm">Confirmar reset</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  document.getElementById('tot-btn-reset-votes').onclick = function() {
    window.TotArtista.resetVotes();
  };

  modal.querySelector('.admin-modal-cancel').onclick = function() {
    modal.style.display = 'none';
  };

  modal.querySelector('.admin-modal-confirm').onclick = async function() {
    var whoInput = modal.querySelector('#admin-input-who');
    var pwdInput = modal.querySelector('#admin-input-pwd');
    var err      = modal.querySelector('.admin-modal-err');
    var WHO      = 'CAMILA SC';
    var PWD      = 'TOTRESETEOVOTOSCONFIRM';
    if (whoInput.value.trim() !== WHO || pwdInput.value.trim() !== PWD) {
      err.textContent = 'Datos incorrectos. Verifica ambos campos.';
      whoInput.focus();
      return;
    }
    var confirmBtn = modal.querySelector('.admin-modal-confirm');
    confirmBtn.textContent = 'Reseteando...';
    confirmBtn.disabled = true;
    try {
      await fbResetArtistVotes(artistId);
      modal.style.display = 'none';
      confirmBtn.textContent = 'Confirmar reset';
      confirmBtn.disabled = false;
    } catch(e) {
      err.textContent = 'Error al resetear. Intenta de nuevo.';
      confirmBtn.textContent = 'Confirmar reset';
      confirmBtn.disabled = false;
    }
  };

  modal.onclick = function(e) {
    if (e.target === modal) modal.style.display = 'none';
  };
}

/* ── INIT ────────────────────────────────────────────────────── */
var _initialized = false;

async function init() {
  injectStyles();
  if (!_initialized) {
    moveResumen();
    _initialized = true;
  }
  await buildVoteArea();
  await buildCommunity();
  updateHeroRank();
  buildAdminPanel();
}

// Rebuild UI when auth state changes (login / logout)
window.addEventListener('tot-auth-change', function () {
  _tickerRunning = false;
  init();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

 
 
