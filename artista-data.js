/**
 * artista-data.js  · ES Module
 * Loads artist data from Firestore and populates the artista page.
 * Each artista page must have  data-artist-id="artista1"  on <body>.
 */

import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(val, fallback) {
  var s = (val || '').toString().trim();
  return s || (fallback || '');
}

function photoEl(url, label, extraClass) {
  extraClass = extraClass || '';
  if (url && url.startsWith('http')) {
    return '<img loading="lazy" decoding="async" src="' + esc(url) + '" alt="' + esc(label) + '" style="width:100%;height:100%;object-fit:cover;display:block">';
  }
  return '<span class="photo-placeholder-icon">' + esc(label) + '</span>';
}

async function loadArtist() {
  var artistId = document.body.dataset.artistId;

  try {
    if (!artistId) return;
    var snap = await getDoc(doc(db, 'artistas', artistId));

    if (!snap.exists() || snap.data().active === false) {
      // Silently keep placeholder content · data not uploaded yet
      return;
    }

    var d = snap.data();

    // ── <title> and meta ────────────────────────────────────────
    var nombre = fmt(d.nombre, 'Artista');
    document.title = nombre + ' · Top of Talent';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = nombre + ' · conoce su carrera y comunidad fan en Top of Talent.';
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = nombre + ' · Top of Talent';
    var twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = nombre + ' · Top of Talent';

    // ── HERO · photo ─────────────────────────────────────────────
    var heroPhotoWrap = document.querySelector('.photo-placeholder-center');
    if (heroPhotoWrap) {
      if (d.foto_principal && d.foto_principal.startsWith('http')) {
        heroPhotoWrap.innerHTML = '';
        var heroImg = document.createElement('img');
        heroImg.src = d.foto_principal;
        heroImg.alt = nombre;
        heroImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0';
        heroPhotoWrap.parentElement.insertBefore(heroImg, heroPhotoWrap);
        heroPhotoWrap.style.display = 'none';
      } else {
        heroPhotoWrap.querySelector('span').textContent = 'Foto Principal · ' + nombre;
      }
    }

    // ── HERO · social stats (estilo "stock": color según cambio) ──
    // Cada métrica se compara con su valor anterior (<campo>_prev).
    // Sube -> verde con ▲ ; baja -> rojo con ▼ ; igual o sin previo -> normal.
    var socials = document.querySelector('.hero-socials');
    if (socials) {
      var statNum = function (s) {
        if (s == null) return null;
        var m = String(s).replace(/\s/g, '').match(/([\d.,]+)\s*([kKmM]?)/);
        if (!m) return null;
        var n = parseFloat(m[1].replace(/,/g, ''));
        if (isNaN(n)) return null;
        var u = (m[2] || '').toLowerCase();
        if (u === 'k') n *= 1e3; else if (u === 'm') n *= 1e6;
        return n;
      };
      var cell = function (label, val, prev, suffix) {
        var a = statNum(val), b = statNum(prev), dir = 0;
        if (a != null && b != null) { if (a > b) dir = 1; else if (a < b) dir = -1; }
        var color = dir > 0 ? '#3ddc84' : dir < 0 ? '#ff6b6b' : '';
        var arrow = dir > 0 ? ' <span style="font-size:.72em;vertical-align:1px">▲</span>'
                  : dir < 0 ? ' <span style="font-size:.72em;vertical-align:1px">▼</span>' : '';
        var style = color ? ' style="color:' + color + '"' : '';
        return label + ' <strong' + style + '>' + esc(val) + arrow + '</strong>' + (suffix || '');
      };
      var rows = [];
      if (d.ig_seguidores)   rows.push(cell('INSTAGRAM', d.ig_seguidores, d.ig_seguidores_prev, ''));
      if (d.spotify_oyentes) rows.push(cell('SPOTIFY', d.spotify_oyentes, d.spotify_oyentes_prev, ' oyentes/mes'));
      if (d.youtube_subs)    rows.push(cell('YOUTUBE', d.youtube_subs, d.youtube_subs_prev, ' subs'));
      if (d.tiktok)          rows.push(cell('TIKTOK', d.tiktok, d.tiktok_prev, ''));
      if (rows.length) {
        var html = rows.map(function (r) { return '<span class="social-stat">' + r + '</span>'; }).join('');
        if (d.stats_fecha) {
          html += '<span class="social-stat" style="opacity:.5;font-size:.82em;letter-spacing:.04em">Actualizado ' + esc(d.stats_fecha) + '</span>';
        }
        socials.innerHTML = html;

        // Leyenda liquid-glass al pasar el mouse por los números
        if (!document.getElementById('stat-tip')) {
          var tipStyle = document.createElement('style');
          tipStyle.textContent = '#stat-tip{position:fixed;z-index:99999;pointer-events:none;max-width:250px;padding:12px 14px;border-radius:16px;background:rgba(22,16,34,.5);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 34px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.18);color:#fff;font-size:12px;line-height:1.5;opacity:0;transform:translateY(5px);transition:opacity .16s ease,transform .16s ease}#stat-tip.on{opacity:1;transform:translateY(0)}';
          document.head.appendChild(tipStyle);
          var tipEl0 = document.createElement('div');
          tipEl0.id = 'stat-tip';
          tipEl0.innerHTML = '<div style="font-weight:700;margin-bottom:5px">Cómo leer los números</div>' +
            '<div><span style="color:#3ddc84">● Verde</span> subió &nbsp; <span style="color:#ff6b6b">● Rojo</span> bajó</div>' +
            '<div style="opacity:.8;margin-top:5px">Es respecto a la última actualización. El número es el total actual, no cuánto subió o bajó.</div>';
          document.body.appendChild(tipEl0);
        }
        if (!socials.dataset.tip) {
          socials.dataset.tip = '1';
          socials.style.cursor = 'help';
          var tipEl = document.getElementById('stat-tip');
          socials.addEventListener('mousemove', function (e) {
            tipEl.classList.add('on');
            var x = e.clientX + 16, y = e.clientY + 18;
            if (x + 260 > window.innerWidth) x = e.clientX - 260;
            if (y + 130 > window.innerHeight) y = e.clientY - 130;
            tipEl.style.left = x + 'px';
            tipEl.style.top = y + 'px';
          });
          socials.addEventListener('mouseleave', function () { tipEl.classList.remove('on'); });
        }
      }
    }

    // ── HERO · name ───────────────────────────────────────────────
    var heroName = document.querySelector('.hero-artist-name');
    if (heroName) heroName.textContent = nombre;

    // ── HERO · EP label & rank ────────────────────────────────────

    // Rank is set dynamically by artista-extras.js (based on live votes)
    var rankEl = document.querySelector('.hero-rank');
    if (rankEl) rankEl.style.visibility = 'hidden';

    // ── SPECS TABLE (#paso2) ─────────────────────────────────────
    var specsTbl = document.querySelector('.specs-table');
    if (specsTbl) {
      var discStr  = Array.isArray(d.discografia)    ? d.discografia.join(' · ')    : (d.discografia    || '');
      var colabStr = Array.isArray(d.colaboraciones) ? d.colaboraciones.join(' · ') : (d.colaboraciones || '');

      specsTbl.innerHTML =
        '<tr class="fade-up visible"><td>Nombre artístico</td><td>' + esc(nombre) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Ciudad de origen</td><td>' + esc(fmt(d.ciudad)) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Género musical</td><td><span class="spec-highlight">' + esc(fmt(d.genero)) + '</span></td></tr>' +
        '<tr class="fade-up visible"><td>Activo desde</td><td>' + esc(fmt(d.activo_desde)) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Tipo</td><td>' + esc(fmt(d.tipo)) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Sello</td><td>' + esc(fmt(d.sello)) + '</td></tr>' +
        (discStr ? '<tr class="fade-up visible"><td>Discografía</td><td>' + esc(discStr) + '</td></tr>' : '') +
        (colabStr ? '<tr class="fade-up visible"><td>Colaboraciones</td><td>' + esc(colabStr) + '</td></tr>' : '') +
        '<tr class="fade-up visible"><td colspan="2"><div id="tot-score-block"></div></td></tr>';

    // Store editorial scores for artista-extras.js to combine with fan votes
    window._totScoreData = {
      tot:      (typeof d.score_tot      === 'number') ? d.score_tot      : null,
      criticos: (typeof d.score_criticos === 'number') ? d.score_criticos : null,
    };
    }

    // ── GALLERY (#paso3) ─────────────────────────────────────────
    var gallery = document.querySelector('.gallery-grid');
    if (gallery) {
      var photos = [d.foto_1, d.foto_2, d.foto_3, d.foto_4];
      var labels = ['Press', 'Live', 'Studio', 'Event'];
      var grads  = ['g1', 'g2', 'g3', 'g4'];
      var hasAny = photos.some(function(p) { return p && p.startsWith('http'); });

      if (hasAny) {
        gallery.innerHTML = photos.map(function(url, i) {
          var inner = url && url.startsWith('http')
            ? '<img loading="lazy" decoding="async" src="' + esc(url) + '" alt="' + esc(nombre) + ' ' + labels[i] + '" style="width:100%;height:100%;object-fit:cover;display:block">'
            : '<div class="photo-bg ' + grads[i] + '"><span class="photo-placeholder-icon">Foto 0' + (i+1) + '</span></div>';
          return '<div class="gallery-photo">' + inner + '<span class="photo-label">Foto 0' + (i+1) + ' · ' + labels[i] + '</span></div>';
        }).join('');
      }
    }

    // ── BIOGRAPHY (#paso4) ───────────────────────────────────────
    var bioHeadline = document.querySelector('.bio-headline');
    if (bioHeadline && d.bio_headline) bioHeadline.textContent = d.bio_headline;

    var bioBody = document.querySelector('.bio-body');
    if (bioBody) {
      var paras = [d.bio_p1, d.bio_p2, d.bio_p3, d.bio_p4].filter(Boolean);
      if (paras.length) {
        bioBody.innerHTML = paras.map(function(p) {
          return '<p>' + esc(p) + '</p>';
        }).join('');
      }
    }

    // Sidebar: discography + colaboraciones
    var bioRight = document.querySelector('.bio-right');
    if (bioRight) {
      var discList  = Array.isArray(d.discografia)    ? d.discografia    : (d.discografia    ? d.discografia.split('|').map(function(x){return x.trim();}) : []);
      var colabList = Array.isArray(d.colaboraciones) ? d.colaboraciones : (d.colaboraciones ? d.colaboraciones.split('|').map(function(x){return x.trim();}) : []);

      var html = '';
      if (discList.length) {
        html += '<div class="credit-block"><span class="credit-label">Discografía destacada</span>' +
          discList.map(function(x) { return '<span class="credit-item">' + esc(x) + '</span>'; }).join('') +
          '</div>';
      }
      if (colabList.length) {
        html += '<div class="credit-block"><span class="credit-label">Colaboraciones</span>' +
          colabList.map(function(x) { return '<span class="credit-item">' + esc(x) + '</span>'; }).join('') +
          '</div>';
      }
      if (html) bioRight.innerHTML = html;
    }

    // ── QUOTE + CTAs (#paso5) ────────────────────────────────────
    var quoteEl = document.querySelector('.quote-text');
    if (quoteEl && d.quote) {
      // Break quote into lines at ~ every 30 chars on word boundary
      var words = d.quote.split(' ');
      var lines = [], cur = '';
      words.forEach(function(w) {
        if ((cur + ' ' + w).trim().length > 30 && cur) { lines.push(cur.trim()); cur = w; }
        else cur = (cur + ' ' + w).trim();
      });
      if (cur) lines.push(cur.trim());
      quoteEl.innerHTML = lines.map(esc).join('<br>');
    }

    // CTA buttons
    var btnSpotify = document.querySelector('.btn-dark');
    if (btnSpotify && d.link_spotify) btnSpotify.href = d.link_spotify;

    var btnIG = document.querySelector('.btn-outline');
    if (btnIG && d.link_instagram) btnIG.href = d.link_instagram;

    // Next artist · btn inside paso5
    var btnNext = document.querySelector('.btn-next');
    if (btnNext) {
      if (d.siguiente_id && d.siguiente_nombre) {
        btnNext.href = (window.TOT_SLUG_OF ? window.TOT_SLUG_OF(d.siguiente_id) : d.siguiente_id);
        btnNext.textContent = 'Siguiente: ' + d.siguiente_nombre + ' →';
      } else {
        btnNext.style.display = 'none';
      }
    }

    // ── NEXT ARTIST footer strip ─────────────────────────────────
    var nextArtist = document.querySelector('a.next-artist');
    if (nextArtist) {
      if (d.siguiente_id && d.siguiente_nombre) {
        nextArtist.href = (window.TOT_SLUG_OF ? window.TOT_SLUG_OF(d.siguiente_id) : d.siguiente_id);
        var nextName = nextArtist.querySelector('.next-name');
        if (nextName) nextName.textContent = d.siguiente_nombre;
      } else {
        nextArtist.style.display = 'none';
      }
    }

  } catch (err) {
    console.error('[artista-data] Error loading artist data:', err);
  } finally {
    document.body.style.transition = 'opacity 0.25s';
    document.body.style.opacity = '1';
  }
}

loadArtist();
