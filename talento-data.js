/**
 * talento-data.js — ES Module
 * Loads artistas from Firestore and drives the talento.html carousel + Top7.
 * Replaces the static artistas.js window.TOT_ARTISTAS array.
 */

import { db } from './firebase-config.js';
import {
  collection, getDocs, collectionGroup, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Tone classes cycle for cards that have no photo
var TONES = ['tone-1','tone-2','tone-3','tone-4','tone-5','tone-6','tone-1','tone-2','tone-3','tone-4'];

async function getVoteTotals() {
  var totals = {};
  try {
    var snap = await getDocs(collectionGroup(db, 'fans'));
    snap.forEach(function(d) {
      // Path: votes/{artistId}/fans/{userId}
      var artistId = d.ref.parent.parent.id;
      var data = d.data();
      var v = data.total || data.votes || 1;
      totals[artistId] = (totals[artistId] || 0) + v;
    });
  } catch(e) {
    // votes unavailable — return empty
  }
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
      file:   d.id + '.html',
      name:   data.nombre  || d.id,
      song:   song,
      genre:  data.genero  || '',
      city:   data.ciudad  || '',
      year:   data.activo_desde || '',
      score:  data.score   || 0,
      tone:   TONES[(data.order || 1) - 1] || 'tone-1',
      bio:    bio,
      foto:   data.foto_principal || '',
      ranking: data.ranking || data.order || 0,
    });
  });

  return artistas;
}

function applyVotesAndRender(artistas, voteTotals) {
  window.TOT_ARTISTAS = artistas;
  window.TOT_VOTE_TOTALS = voteTotals;

  window.getTotalVotes = function(artistId) {
    return window.TOT_VOTE_TOTALS[artistId] || 0;
  };

  // Sort by vote total descending, fall back to Firestore order
  artistas.sort(function(a, b) {
    var va = voteTotals[a.id] || 0;
    var vb = voteTotals[b.id] || 0;
    return vb - va || a.ranking - b.ranking;
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
    applyVotesAndRender(artistas, voteTotals);
  } catch(e) {
    console.error('[talento-data] Error cargando artistas:', e);
    if (typeof buildCarousel === 'function') buildCarousel();
    if (typeof buildTop7     === 'function') buildTop7();
  }
}

// Refresh vote counts when user returns to this tab (e.g. after voting on an artista page)
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible' && window.TOT_ARTISTAS) refreshVotes();
});

init();
