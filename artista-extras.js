(function () {
  /* ── AUTH ── */
  var session = null;
  try { session = JSON.parse(localStorage.getItem('tot_session')); } catch (e) {}
  var isLoggedIn = !!(session && session.username);
  var isMember   = isLoggedIn && !!session.isMember;
  var username   = isLoggedIn ? ('@' + session.username) : null;
  var artistId   = document.body.dataset.artistId || 'artista1';

  /* ── STORAGE ── */
  function gv() { try { return JSON.parse(localStorage.getItem('tot_votes') || '{}'); } catch (e) { return {}; } }
  function sv(d) { localStorage.setItem('tot_votes', JSON.stringify(d)); }
  function gc() { try { return JSON.parse(localStorage.getItem('tot_comments') || '{}'); } catch (e) { return {}; } }
  function sc(d) { localStorage.setItem('tot_comments', JSON.stringify(d)); }

  /* ── COMMENT DAILY LIMIT ── */
  var CMT_LIMIT = 5;
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function getCmtDaily() { try { return JSON.parse(localStorage.getItem('tot_cmt_daily') || '{}'); } catch(e) { return {}; } }
  function saveCmtDaily(d) { localStorage.setItem('tot_cmt_daily', JSON.stringify(d)); }
  function cmtTodayCount() {
    var d = getCmtDaily();
    var key = (username || '') + '_' + artistId;
    if (!d[key] || d[key].date !== todayStr()) return 0;
    return d[key].count || 0;
  }
  function incrementCmtCount() {
    var d = getCmtDaily();
    var key = (username || '') + '_' + artistId;
    if (!d[key] || d[key].date !== todayStr()) d[key] = { date: todayStr(), count: 0 };
    d[key].count++;
    saveCmtDaily(d);
  }

  /* ── SEED DEMO DATA ── */
  function seed() {
    var v = gv();
    if (!v[artistId]) {
      v[artistId] = {
        '@ecufan_01':     { total: 247, last: 0 },
        '@music_lover_ec':{ total: 198, last: 0 },
        '@quito_vibes':   { total: 176, last: 0 },
        '@andean_beats':  { total: 145, last: 0 },
        '@fan_total':     { total: 134, last: 0 },
        '@talentwatch':   { total: 112, last: 0 },
        '@ecuamusic':     { total: 98,  last: 0 },
        '@indie_ec':      { total: 87,  last: 0 },
        '@support_local': { total: 65,  last: 0 },
        '@nuevo_fan':     { total: 34,  last: 0 }
      };
      sv(v);
    }
    var c = gc();
    if (!c[artistId]) {
      c[artistId] = [
        { u: '@ecufan_01',      t: '¡Increíble talento, cada show es mejor que el anterior!' },
        { u: '@music_lover_ec', t: 'El mejor artista de Ecuador sin duda. Sigan apoyando.' },
        { u: '@quito_vibes',    t: 'Fui al show en Quito y fue épico, espero la próxima gira.' },
        { u: '@andean_beats',   t: 'La producción de su último álbum es de otro nivel.' },
        { u: '@fan_total',      t: 'Representan Ecuador con clase y talento real.' },
        { u: '@talentwatch',    t: '¡Top of Talent sabe reconocer lo bueno!' },
        { u: '@ecuamusic',      t: 'Qué orgullo ver artistas ecuatorianos brillar así.' },
        { u: '@indie_ec',       t: 'Desde el primer EP supe que iba a llegar lejos.' },
        { u: '@support_local',  t: 'Apoya la música local, vale totalmente la pena.' },
        { u: '@nuevo_fan',      t: 'Acabo de descubrirlos y ya soy fan número uno.' }
      ];
      sc(c);
    }
  }

  /* ── INJECT STYLES ── */
  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = [
      /* Vote button */
      '.vote-area{margin-top:0;display:flex;flex-direction:column;align-items:flex-end;gap:8px}',
      '.vote-btn{font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:700;',
      'letter-spacing:.18em;text-transform:uppercase;padding:13px 26px;border:none;border-radius:4px;',
      'cursor:none!important;display:inline-flex;align-items:center;gap:7px;position:relative;',
      'color:#c86cff;background:rgba(200,108,255,.08);',
      'box-shadow:0 0 0 1px rgba(200,108,255,.3),inset 0 1px 0 rgba(255,255,255,.18),',
      '0 4px 20px rgba(0,0,0,.12),0 0 18px rgba(200,108,255,.18);',
      'backdrop-filter:blur(14px);transition:all .3s cubic-bezier(.34,1.2,.64,1);',
      'animation:vpulse 3s ease-in-out infinite}',
      '.vote-btn::before{content:"";position:absolute;top:0;left:15%;right:15%;height:1px;',
      'background:linear-gradient(to right,transparent,rgba(255,255,255,.5),transparent);border-radius:50%}',
      '.vote-btn:not([disabled]):hover{background:rgba(200,108,255,.16);transform:translateY(-1px);',
      'box-shadow:0 0 0 1px rgba(200,108,255,.55),inset 0 1px 0 rgba(255,255,255,.25),',
      '0 4px 24px rgba(0,0,0,.18),0 0 32px rgba(200,108,255,.38)}',
      '.vote-btn:not([disabled]):active{transform:translateY(1px) scale(.99)}',
      '.vote-btn[disabled]{opacity:.45;animation:none;cursor:not-allowed!important}',
      '.vote-upsell-btn{opacity:1}',
      '@keyframes vpulse{0%,100%{box-shadow:0 0 0 1px rgba(200,108,255,.3),inset 0 1px 0 rgba(255,255,255,.18),0 4px 20px rgba(0,0,0,.12),0 0 14px rgba(200,108,255,.16)}',
      '50%{box-shadow:0 0 0 1px rgba(200,108,255,.52),inset 0 1px 0 rgba(255,255,255,.2),0 4px 20px rgba(0,0,0,.14),0 0 28px rgba(200,108,255,.34)}}',
      '.vote-star{font-size:13px;line-height:1}',
      '.vote-legend{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.13em;',
      'color:#888;text-transform:uppercase;text-align:right}',
      '.vote-my{font-family:"JetBrains Mono",monospace;font-size:10px;color:#c86cff;text-align:right}',
      '.vote-my strong{font-size:13px}',
      /* paso-header row */
      '#paso2 .paso-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap}',
      '.ph-left{display:flex;align-items:baseline;gap:24px}',
      /* Resumen de carrera — full width below bio */
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
      /* Community section background glow */
      '.community-section{position:relative;overflow:hidden}',
      '.community-section::before{content:"";position:absolute;inset:0;pointer-events:none;',
      'background:radial-gradient(ellipse 60% 50% at 50% 100%,rgba(200,108,255,.07) 0%,transparent 70%);',
      'animation:sect-glow 5s ease-in-out infinite alternate}',
      '@keyframes sect-glow{0%{opacity:.6;transform:scale(1)}100%{opacity:1;transform:scale(1.05)}}',
      /* Community section border glow */
      '.community-section::after{content:"";position:absolute;top:0;left:0;right:0;height:1px;',
      'background:linear-gradient(to right,transparent,rgba(200,108,255,.5) 30%,rgba(200,108,255,.8) 50%,rgba(200,108,255,.5) 70%,transparent);',
      'animation:border-glow 3s ease-in-out infinite alternate}',
      '@keyframes border-glow{0%{opacity:.4;filter:blur(0px)}100%{opacity:1;filter:blur(1px)}}',
      /* Community grid */
      '.community-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;position:relative;z-index:1}',
      '.comm-col-title{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.3em;color:#666;',
      'text-transform:uppercase;padding-bottom:14px;border-bottom:1px solid rgba(0,0,0,.1);margin-bottom:20px}',
      /* Ranking */
      '.fan-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid rgba(0,0,0,.05)}',
      '.fan-row:last-child{border-bottom:none}',
      '.fan-pos{font-size:15px;width:28px;text-align:center;flex-shrink:0}',
      '.rank-num{font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;color:#999}',
      '.fan-name{font-family:"JetBrains Mono",monospace;font-size:12px;color:#000;flex:1}',
      '.fan-votes{font-family:"JetBrains Mono",monospace;font-size:11px;color:#c86cff;font-weight:700;white-space:nowrap}',
      '.empty-state{font-family:"JetBrains Mono",monospace;font-size:11px;color:#aaa;padding:20px 0}',
      /* Comments */
      '.cmt-ticker-wrap{height:300px;overflow:hidden;position:relative}',
      '.cmt-ticker-wrap::after{content:"";position:absolute;bottom:0;left:0;right:0;height:60px;',
      'background:linear-gradient(to top,#fff,transparent);pointer-events:none}',
      '.cmt-ticker{will-change:transform}',
      '.cmt-card{padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06)}',
      '.cmt-uname{font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;color:#c86cff;',
      'letter-spacing:.08em;display:block;margin-bottom:5px}',
      '.cmt-body{font-family:"JetBrains Mono",monospace;font-size:11px;color:#333;line-height:1.75;margin:0}',
      /* Comment form */
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
      /* Upsell */
      '.member-upsell{display:flex;flex-direction:column;align-items:flex-start;gap:16px;padding:30px 28px;',
      'border-radius:6px;position:relative;overflow:hidden;',
      'background:rgba(200,108,255,.05);',
      'box-shadow:0 0 0 1px rgba(200,108,255,.2),inset 0 1px 0 rgba(255,255,255,.6),',
      '0 8px 32px rgba(0,0,0,.06),0 0 40px rgba(200,108,255,.1);',
      'backdrop-filter:blur(12px)}',
      '.member-upsell::before{content:"";position:absolute;top:0;left:10%;right:10%;height:1px;',
      'background:linear-gradient(to right,transparent,rgba(200,108,255,.55),transparent);border-radius:50%}',
      '.upsell-eye{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.3em;color:#c86cff;',
      'text-transform:uppercase;margin:0}',
      '.upsell-desc{font-family:"JetBrains Mono",monospace;font-size:11px;color:#555;line-height:1.75;margin:0}',
      '.upsell-cta{display:inline-flex;align-items:center;gap:7px;text-decoration:none;',
      'font-family:Helvetica,"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;',
      'letter-spacing:.18em;text-transform:uppercase;padding:12px 22px;border-radius:4px;',
      'color:#c86cff;background:rgba(200,108,255,.1);',
      'box-shadow:0 0 0 1px rgba(200,108,255,.3),0 4px 18px rgba(0,0,0,.08),0 0 24px rgba(200,108,255,.22);',
      'transition:all .3s cubic-bezier(.34,1.2,.64,1);animation:vpulse 3s ease-in-out infinite}',
      '.upsell-cta:hover{background:rgba(200,108,255,.18);transform:translateY(-1px);',
      'box-shadow:0 0 0 1px rgba(200,108,255,.55),0 4px 24px rgba(0,0,0,.12),0 0 36px rgba(200,108,255,.38)}',
      /* CTAs in community section */
      '.community-cta{position:relative;z-index:1}',
      /* Mobile */
      '@media(max-width:768px){.community-grid{grid-template-columns:1fr;gap:40px}',
      '.cmt-ticker-wrap{height:220px}.vote-area{align-items:flex-start}',
      '.vote-legend{text-align:left}.resumen-quote-big{font-size:clamp(18px,5vw,28px)}}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ── 1. VOTE BUTTON in #paso2 ── */
  function buildVoteArea() {
    var p2 = document.getElementById('paso2');
    if (!p2) return;
    var ph = p2.querySelector('.paso-header');
    if (!ph) return;

    var phLeft = document.createElement('div');
    phLeft.className = 'ph-left';
    while (ph.firstChild) phLeft.appendChild(ph.firstChild);
    ph.appendChild(phLeft);

    var area = document.createElement('div');
    area.className = 'vote-area';

    if (isMember) {
      var v       = gv();
      var myData  = (v[artistId] && v[artistId][username]) || { total: 0, last: 0 };
      var canVote = (Date.now() - myData.last) > 86400000;

      area.innerHTML =
        '<button id="voteBtn" class="vote-btn"' + (canVote ? '' : ' disabled') + '>' +
          '<span class="vote-star">★</span>' + (canVote ? 'Votar' : 'Votaste hoy') +
        '</button>' +
        '<p class="vote-legend">*Se restablece cada 24 horas</p>' +
        (myData.total > 0 ? '<p class="vote-my">Tus votos: <strong>' + myData.total + '</strong></p>' : '');

      var btn = area.querySelector('#voteBtn');
      if (btn) btn.addEventListener('click', function () {
        var vv = gv();
        if (!vv[artistId]) vv[artistId] = {};
        if (!vv[artistId][username]) vv[artistId][username] = { total: 0, last: 0 };
        vv[artistId][username].total++;
        vv[artistId][username].last = Date.now();
        sv(vv);
        this.disabled = true;
        this.innerHTML = '<span class="vote-star">★</span>¡Votaste!';
        var mv = area.querySelector('.vote-my');
        var tot = vv[artistId][username].total;
        if (mv) mv.innerHTML = 'Tus votos: <strong>' + tot + '</strong>';
        else area.insertAdjacentHTML('beforeend', '<p class="vote-my">Tus votos: <strong>' + tot + '</strong></p>');
      });
    } else {
      area.innerHTML =
        '<a href="membresia.html" class="vote-btn vote-upsell-btn"><span class="vote-star">★</span>Hazte Miembro para Votar</a>' +
        '<p class="vote-legend">*Se restablece cada 24 horas</p>';
    }

    ph.appendChild(area);
  }

  /* ── 2. RESUMEN DE CARRERA → full-width below bio layout ── */
  function moveResumen() {
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

    /* Observe new fade-up */
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: .15 });
    obs.observe(block);
  }

  /* ── 3. REPLACE #paso5 with COMMUNITY SECTION ── */
  function buildCommunity() {
    var paso5 = document.getElementById('paso5');
    if (!paso5) return;

    var ctaEl    = paso5.querySelector('.profile-cta');
    var ctaInner = ctaEl ? ctaEl.innerHTML : '';

    var v  = gv();
    var av = v[artistId] || {};
    var ranking = Object.entries(av).sort(function (a, b) { return b[1].total - a[1].total; }).slice(0, 10);
    var c        = gc();
    var comments = c[artistId] || [];

    paso5.className = 'snap-section community-section';
    paso5.style.cssText = 'background:#fff;color:#000;padding:120px 40px 80px;display:flex;flex-direction:column';

    var rankHTML, cmtHTML;

    if (isMember) {
      rankHTML = ranking.length ? ranking.map(function (entry, i) {
        var medals = ['🥇', '🥈', '🥉'];
        var pos = i < 3 ? medals[i] : '<span class="rank-num">#' + (i + 1) + '</span>';
        return '<div class="fan-row"><span class="fan-pos">' + pos + '</span>' +
          '<span class="fan-name">' + entry[0] + '</span>' +
          '<span class="fan-votes">' + entry[1].total + ' votos</span></div>';
      }).join('') : '<p class="empty-state">Sé el primero en votar</p>';

      var used = cmtTodayCount();
      var left = CMT_LIMIT - used;
      var cmtItems = comments.concat(comments).map(function (cm) {
        return '<div class="cmt-card"><span class="cmt-uname">' + cm.u + '</span><p class="cmt-body">' + cm.t + '</p></div>';
      }).join('');
      cmtHTML =
        '<div class="cmt-ticker-wrap"><div class="cmt-ticker" id="cmtTicker">' + cmtItems + '</div></div>' +
        '<div class="cmt-form">' +
          '<input id="cmtInput" class="cmt-input" type="text" placeholder="Escribe tu comentario..." maxlength="200"' + (left <= 0 ? ' disabled' : '') + '>' +
          '<button id="cmtBtn" class="cmt-btn" onclick="TotArtista.addComment()"' + (left <= 0 ? ' disabled' : '') + '>Comentar →</button>' +
        '</div>' +
        '<p class="cmt-limit-note">*Máximo ' + CMT_LIMIT + ' comentarios por día · quedan ' + Math.max(0, left) + '</p>';
    } else {
      var upsell = '<div class="member-upsell">' +
        '<p class="upsell-eye">Solo para miembros</p>' +
        '<p class="upsell-desc">Únete a la comunidad para acceder al ranking, ver comentarios y participar.</p>' +
        '<a href="membresia.html" class="upsell-cta">★ Hazte Miembro</a>' +
        '</div>';
      rankHTML = upsell;
      cmtHTML  = upsell;
    }

    paso5.innerHTML =
      '<div class="paso-header fade-up" style="border-bottom:1px solid rgba(0,0,0,.1);padding-bottom:36px;margin-bottom:56px">' +
        '<span class="paso-num" style="color:#c86cff">05 —</span>' +
        '<h2 class="paso-title" style="color:#000">Comunidad de Fans</h2>' +
      '</div>' +
      '<div class="community-grid">' +
        '<div class="community-col">' +
          '<p class="comm-col-title">Top Fans</p>' +
          '<div class="ranking-list">' + rankHTML + '</div>' +
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
    if (isMember) startTicker();
  }

  /* ── DOT MATRIX BACKGROUND ── */
  function startDotMatrix() {
    var section = document.getElementById('paso5');
    if (!section) return;
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.18';
    section.style.position = 'relative';
    section.insertBefore(canvas, section.firstChild);

    var ctx = canvas.getContext('2d');
    var DOT = 3, GRID = 22;
    var cols, rows, dots = [], startTime = Date.now();

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var t = (Date.now() - startTime) / 1000;
      var opLevels = [.05, .1, .18, .28, .38, .5, .62, .75, .88, 1];
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
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

  /* ── TICKER ANIMATION ── */
  function startTicker() {
    setTimeout(function () {
      var ticker = document.getElementById('cmtTicker');
      if (!ticker) return;
      var halfH = ticker.scrollHeight / 2;
      var pos   = 0;
      (function tick() {
        pos += 0.45;
        if (pos >= halfH) pos = 0;
        ticker.style.transform = 'translateY(-' + pos + 'px)';
        requestAnimationFrame(tick);
      })();
    }, 400);
  }

  /* ── PUBLIC API ── */
  window.TotArtista = {
    addComment: function () {
      var input = document.getElementById('cmtInput');
      var btn   = document.getElementById('cmtBtn');
      if (!input || !input.value.trim() || !username) return;
      if (cmtTodayCount() >= CMT_LIMIT) return;

      var c = gc();
      if (!c[artistId]) c[artistId] = [];
      c[artistId].push({ u: username, t: input.value.trim() });
      sc(c);
      incrementCmtCount();
      input.value = '';

      var used = cmtTodayCount();
      var left = CMT_LIMIT - used;
      var note = document.querySelector('.cmt-limit-note');
      if (note) note.textContent = '*Máximo ' + CMT_LIMIT + ' comentarios por día · quedan ' + Math.max(0, left);
      if (left <= 0) {
        if (input) input.disabled = true;
        if (btn)   btn.disabled   = true;
      }

      var ticker = document.getElementById('cmtTicker');
      if (!ticker) return;
      var fresh = gc()[artistId] || [];
      ticker.innerHTML = fresh.concat(fresh).map(function (cm) {
        return '<div class="cmt-card"><span class="cmt-uname">' + cm.u + '</span><p class="cmt-body">' + cm.t + '</p></div>';
      }).join('');
    }
  };

  /* ── INIT ── */
  function init() {
    seed();
    injectStyles();
    moveResumen();
    buildVoteArea();
    buildCommunity();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
