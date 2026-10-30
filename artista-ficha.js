// artista-ficha.js · Llena la ficha del artista desde Firestore (colección
// `artistas`). Antes la ficha mostraba texto placeholder hardcodeado; ahora
// es data-driven y modificable: editas el doc en Firestore y la ficha cambia.
import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

var artistId = (document.body && document.body.dataset.artistId) || 'artista1';

function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function setText(sel, val){ var el = document.querySelector(sel); if (el && val != null && String(val).trim() !== '') el.textContent = val; }
function asArr(v){ return Array.isArray(v) ? v : (v ? String(v).split('|').map(function(x){ return x.trim(); }).filter(Boolean) : []); }

// Vuelve a observar los .fade-up (los que reconstruimos no los ve el observer
// original), y revela de inmediato los que ya están en viewport.
function revealFadeUps(){
  try {
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: .12 });
    document.querySelectorAll('.fade-up').forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) && r.bottom > 0) el.classList.add('visible');
      else obs.observe(el);
    });
  } catch(e){ document.querySelectorAll('.fade-up').forEach(function(el){ el.classList.add('visible'); }); }
}

(async function(){
  try {
    var snap = await getDoc(doc(db, 'artistas', artistId));
    if (!snap.exists()) return;
    var d = snap.data();

    // Título y meta
    if (d.nombre) { document.title = d.nombre + ' · Top of Talent'; }
    var md = document.querySelector('meta[name="description"]');
    if (md && (d.bio_headline || d.nombre)) md.content = d.bio_headline || (d.nombre + ' en Top of Talent.');

    // Hero
    setText('.hero-artist-name', d.nombre);
    var rankEl = document.querySelector('.hero-rank');
    var rk = d.ranking || d.order;
    if (rankEl && rk) rankEl.textContent = '#' + String(rk).padStart(2, '0') + ' TOP OF TALENT';

    // Specs
    var disc = asArr(d.discografia);
    var colab = asArr(d.colaboraciones);
    var scoreVal = (typeof d.score_tot === 'number') ? d.score_tot : d.score;
    var specs = [
      ['Nombre artístico', d.nombre],
      ['Ciudad de origen', d.ciudad],
      ['Género musical', d.genero, 'hl'],
      ['Activo desde', d.activo_desde],
      ['Tipo', d.tipo],
      ['Sello', d.sello || d.ep_label],
      ['Discografía', disc.join(' · ')],
      ['Colaboraciones', colab.join(' · ')],
      ['Score Top of Talent', (scoreVal != null ? scoreVal + ' / 100' : ''), 'score']
    ];
    var tbl = document.querySelector('.specs-table');
    if (tbl) {
      tbl.innerHTML = specs.filter(function(s){ return s[1] != null && String(s[1]).trim() !== ''; }).map(function(s){
        var v = s[2] === 'score' ? '<span class="spec-highlight" style="font-size:20px;font-weight:700">' + esc(s[1]) + '</span>'
              : s[2] === 'hl'    ? '<span class="spec-highlight">' + esc(s[1]) + '</span>'
              : esc(s[1]);
        return '<tr class="fade-up"><td>' + esc(s[0]) + '</td><td>' + v + '</td></tr>';
      }).join('');
    }

    // Biografía
    setText('.bio-headline', d.bio_headline);
    var bioBody = document.querySelector('.bio-body');
    if (bioBody) {
      var paras = [d.bio_p1, d.bio_p2, d.bio_p3, d.bio_p4].filter(function(p){ return p && String(p).trim(); });
      if (paras.length) bioBody.innerHTML = paras.map(function(p){ return '<p>' + esc(p) + '</p>'; }).join('');
    }
    var bioRight = document.querySelector('.bio-right');
    if (bioRight) {
      var blocks = '';
      if (disc.length)  blocks += '<div class="credit-block"><span class="credit-label">Discografía destacada</span>' + disc.map(function(x){ return '<span class="credit-item">' + esc(x) + '</span>'; }).join('') + '</div>';
      if (colab.length) blocks += '<div class="credit-block"><span class="credit-label">Colaboraciones</span>' + colab.map(function(x){ return '<span class="credit-item">' + esc(x) + '</span>'; }).join('') + '</div>';
      if (blocks) bioRight.innerHTML = blocks;
    }

    // Enlaces (Spotify / Instagram)
    var sp = document.querySelector('.profile-cta .btn-dark');
    if (sp && d.link_spotify) sp.href = d.link_spotify;
    var ig = document.querySelector('.profile-cta .btn-outline');
    if (ig && d.link_instagram) ig.href = d.link_instagram;

    revealFadeUps();
  } catch(e){ console.error('artista-ficha:', e); }
})();
