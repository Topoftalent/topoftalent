// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Cloud Functions
// Limite de comentarios del lado servidor (a prueba de manipulacion).
//
// El limite del navegador (getCommentCountToday) es la primera linea:
// buena para UX ("quedan N"), pero un usuario podria manipularlo.
// Esta funcion es el respaldo autoritativo: cuenta en un doc que el
// cliente NO puede tocar (rate_limits, bloqueado por reglas) y borra
// los comentarios que pasen el limite diario.
// ─────────────────────────────────────────────────────────────────
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const DAILY_LIMIT = 5; // comentarios por usuario por dia

exports.enforceCommentLimit = onDocumentCreated(
  "comments/{artistId}/list/{commentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data() || {};
    const userId = data.userId;
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD (UTC)
    const rlRef = db.doc(`rate_limits/${userId}`);

    // Transaccion: lee el contador del dia, decide, escribe.
    const overLimit = await db.runTransaction(async (tx) => {
      const rlDoc = await tx.get(rlRef);
      let count = 0;
      if (rlDoc.exists && rlDoc.data().date === today) {
        count = rlDoc.data().count || 0;
      }
      if (count >= DAILY_LIMIT) return true;
      tx.set(rlRef, { date: today, count: count + 1 }, { merge: true });
      return false;
    });

    // Si paso el limite, elimina el comentario recien creado.
    if (overLimit) {
      await snap.ref.delete();
    }
  }
);
