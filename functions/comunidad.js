// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Notificaciones de comunidad (triggers Firestore)
//
// Conecta de verdad los 3 toggles que antes no disparaban nada:
//   - eventos   → al CREAR un doc en  eventos/{id}     (admin publica un evento)
//   - novedades → al CREAR un doc en  novedades/{id}   (novedad de un talento)
//   - comunidad → al comentar en      comments/{artistId}/list/{id}
//                 (actividad en el perfil de un talento → avisa a sus fans)
//
// Respeta: preferencias (user.prefs.*, default ON · comunidad es opt-in),
// solo miembros (isMember == true) y, en comunidad, anti-spam de 1 aviso
// por talento por día. Usa el helper sendEmail de notificaciones.js.
//
// Para NO notificar al crear un evento/novedad (borrador), guarda el doc
// con  notificar: false.
// ─────────────────────────────────────────────────────────────────
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const noti = require("./notificaciones");

const BREVO_API_KEY = noti.BREVO_API_KEY;
const SITE = noti.SITE;
const db = getFirestore();
const REGION = "us-east1";

const SLUGS = {
  artista1: "alex-ponce", artista2: "johann-vera", artista3: "mar-rendon",
  artista4: "jombriel", artista5: "alex-krack", artista6: "dicapo",
  artista7: "kenny-die", artista8: "yilda", artista9: "ren-kai", artista10: "blanko",
};
const NOMBRES = {
  artista1: "Alex Ponce", artista2: "Johann Vera", artista3: "Mar Rendón",
  artista4: "Jombriel", artista5: "Alex Krack", artista6: "Dicapo",
  artista7: "Kenny Die", artista8: "Yilda", artista9: "Ren Kai", artista10: "Blanko",
};

function prefOn(user, key) {
  // comunidad es opt-in (default OFF): solo si está explícitamente en true.
  if (key === "comunidad") return !!(user.prefs && user.prefs.comunidad === true);
  return !user.prefs || user.prefs[key] !== false;
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function hoy() { return new Date().toISOString().split("T")[0]; } // YYYY-MM-DD UTC

// Envía el mismo correo a los miembros con la pref activa.
// buildCorreo(user) -> objeto de correo o null para saltar a ese usuario.
async function enviarAMiembros({ apiKey, prefKey, buildCorreo }) {
  const { sendEmail } = noti._helpers;
  const snap = await db.collection("users").where("isMember", "==", true).get();
  let enviados = 0; const errores = [];
  for (const doc of snap.docs) {
    const u = doc.data();
    if (!u.email || !prefOn(u, prefKey)) continue;
    const correo = buildCorreo(u, doc.id);
    if (!correo) continue;
    try { await sendEmail(correo, apiKey); enviados++; }
    catch (e) { errores.push({ email: u.email, error: e.message }); }
  }
  return { enviados, errores, miembros: snap.size };
}

// ── EVENTOS · al crear eventos/{id} ────────────────────────────────
exports.onEventoCreado = onDocumentCreated(
  { document: "eventos/{id}", region: REGION, secrets: [BREVO_API_KEY], memory: "256MiB" },
  async (event) => {
    const snap = event.data; if (!snap) return;
    const d = snap.data() || {};
    if (d.notificar === false) { logger.info("evento sin notificar", { id: snap.id }); return; }

    const titulo = d.titulo || d.nombre || "Nuevo evento en Top of Talent";
    const resumen = d.resumen || d.descripcion || "Hay un nuevo evento. Mira los detalles y no te lo pierdas.";
    const fecha = d.fecha ? ` · ${esc(d.fecha)}` : "";
    const lugar = d.lugar || d.ciudad ? ` · ${esc(d.lugar || d.ciudad)}` : "";
    const link = d.link || `${SITE}/p-eventos`;

    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey: "eventos",
      buildCorreo: (u) => ({
        to: u.email,
        subject: `Nuevo evento: ${titulo}`,
        preheader: "Un nuevo evento acaba de publicarse.",
        titulo: esc(titulo),
        cuerpoHtml: `${esc(resumen)}<br><br><b>${esc(titulo)}</b>${fecha}${lugar}`,
        textoBoton: "Ver evento",
        linkBoton: link,
      }),
    });
    logger.info("onEventoCreado", { id: snap.id, ...r });
  }
);

