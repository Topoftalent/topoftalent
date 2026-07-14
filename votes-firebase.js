// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Votes & Comments via Firestore
// Reemplaza la lógica de localStorage en artista-extras.js
// Estructura Firestore:
//   votes/{artistId}/fans/{userId}   → { total, lastVote (Timestamp) }
//   comments/{artistId}/list/{docId} → { username, text, createdAt }
// ─────────────────────────────────────────────────────────────────
import { db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── VOTE ─────────────────────────────────────────────────────────
// Returns { canVote: bool, total: number, lastVote: Date|null }
export async function getMyVoteData(artistId, userId) {
  try {
    var snap = await getDoc(doc(db, 'votes', artistId, 'fans', userId));
    if (!snap.exists()) return { canVote: true, total: 0, lastVote: null };
    var d = snap.data();
    var last = d.lastVote ? d.lastVote.toDate() : null;
    var canVote = !last || (Date.now() - last.getTime()) > 28800000; // 8h
    return { canVote, total: d.total || 0, lastVote: last };
  } catch(e) { return { canVote: false, total: 0, lastVote: null }; }
}

export async function castVote(artistId, userId, username, fanNum) {
  var fanRef = doc(db, 'votes', artistId, 'fans', userId);
  var payload = {
    total: increment(1),
    lastVote: serverTimestamp()
  };
  // Denormalize username + fan number into the (public) vote doc so the fan
  // ranking never has to read other users' private docs (which would leak
  // their email). fanNum is the fallback identifier when there's no username.
  if (typeof username === 'string' && username) payload.username = username.slice(0, 40);
  if (typeof fanNum   === 'string' && fanNum)   payload.fanNum   = fanNum.slice(0, 20);
  await setDoc(fanRef, payload, { merge: true });
}

// Returns total votes across all fans for an artist (for public counter)
export async function getTotalVotes(artistId) {
  try {
    var snap = await getDocs(collection(db, 'votes', artistId, 'fans'));
    var total = 0;
    snap.forEach(function(d){ total += (d.data().total || 0); });
    return total;
  } catch(e) { return 0; }
}

// Returns {artistId: totalVotes} for all artists
export async function getAllVoteTotals() {
  var ids = ['artista1','artista2','artista3','artista4','artista5',
             'artista6','artista7','artista8','artista9','artista10'];
  var totals = {};
  await Promise.all(ids.map(async function(id) {
    totals[id] = await getTotalVotes(id);
  }));
  return totals;
}

// Returns {artistId: {total, lastVoteAt}} for all artists.
// lastVoteAt = timestamp (ms) of the most recent vote that pushed the
// artist to their current total · used to break ties: whoever reached
// the tied vote count earlier (lower lastVoteAt) ranks higher.
export async function getAllVoteTotalsWithTiebreak() {
  var ids = ['artista1','artista2','artista3','artista4','artista5',
             'artista6','artista7','artista8','artista9','artista10'];
  var result = {};
  await Promise.all(ids.map(async function(id) {
    try {
      var snap = await getDocs(collection(db, 'votes', id, 'fans'));
      var total = 0, lastVoteAt = 0;
      snap.forEach(function(d) {
        var data = d.data();
        total += (data.total || 0);
        var t = data.lastVote ? data.lastVote.toMillis() : 0;
        if (t > lastVoteAt) lastVoteAt = t;
      });
      result[id] = { total: total, lastVoteAt: lastVoteAt || Infinity };
    } catch(e) {
      result[id] = { total: 0, lastVoteAt: Infinity };
    }
  }));
  return result;
}

// Get a single artist's name from Firestore
export async function getArtistName(artistId) {
  try {
    var snap = await getDoc(doc(db, 'artistas', artistId));
    return snap.exists() ? (snap.data().nombre || artistId) : artistId;
  } catch(e) { return artistId; }
}

// Real-time top fans listener (calls cb with array of {username, total})
export function listenTopFans(artistId, cb) {
  var q = query(
    collection(db, 'votes', artistId, 'fans'),
    orderBy('total', 'desc'),
    limit(15)
  );
  return onSnapshot(q, function(snap) {
    // Read the username straight from the public vote doc — no cross-user
    // reads, so members' private data is never exposed to build the ranking.
    var fans = snap.docs.map(function(d) {
      var uname  = d.data().username;
      var fanNum = d.data().fanNum;
      // Prefer @username; if none, use the fan number as identifier; else "Fan".
      var display = uname ? ('@' + uname) : (fanNum || 'Fan');
      return { username: display, total: d.data().total || 0 };
    });
    cb(fans);
  });
}

// ── COMMENTS ─────────────────────────────────────────────────────
// Real-time comments listener
export function listenComments(artistId, cb) {
  var q = query(
    collection(db, 'comments', artistId, 'list'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, function(snap) {
    var comments = snap.docs.map(function(d) {
      return { id: d.id, u: d.data().username, t: d.data().text };
    });
    cb(comments);
  });
}

export async function addComment(artistId, userId, username, text) {
  await addDoc(collection(db, 'comments', artistId, 'list'), {
    userId,
    username,
    text,
    createdAt: serverTimestamp()
  });
}

// Daily comment count (stored in Firestore user doc to prevent client tampering)
export async function getCommentCountToday(userId) {
  try {
    var snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return 0;
    var d = snap.data();
    var today = new Date().toISOString().split('T')[0];
    if (!d.cmtDaily || d.cmtDaily.date !== today) return 0;
    return d.cmtDaily.count || 0;
  } catch(e) { return 0; }
}

export async function reportComment(commentId, reportedUser, reportedBy, artistId) {
  await addDoc(collection(db, 'reports'), {
    commentId: commentId,
    reportedUser: reportedUser,
    reportedBy: reportedBy,
    artistId: artistId,
    createdAt: serverTimestamp(),
    status: 'pending'
  });
}

export async function deleteComment(artistId, commentId) {
  await deleteDoc(doc(db, 'comments', artistId, 'list', commentId));
}

// Admin: read the most recent audit-log entries (admin-only per rules).
export async function getAdminLog(max) {
  var q = query(collection(db, 'admin_log'), orderBy('at', 'desc'), limit(max || 60));
  var snap = await getDocs(q);
  return snap.docs.map(function(d) {
    var x = d.data();
    return {
      action:    x.action || '',
      signature: x.signature || '',
      artistId:  x.artistId || '',
      detail:    x.detail || '',
      at:        x.at && x.at.toDate ? x.at.toDate() : null
    };
  });
}

// Admin: append an immutable audit-log entry (who did what, when).
export async function logAdminAction(action, signature, artistId, detail) {
  await addDoc(collection(db, 'admin_log'), {
    action:    action,
    signature: signature,
    artistId:  artistId || null,
    detail:    detail || '',
    at:        serverTimestamp()
  });
}

// Admin: set editorial (score_tot) and/or criticos (score_criticos) scores.
// Pass a number to set, or null to leave that field untouched.
export async function setArtistScores(artistId, scoreTot, scoreCriticos) {
  var payload = {};
  if (typeof scoreTot === 'number')      payload.score_tot      = scoreTot;
  if (typeof scoreCriticos === 'number') payload.score_criticos = scoreCriticos;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(db, 'artistas', artistId), payload);
}

export async function resetArtistVotes(artistId) {
  var fansSnap = await getDocs(collection(db, 'votes', artistId, 'fans'));
  await Promise.all(fansSnap.docs.map(function(d) {
    return deleteDoc(doc(db, 'votes', artistId, 'fans', d.id));
  }));
}

export async function incrementCommentCount(userId) {
  var today = new Date().toISOString().split('T')[0];
  var current = await getCommentCountToday(userId);
  await updateDoc(doc(db, 'users', userId), {
    cmtDaily: { date: today, count: current + 1 }
  });
}
 
 
