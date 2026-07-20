// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Contenido automático (broadcasts)
//
//   - TOP 7 semanal    · programado sábado 11:00 Ecuador
//   - Resumen semanal  · programado domingo 19:00 Ecuador (calcula #1)
//   - Nuevo artista    · trigger onCreate(artistas) + endpoint admin
//
// Envía a MIEMBROS respetando la preferencia correspondiente
// (semanal / novedades, default ON). Usa el helper sendEmail de
// notificaciones.js (misma plantilla de marca).
// ─────────────────────────────────────────────────────────────────
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const noti = require("./notificaciones");

const BREVO_API_KEY = noti.BREVO_API_KEY;
const SITE = noti.SITE;
const db = getFirestore();

const ADMIN_TOKEN = "tot-admin-4b8d2e6a10";

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
function prefOn(user, key) { return !user.prefs || user.prefs[key] !== false; }

// Envía un correo (mismo para todos) a los miembros con la pref activa.
// buildCorreo(user) -> objeto de correo o null para saltar.
async function enviarAMiembros({ apiKey, prefKey, buildCorreo, dryRun }) {
  const { sendEmail } = noti._helpers;
  const snap = await db.collection("users").where("isMember", "==", true).get();
  let enviados = 0; const errores = []; const report = [];
  for (const doc of snap.docs) {
    const u = doc.data();
    if (!u.email) continue;
    if (prefKey && !prefOn(u, prefKey)) continue;
    const correo = buildCorreo(u);
    if (!correo) continue;
    report.push(correo.to);
    if (dryRun) continue;
    try { await sendEmail(correo, apiKey); enviados++; }
    catch (e) { errores.push({ email: u.email, error: e.message }); }
  }
  return { enviados, errores, destinatarios: report.length, miembros: snap.size };
}

// Calcula el artista #1 por votos (suma total, desempate por quién llegó antes).
async function artistaNumeroUno() {
  const votes = await db.collectionGroup("fans").get();
  const tot = {}, last = {};
  votes.forEach((d) => {
    const p = d.ref.parent.parent; if (!p) return;
    const id = p.id, data = d.data();
    tot[id] = (tot[id] || 0) + (data.total || 0);
    const ms = data.lastVote && data.lastVote.toMillis ? data.lastVote.toMillis() : 0;
    if (!last[id] || ms > last[id]) last[id] = ms;
  });
  let best = null;
  for (const id of Object.keys(tot)) {
    if (!best || tot[id] > tot[best] || (tot[id] === tot[best] && last[id] < last[best])) best = id;
  }
  if (!best) return null;
  return { id: best, nombre: NOMBRES[best] || best, total: tot[best], slug: SLUGS[best] || best };
}

// ── TOP 7 semanal · sábado 11:00 Ecuador ───────────────────────────
exports.top7Semanal = onSchedule(
  { schedule: "0 11 * * 6", timeZone: "America/Guayaquil", region: "us-east1", secrets: [BREVO_API_KEY], memory: "256MiB" },
  async () => {
    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey: "semanal",
      buildCorreo: (u) => ({
        to: u.email,
        subject: "El nuevo TOP 7 de la semana ya está aquí",
        preheader: "Descubre quién entró y vota por tu favorita.",
        titulo: "El nuevo TOP 7 ya está aquí",
        cuerpoHtml: "Actualizamos las 7 mejores canciones de la semana. Mira quién subió, quién se mantiene y vota por la que más suena para ti.",
        textoBoton: "Ver el TOP 7",
        linkBoton: `${SITE}/talento`,
      }),
    });
    logger.info("top7Semanal", r);
  }
);

