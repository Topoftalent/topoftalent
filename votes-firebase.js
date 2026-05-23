// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT — Votes & Comments via Firestore
// Reemplaza la lógica de localStorage en artista-extras.js
// Estructura Firestore:
//   votes/{artistId}/fans/{userId}   → { total, lastVote (Timestamp) }
//   comments/{artistId}/list/{docId} → { username, text, createdAt }
// ─────────────────────────────────────────────────────────────────
import { db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, getDocs
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

export async function castVote(artistId, userId) {
  var fanRef = doc(db, 'votes', artistId, 'fans', userId);
  await setDoc(fanRef, {
    total: increment(1),
    lastVote: serverTimestamp()
  }, { merge: true });
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

// Real-time top fans listener (calls cb with array of {username, total})
export function listenTopFans(artistId, cb) {
  var q = query(
    collection(db, 'votes', artistId, 'fans'),
    orderBy('total', 'desc'),
    limit(10)
  );
  return onSnapshot(q, async function(snap) {
    var fans = [];
    for (var d of snap.docs) {
      var uid = d.id;
      // Fetch username from users collection
      var userSnap = await getDoc(doc(db, 'users', uid));
      var username = userSnap.exists() ? ('@' + userSnap.data().username) : uid;
      fans.push({ username, total: d.data().total || 0 });
    }
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
      return { u: d.data().username, t: d.data().text };
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

export async function incrementCommentCount(userId) {
  var today = new Date().toISOString().split('T')[0];
  var current = await getCommentCountToday(userId);
  await updateDoc(doc(db, 'users', userId), {
    cmtDaily: { date: today, count: current + 1 }
  });
}
