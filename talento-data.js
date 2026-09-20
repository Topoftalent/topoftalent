/**
 * talento-data.js · ES Module
 * Loads artistas from Firestore and drives the talento.html carousel + Top7.
 * Replaces the static artistas.js window.TOT_ARTISTAS array.
 */

import { db } from './firebase-config.js';
import {
  collection, getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

var ARTIST_IDS = ['artista1','artista2','artista3','artista4','artista5',
                  'artista6','artista7','artista8','artista9','artista10'];

// Tone classes cycle for cards that have no photo
var TONES = ['tone-1','tone-2','tone-3','tone-4','tone-5','tone-6','tone-1','tone-2','tone-3','tone-4'];

// Fallback estático: si Firestore/App Check no responde (p. ej. Safari con ITP),
// el carrusel igual muestra los artistas en vez de quedar en blanco.
var FALLBACK_ARTISTAS = [
  {id:'artista1', file:'alex-ponce',  name:'Alex Ponce',   genre:'Pop',    tone:'tone-1', foto:'fotos/artista1/portada.webp',  ranking:1},
  {id:'artista2', file:'johann-vera', name:'Johann Vera',  genre:'Pop',    tone:'tone-2', foto:'fotos/artista2/portada.webp',  ranking:2},
  {id:'artista3', file:'mar-rendon',  name:'Mar Rendón',   genre:'Pop',    tone:'tone-3', foto:'fotos/artista3/portada.webp',  ranking:3},
  {id:'artista4', file:'jombriel',    name:'Jombriel',     genre:'Urbano', tone:'tone-4', foto:'fotos/artista4/portada.webp',  ranking:4},
  {id:'artista5', file:'alex-krack',  name:'Alex Krack',   genre:'Urbano', tone:'tone-5', foto:'fotos/artista5/portada.webp',  ranking:5},
  {id:'artista6', file:'dicapo',      name:'Dicapo',       genre:'Pop',    tone:'tone-6', foto:'fotos/artista6/portada.webp',  ranking:6},
  {id:'artista7', file:'kenny-die',   name:'Kenny Die',    genre:'Trap',   tone:'tone-1', foto:'fotos/artista7/portada.webp',  ranking:7},
  {id:'artista8', file:'yilda',       name:'Yilda',        genre:'Pop',    tone:'tone-2', foto:'fotos/artista8/portada.webp',  ranking:8},
  {id:'artista9', file:'ren-kai',     name:'Ren Kai',      genre:'Latino', tone:'tone-3', foto:'fotos/artista9/portada.webp',  ranking:9},
  {id:'artista10',file:'blanko',      name:'Blanko',       genre:'Urbano', tone:'tone-4', foto:'fotos/artista10/portada.webp', ranking:10},
];

async function getVoteTotals() {
  var totals = {};
  await Promise.all(ARTIST_IDS.map(async function(id) {
    try {
      var snap = await getDocs(collection(db, 'votes', id, 'fans'));
      var t = 0, lastVoteAt = 0;
      snap.forEach(function(d) {
        var data = d.data();
        t += (data.total || 0);
        var ts = data.lastVote ? data.lastVote.toMillis() : 0;
        if (ts > lastVoteAt) lastVoteAt = ts;
      });
      totals[id] = { total: t, lastVoteAt: lastVoteAt || Infinity };
    } catch(e) { totals[id] = { total: 0, lastVoteAt: Infinity }; }
  }));
  return totals;
}

async function loadArtistas() {
  var snap = await getDocs(
    query(collection(db, 'artistas'), orderBy('order'))
  );

  var artistas = [];
  snap.forEach(function(d) {
    var data = d.data();
    if (data.active === false) return;

    // Build short bio from bio_headline or first bio paragraph
    var bio = data.bio_headline || data.bio_p1 || '';
    if (bio.length > 120) bio = bio.substring(0, 117) + '…';

    // First discografia item as "song" for Top7
    var discArr = Array.isArray(data.discografia)
      ? data.discografia
      : (data.discografia ? data.discografia.split('|').map(function(x){ return x.trim(); }) : []);
    var song = discArr[0] || '';

    artistas.push({
      id:     d.id,
      file:   (window.TOT_SLUG_OF ? window.TOT_SLUG_OF(d.id) : d.id),
      name:   data.nombre  || d.id,
      song:   song,
      genre:  data.genero  || '',
      city:   data.ciudad  || '',
      year:   data.activo_desde || '',
      score:  data.score   || 0,
      score_tot:      (typeof data.score_tot      === 'number') ? data.score_tot      : null,
      score_criticos: (typeof data.score_criticos === 'number') ? data.score_criticos : null,
      tone:   TONES[(data.order || 1) - 1] || 'tone-1',
      bio:    bio,
      // Portada local (WebP, mismo origen): carga siempre, también en Safari con bloqueadores.
      foto:   'fotos/' + d.id + '/portada.webp',
      ranking: data.ranking || data.order || 0,
      yt:     data.yt_link || '',
    });
  });

  return artistas;
}

function applyVotesAndRender(artistas, voteTotals) {
  window.TOT_ARTISTAS = artistas;

  // Plain numbers for display/consumers that just need the vote count.
  var plainTotals = {};
  Object.keys(voteTotals).forEach(function(id) {
    plainTotals[id] = voteTotals[id].total || 0;
  });
  window.TOT_VOTE_TOTALS = plainTotals;

  window.getTotalVotes = function(artistId) {
    return window.TOT_VOTE_TOTALS[artistId] || 0;
  };

  // Sort by vote total descending; ties broken by whoever reached that
  // count first (earlier lastVoteAt), same rule used on artista fichas.
  artistas.sort(function(a, b) {
    var va = voteTotals[a.id] || { total: 0, lastVoteAt: Infinity };
    var vb = voteTotals[b.id] || { total: 0, lastVoteAt: Infinity };
    return (vb.total - va.total) || (va.lastVoteAt - vb.lastVoteAt) || (a.ranking - b.ranking);
  });

  var ct = document.getElementById('eyebrowCount');
  if (ct) ct.textContent = artistas.length + ' artistas';

  if (typeof buildCarousel === 'function') buildCarousel();
  if (typeof buildTop7     === 'function') buildTop7();
}

async function refreshVotes() {
  try {
    var totals = await getVoteTotals();
    applyVotesAndRender(window.TOT_ARTISTAS || [], totals);
  } catch(e) { /* silently ignore */ }
}

async function init() {
  try {
    var [artistas, voteTotals] = await Promise.all([loadArtistas(), getVoteTotals()]);
    if (!artistas || !artistas.length) artistas = FALLBACK_ARTISTAS.slice();
    applyVotesAndRender(artistas, voteTotals || {});
  } catch(e) {
    // Firestore/App Check no disponible (p. ej. Safari con ITP): usar fallback
    // para que el carrusel y el Top 7 igual se muestren.
    console.error('[talento-data] Firestore no disponible, usando fallback:', e);
    applyVotesAndRender(FALLBACK_ARTISTAS.slice(), {});
  }
}

// Refresh vote counts when user returns to this tab (e.g. after voting on an artista page)
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible' && window.TOT_ARTISTAS) refreshVotes();
});

init();
