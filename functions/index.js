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

// Motor de notificaciones por email (Brevo). Debe ir DESPUÉS de initializeApp().
const notificaciones = require("./notificaciones");
exports.onUserCreated = notificaciones.onUserCreated;
exports.onMemberActivated = notificaciones.onMemberActivated;
exports.activarMembresia = notificaciones.activarMembresia;

// Motor de engagement (programado, requiere Blaze).
const engagement = require("./engagement");
exports.engagementDiario = engagement.engagementDiario;
exports.engagementDiag = engagement.engagementDiag; // diagnóstico dry-run (temporal)

// Contenido automático (resumen semanal combinado + nuevos artistas por tanda).
const contenido = require("./contenido");
exports.resumenSemanal = contenido.resumenSemanal;             // sábado 11:00 · TOP 7 + #1 en un correo
exports.notificarNuevosArtistas = contenido.notificarNuevosArtistas; // envío agrupado por tanda
exports.broadcastAdmin = contenido.broadcastAdmin;

// Endpoint de prueba (temporal): envía un correo de un tipo a una dirección.
const pruebas = require("./pruebas");
exports.pruebaCorreo = pruebas.pruebaCorreo;

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
