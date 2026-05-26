/**
 * artista-data.js  — ES Module
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
  return s || (fallback || '—');
}

function photoEl(url, label, extraClass) {
  extraClass = extraClass || '';
  if (url && url.startsWith('http')) {
    return '<img src="' + esc(url) + '" alt="' + esc(label) + '" style="width:100%;height:100%;object-fit:cover;display:block">';
  }
  return '<span class="photo-placeholder-icon">' + esc(label) + '</span>';
}

async function loadArtist() {
  var artistId = document.body.dataset.artistId;
  if (!artistId) return;

  try {
    var snap = await getDoc(doc(db, 'artistas', artistId));

    if (!snap.exists() || snap.data().active === false) {
      // Silently keep placeholder content — data not uploaded yet
      return;
    }

    var d = snap.data();

    // ── <title> and meta ────────────────────────────────────────
    var nombre = fmt(d.nombre, 'Artista');
    document.title = nombre + ' — Top of Talent';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = nombre + ' — conoce su carrera y comunidad fan en Top of Talent.';
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = nombre + ' — Top of Talent';
    var twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = nombre + ' — Top of Talent';

    // ── HERO — photo ─────────────────────────────────────────────
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
        heroPhotoWrap.querySelector('span').textContent = 'Foto Principal — ' + nombre;
      }
    }

    // ── HERO — social stats ───────────────────────────────────────
    var socials = document.querySelector('.hero-socials');
    if (socials) {
      var rows = [];
      if (d.ig_seguidores)   rows.push('INSTAGRAM <strong>' + esc(d.ig_seguidores) + '</strong>');
      if (d.spotify_oyentes) rows.push('SPOTIFY <strong>' + esc(d.spotify_oyentes) + '</strong> oyentes/mes');
      if (d.youtube_subs)    rows.push('YOUTUBE <strong>' + esc(d.youtube_subs) + '</strong> subs');
      if (d.tiktok)          rows.push('TIKTOK <strong>' + esc(d.tiktok) + '</strong>');
      if (rows.length) {
        socials.innerHTML = rows.map(function(r) {
          return '<span class="social-stat">' + r + '</span>';
        }).join('');
      }
    }

    // ── HERO — name ───────────────────────────────────────────────
    var heroName = document.querySelector('.hero-artist-name');
    if (heroName) heroName.textContent = nombre;

    // ── HERO — EP label & rank ────────────────────────────────────
    var epEl = document.querySelector('.hero-ep');
    if (epEl && d.ep_label) epEl.textContent = d.ep_label;

    var rankEl = document.querySelector('.hero-rank');
    if (rankEl && d.ranking) rankEl.textContent = '#' + String(d.ranking).padStart(2, '0') + ' TOP OF TALENT';

    // ── SPECS TABLE (#paso2) ─────────────────────────────────────
    var specsTbl = document.querySelector('.specs-table');
    if (specsTbl) {
      var discStr  = Array.isArray(d.discografia)    ? d.discografia.join(' · ')    : (d.discografia    || '—');
      var colabStr = Array.isArray(d.colaboraciones) ? d.colaboraciones.join(' · ') : (d.colaboraciones || '—');

      specsTbl.innerHTML =
        '<tr class="fade-up visible"><td>Nombre artístico</td><td>' + esc(nombre) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Ciudad de origen</td><td>' + esc(fmt(d.ciudad)) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Género musical</td><td><span class="spec-highlight">' + esc(fmt(d.genero)) + '</span></td></tr>' +
        '<tr class="fade-up visible"><td>Activo desde</td><td>' + esc(fmt(d.activo_desde)) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Tipo</td><td>' + esc(fmt(d.tipo)) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Sello</td><td>' + esc(fmt(d.sello)) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Discografía</td><td>' + esc(discStr) + '</td></tr>' +
        '<tr class="fade-up visible"><td>Colaboraciones</td><td>' + esc(colabStr) + '</td></tr>' +
        (d.score ? '<tr class="fade-up visible"><td>Score Top of Talent</td><td><span class="spec-highlight" style="font-size:20px;font-weight:700">' + esc(String(d.score)) + ' / 100</span></td></tr>' : '');
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
            ? '<img src="' + esc(url) + '" alt="' + esc(nombre) + ' ' + labels[i] + '" style="width:100%;height:100%;object-fit:cover;display:block">'
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

    // Next artist — btn inside paso5
    var btnNext = document.querySelector('.btn-next');
    if (btnNext) {
      if (d.siguiente_id && d.siguiente_nombre) {
        btnNext.href = d.siguiente_id + '.html';
        btnNext.textContent = 'Siguiente: ' + d.siguiente_nombre + ' →';
      } else {
        btnNext.style.display = 'none';
      }
    }

    // ── NEXT ARTIST footer strip ─────────────────────────────────
    var nextArtist = document.querySelector('a.next-artist');
    if (nextArtist) {
      if (d.siguiente_id && d.siguiente_nombre) {
        nextArtist.href = d.siguiente_id + '.html';
        var nextName = nextArtist.querySelector('.next-name');
        if (nextName) nextName.textContent = d.siguiente_nombre;
      } else {
        nextArtist.style.display = 'none';
      }
    }

  } catch (err) {
    console.error('[artista-data] Error loading artist data:', err);
    // Page keeps its static placeholder content — silent fail
  }
}

loadArtist();
