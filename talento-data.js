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
    var song = discArr[0] || '—';

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

async function init() {
  try {
    var [artistas, voteTotals] = await Promise.all([loadArtistas(), getVoteTotals()]);

    // Expose globally so inline functions in talento.html can access them
    window.TOT_ARTISTAS = artistas;
    window.TOT_VOTE_TOTALS = voteTotals;

    // Override the old localStorage-based getTotalVotes
    window.getTotalVotes = function(artistId) {
      return window.TOT_VOTE_TOTALS[artistId] || 0;
    };

    // Update count label
    var ct = document.getElementById('eyebrowCount');
    if (ct) ct.textContent = artistas.length + ' artistas';

    // Build UI
    if (typeof buildCarousel === 'function') buildCarousel();
    if (typeof buildTop7     === 'function') buildTop7();

  } catch(e) {
    console.error('[talento-data] Error cargando artistas:', e);
    // Fallback: keep whatever TOT_ARTISTAS was (empty array)
    if (typeof buildCarousel === 'function') buildCarousel();
    if (typeof buildTop7     === 'function') buildTop7();
  }
}

init();
