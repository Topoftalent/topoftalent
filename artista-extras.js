// artista-extras.js — ES Module, Firestore-backed votes & comments
import {
  getMyVoteData, castVote, getTotalVotes,
  listenTopFans, listenComments,
  addComment as fbAddComment,
  getCommentCountToday, incrementCommentCount
} from './votes-firebase.js';

var artistId  = document.body.dataset.artistId || 'artista1';
var CMT_LIMIT = 5;

// Unsubscribe handles for real-time listeners
var _unsubFans = null;
var _unsubCmts = null;

/* ── AUTH ─────────────────────────────────────────────────────── */
function getUser()     { return window._totCurrentUser || null; }
function getIsMember() { var u = getUser(); return !!(u && u.isMember); }
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
    '.comm-col-title{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:22px;font-weight:700;',
    'letter-spacing:-.01em;color:#000;padding-bottom:14px;border-bottom:1px solid rgba(0,0,0,.1);margin-bottom:20px}',
    '.fan-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid rgba(0,0,0,.05)}',
    '.fan-row:last-child{border-bottom:none}',
    '.fan-pos{font-size:15px;width:28px;text-align:center;flex-shrink:0}',
    '.rank-num{font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;color:#999}',
    '.fan-name{font-family:"JetBrains Mono",monospace;font-size:12px;color:#000;flex:1}',
    '.fan-votes{font-family:"JetBrains Mono",monospace;font-size:11px;color:#c86cff;font-weight:700;white-space:nowrap}',
    '.empty-state{font-family:"JetBrains Mono",monospace;font-size:11px;color:#aaa;padding:20px 0}',
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
          // Update counter
          var newTotal = await getTotalVotes(artistId);
          var pc = document.getElementById('tot-public-votes');
          if (pc) pc.textContent = newTotal;
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
      '<p class="cmt-limit-note" id="cmtLimitNote">*Máximo ' + CMT_LIMIT + ' comentarios por día · quedan ' + Math.max(0, left) + '</p>';
  } else {
    var upsell = '<div class="member-upsell">' +
      '<p class="upsell-eye">✦ Acceso exclusivo</p>' +
      '<p class="upsell-desc">Los miembros de Top of Talent votan por sus artistas, aparecen en el ranking de fans y dejan su huella en la comunidad.</p>' +
      '<a href="membresia.html" class="upsell-cta">Hazte Miembro</a>' +
      '</div>';
    rankHTML = '<div class="member-upsell">' +
      '<p class="upsell-eye">✦ Solo miembros</p>' +
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
        '<p class="comm-col-title">Top Fans</p>' +
        '<div class="ranking-list" id="rankingList">' + rankHTML + '</div>' +
      '</div>' +
      '<div class="community-col">' +
        '<p class="comm-col-title">Comentarios de Fans</p>' +
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
    _unsubFans = listenTopFans(artistId, function (fans) {
      var medals = ['🥇','🥈','🥉'];
      var rl = document.getElementById('rankingList');
      if (!rl) return;
      if (!fans.length) { rl.innerHTML = '<p class="empty-state">Sé el primero en votar</p>'; return; }
      rl.innerHTML = fans.map(function (f, i) {
        var pos = i < 3 ? medals[i] : '<span class="rank-num">#' + (i+1) + '</span>';
        return '<div class="fan-row"><span class="fan-pos">' + pos + '</span>' +
          '<span class="fan-name">' + escapeHTML(f.username) + '</span>' +
          '<span class="fan-votes">' + f.total + ' votos</span></div>';
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
      var doubled = comments.concat(comments);
      ticker.innerHTML = doubled.map(function (cm) {
        return '<div class="cmt-card"><span class="cmt-uname">' + escapeHTML(cm.u) + '</span><p class="cmt-body">' + escapeHTML(cm.t) + '</p></div>';
      }).join('');
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

/* ── PUBLIC API ──────────────────────────────────────────────── */
window.TotArtista = {
  addComment: async function () {
    var uid      = getUid();
    var username = getUsername();
    if (!uid || !username) return;

    var input = document.getElementById('cmtInput');
    var btn   = document.getElementById('cmtBtn');
    if (!input || !input.value.trim()) return;

    var used = await getCommentCountToday(uid);
    if (used >= CMT_LIMIT) return;

    var text = input.value.trim();
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
  }
};

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