// ── Resumen semanal · domingo 19:00 Ecuador ────────────────────────
exports.resumenSemanal = onSchedule(
  { schedule: "0 19 * * 0", timeZone: "America/Guayaquil", region: "us-east1", secrets: [BREVO_API_KEY], memory: "256MiB" },
  async () => {
    const uno = await artistaNumeroUno();
    const lineaUno = uno
      ? `Esta semana el artista más votado es <b>${uno.nombre}</b>.`
      : "Esta semana la escena sigue moviéndose.";
    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey: "semanal",
      buildCorreo: (u) => ({
        to: u.email,
        subject: "Tu semana en Top of Talent",
        preheader: "El #1 de la semana y el nuevo TOP 7, en un vistazo.",
        titulo: "Tu semana en Top of Talent",
        cuerpoHtml: `${lineaUno} Descubre el nuevo TOP 7, mira tu posición en los Top Fans y sigue votando para mantener a tus artistas arriba.`,
        textoBoton: "Ver la plataforma",
        linkBoton: `${SITE}/talento`,
      }),
    });
    logger.info("resumenSemanal", { ...r, uno: uno && uno.id });
  }
);

// ── Nuevo artista · trigger onCreate(artistas) (idempotente) ───────
exports.onNuevoArtista = onDocumentCreated(
  { document: "artistas/{id}", secrets: [BREVO_API_KEY] },
  async (event) => {
    const snap = event.data; if (!snap) return;
    const data = snap.data() || {};
    if (data.notificado) return; // anti-doble-envío
    const id = event.params.id;
    const nombre = data.name || data.nombre || NOMBRES[id] || "un nuevo artista";
    const slug = data.slug || SLUGS[id] || "talento";
    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey: "novedades",
      buildCorreo: (u) => ({
        to: u.email,
        subject: `Nuevo talento en Top of Talent: ${nombre}`,
        preheader: "Conócelo y dale tu voto.",
        titulo: `Nuevo talento: ${nombre}`,
        cuerpoHtml: `<b>${nombre}</b> acaba de entrar a la plataforma. Escúchalo, conoce su historia y, si te gusta, súmate a los que lo están impulsando al TOP.`,
        textoBoton: `Conocer a ${nombre}`,
        linkBoton: `${SITE}/${slug}`,
      }),
    });
    await snap.ref.set({ notificado: true }, { merge: true });
    logger.info("onNuevoArtista", { id, ...r });
  }
);

// ── Endpoint admin: broadcast manual (nuevo artista / ad-hoc) ──────
// GET /broadcastAdmin?key=TOKEN&tipo=artista&nombre=...&slug=...[&send=1]
// tipo=libre: &subject=&titulo=&mensaje=&boton=&link=
exports.broadcastAdmin = onRequest(
  { region: "us-east1", secrets: [BREVO_API_KEY] },
  async (req, res) => {
    if (req.query.key !== ADMIN_TOKEN) { res.status(403).send("forbidden"); return; }
    const q = req.query;
    const dryRun = q.send !== "1";
    let correoBase, prefKey;

    if (q.tipo === "artista") {
      const nombre = q.nombre || "un nuevo artista";
      const slug = q.slug || "talento";
      prefKey = "novedades";
      correoBase = {
        subject: `Nuevo talento en Top of Talent: ${nombre}`,
        preheader: "Conócelo y dale tu voto.",
        titulo: `Nuevo talento: ${nombre}`,
        cuerpoHtml: `<b>${nombre}</b> acaba de entrar a la plataforma. Escúchalo, conoce su historia y, si te gusta, súmate a los que lo están impulsando al TOP.`,
        textoBoton: `Conocer a ${nombre}`,
        linkBoton: `${SITE}/${slug}`,
      };
    } else {
      prefKey = q.pref || null;
      correoBase = {
        subject: q.subject || "Novedades de Top of Talent",
        preheader: q.preheader || "",
        titulo: q.titulo || "Top of Talent",
        cuerpoHtml: q.mensaje || "",
        textoBoton: q.boton || "Ver la plataforma",
        linkBoton: q.link || `${SITE}/talento`,
      };
    }

    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey,
      buildCorreo: (u) => Object.assign({ to: u.email }, correoBase),
      dryRun,
    });
    res.status(200).json({ dryRun, ...r });
  }
);