// ── NOVEDADES · al crear novedades/{id} ────────────────────────────
exports.onNovedadCreada = onDocumentCreated(
  { document: "novedades/{id}", region: REGION, secrets: [BREVO_API_KEY], memory: "256MiB" },
  async (event) => {
    const snap = event.data; if (!snap) return;
    const d = snap.data() || {};
    if (d.notificar === false) { logger.info("novedad sin notificar", { id: snap.id }); return; }

    const artistaId = d.artista || d.artistId || d.talento || null;
    const artistaNombre = (artistaId && NOMBRES[artistaId]) || d.artistaNombre || null;
    const titulo = d.titulo || (artistaNombre ? `Novedad de ${artistaNombre}` : "Nueva novedad en Top of Talent");
    const cuerpo = d.cuerpo || d.resumen || d.descripcion || "Hay una nueva novedad que te puede interesar.";
    const slug = (artistaId && SLUGS[artistaId]) || null;
    const link = d.link || (slug ? `${SITE}/${slug}` : `${SITE}/p-otros`);

    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey: "novedades",
      buildCorreo: (u) => ({
        to: u.email,
        subject: esc(titulo),
        preheader: "Novedades frescas en Top of Talent.",
        titulo: esc(titulo),
        cuerpoHtml: esc(cuerpo),
        textoBoton: "Ver novedad",
        linkBoton: link,
      }),
    });
    logger.info("onNovedadCreada", { id: snap.id, ...r });
  }
);

// ── COMUNIDAD · al comentar en el perfil de un talento ─────────────
// Avisa a los fans de ese talento (pref comunidad, opt-in) que hay nueva
// actividad. Anti-spam: 1 aviso por talento por día (el primer comentario
// del día dispara; los siguientes de ese día se saltan). Excluye al autor.
exports.onComentarioComunidad = onDocumentCreated(
  { document: "comments/{artistId}/list/{commentId}", region: REGION, secrets: [BREVO_API_KEY], memory: "256MiB" },
  async (event) => {
    const snap = event.data; if (!snap) return;
    const c = snap.data() || {};
    const artistId = event.params.artistId;
    const autorId = c.userId || null;

    // Anti-spam: una sola notificación por talento por día.
    const stateRef = db.doc("noti_state/comunidad");
    const yaHoy = await db.runTransaction(async (tx) => {
      const st = await tx.get(stateRef);
      const data = st.exists ? (st.data() || {}) : {};
      if (data[artistId] === hoy()) return true;             // ya se avisó hoy
      tx.set(stateRef, { [artistId]: hoy() }, { merge: true });
      return false;
    });
    if (yaHoy) { logger.info("comunidad: ya notificado hoy", { artistId }); return; }

    // Nombre del talento (Firestore → mapa → id).
    let artista = NOMBRES[artistId] || artistId;
    try {
      const aDoc = await db.doc(`artistas/${artistId}`).get();
      if (aDoc.exists) artista = aDoc.data().name || aDoc.data().nombre || artista;
    } catch (e) { /* usa el fallback */ }

    // Fans del talento (quienes votaron por él).
    const fansSnap = await db.collection(`artistas/${artistId}/fans`).get();
    const fanIds = new Set();
    fansSnap.forEach((f) => { if (f.id !== autorId) fanIds.add(f.id); });
    if (!fanIds.size) { logger.info("comunidad: sin fans", { artistId }); return; }

    const slug = SLUGS[artistId] || artistId;
    const link = `${SITE}/${slug}`;
    const apiKey = BREVO_API_KEY.value();
    const { sendEmail } = noti._helpers;

    let enviados = 0; const errores = [];
    // Lee los docs de los fans y filtra por miembro + pref comunidad.
    const reads = await Promise.all(
      Array.from(fanIds).map((uid) => db.doc(`users/${uid}`).get())
    );
    for (const uDoc of reads) {
      if (!uDoc.exists) continue;
      const u = uDoc.data();
      if (!u.email || u.isMember !== true || !prefOn(u, "comunidad")) continue;
      try {
        await sendEmail({
          to: u.email,
          subject: `Nueva actividad en el perfil de ${artista}`,
          preheader: "La comunidad está moviéndose.",
          titulo: `Se mueve la comunidad de ${esc(artista)}`,
          cuerpoHtml: `Hay nueva actividad en el perfil de <b>${esc(artista)}</b>: comentarios y participación de la comunidad. Pásate, deja tu voto y suma tu voz.`,
          textoBoton: "Ir al perfil",
          linkBoton: link,
        }, apiKey);
        enviados++;
      } catch (e) { errores.push({ email: u.email, error: e.message }); }
    }
    logger.info("onComentarioComunidad", { artistId, enviados, fans: fanIds.size, errores: errores.length });
  }
);
