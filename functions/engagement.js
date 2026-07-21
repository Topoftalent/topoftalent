// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Notificaciones de engagement (programadas)
//
// UNA función diaria (20:00 Ecuador) que revisa Firestore y envía por
// Brevo según el día de la semana y las condiciones de cada usuario:
//   - Recordatorio de voto (8h)      · todos los días
//   - Invitación a votar (nunca votó)· martes y jueves
//   - Quedaste fuera del Top Fans    · miércoles
//   - Inactividad                    · miércoles
//
// Respeta: preferencias (user.prefs.*, default ON), anti-repetición
// (marcas en el doc del usuario) y solo miembros (isMember == true).
//
// Además expone un endpoint de diagnóstico (dry-run) protegido por
// token para verificar la lógica SIN enviar correos.
// ─────────────────────────────────────────────────────────────────
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const noti = require("./notificaciones");

const BREVO_API_KEY = noti.BREVO_API_KEY;
const SITE = noti.SITE;
const db = getFirestore();

const OCHO_HORAS_MS    = 8 * 3600 * 1000;
const INACTIVIDAD_DIAS = 5;
const REPETIR_INVITAR_DIAS = 4;
const REPETIR_INACTIV_DIAS = 7;
const TOP_FANS_N = 10;

// Token para el endpoint de diagnóstico (dry-run). Temporal.
const DIAG_TOKEN = "tot-diag-9f3a71c2e5";

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
function linkArtista(id) { return `${SITE}/${SLUGS[id] || id}`; }
function nombreArtista(id, mapa) { return mapa[id] || NOMBRES[id] || "tu artista"; }
function prefOn(user, key) { return !user.prefs || user.prefs[key] !== false; }
function nombreDe(u) { return u.nombre || u.username || u.firstName || ""; }
function msDe(ts) { return ts && ts.toMillis ? ts.toMillis() : 0; }

// ── Núcleo reutilizable ────────────────────────────────────────────
// Devuelve { enviados, report:[{tipo,email}], errores }.
// dryRun=true: NO envía ni escribe marcas; solo reporta qué haría.
async function procesarEngagement({ apiKey, day, dryRun }) {
  const { sendEmail } = noti._helpers;
  const ahora = Date.now();

  const [usersSnap, votesSnap, artistasSnap] = await Promise.all([
    db.collection("users").where("isMember", "==", true).get(),
    db.collectionGroup("fans").get(),
    db.collection("artistas").get(),
  ]);

  const artistaNombre = {};
  artistasSnap.forEach((d) => { artistaNombre[d.id] = (d.data().name || d.data().nombre || d.id); });

  const votosPorUser = {};
  const fansPorArtista = {};
  votesSnap.forEach((d) => {
    const parent = d.ref.parent.parent;
    if (!parent) return;
    const uid = d.id, artistId = parent.id, data = d.data();
    const total = data.total || 0, lastMs = msDe(data.lastVote);
    (fansPorArtista[artistId] = fansPorArtista[artistId] || []).push({ uid, total, lastMs });
    const u = (votosPorUser[uid] = votosPorUser[uid] || { topId: null, topTotal: -1, topLastMs: 0, latestMs: 0 });
    if (total > u.topTotal) { u.topTotal = total; u.topId = artistId; u.topLastMs = lastMs; }
    if (lastMs > u.latestMs) u.latestMs = lastMs;
  });

  const report = [];
  const errores = [];
  const tareas = [];
  let enviados = 0;

  async function enviar(tipo, user, correo, marca) {
    report.push({ tipo, email: correo.to });
    if (dryRun) return;
    try {
      await sendEmail(correo, apiKey);
      enviados++;
      if (marca) tareas.push(user._ref.set(marca, { merge: true }));
    } catch (e) {
      errores.push({ email: correo.to, error: e.message });
    }
  }

  for (const doc of usersSnap.docs) {
    const u = doc.data();
    if (!u.email) continue;
    u._ref = doc.ref;
    const nombre = nombreDe(u);
    const mv = votosPorUser[doc.id];

    // A · Recordatorio voto 8h (diario)
    if (prefOn(u, "voto") && mv && mv.topId) {
      const topLast = mv.topLastMs || 0;
      const pasaron8h = (ahora - topLast) >= OCHO_HORAS_MS;
      const yaAvisado = (u.voto8hRemindedForMs || 0) === topLast;
      if (topLast && pasaron8h && !yaAvisado) {
        const artista = artistaNombre[mv.topId] || "tu artista";
        await enviar("voto8h", u, {
          to: u.email,
          subject: `Tu voto por ${artista} ya está listo`,
          preheader: "Pasaron las 8 horas. Un voto más lo acerca al TOP.",
          titulo: `Ya puedes votar por ${artista}`,
          cuerpoHtml: `Pasaron las 8 horas: ya puedes volver a votar por <b>${artista}</b>. Un voto más lo acerca al TOP. No lo dejes caer.`,
          textoBoton: "Votar ahora",
          linkBoton: linkArtista(mv.topId),
        }, { voto8hRemindedForMs: topLast });
      }
    }

    // B · Invitación a votar (nunca votó) · martes(2)/jueves(4)
    if ((day === 2 || day === 4) && prefOn(u, "voto") && u.hasVoted !== true && !mv) {
      const ult = msDe(u.invitarVotarAt);
      if (!ult || (ahora - ult) > REPETIR_INVITAR_DIAS * 86400000) {
        await enviar("invitarVotar", u, {
          to: u.email,
          subject: `${nombre ? nombre + ", t" : "T"}u voto todavía no suena`,
          preheader: "Elige a tu primer artista y súbelo en el ranking.",
          titulo: "Da tu primer voto",
          cuerpoHtml: `Aún no has votado. Aquí tu voz mueve la escena: elige a un artista que te guste y dale tu primer voto. Es el primer paso para aparecer en su Top Fans.`,
          textoBoton: "Dar mi primer voto",
          linkBoton: `${SITE}/talento`,
        }, { invitarVotarAt: FieldValue.serverTimestamp() });
      }
    }

    // D · Inactividad · miércoles(3)
    if (day === 3 && prefOn(u, "voto")) {
      const ultAct = msDe(u.lastActivityAt);
      const inactivo = ultAct && (ahora - ultAct) > INACTIVIDAD_DIAS * 86400000;
      const ultAviso = msDe(u.inactividadAt);
      if (inactivo && (!ultAviso || (ahora - ultAviso) > REPETIR_INACTIV_DIAS * 86400000)) {
        const artista = mv && mv.topId ? (artistaNombre[mv.topId] || "tu artista") : "la escena";
        const link = mv && mv.topId ? linkArtista(mv.topId) : `${SITE}/talento`;
        await enviar("inactividad", u, {
          to: u.email,
          subject: "Tu artista te extraña",
          preheader: "Deja un comentario y vuelve a la escena.",
          titulo: "Hace rato no te vemos",
          cuerpoHtml: `Hace unos días que no pasas. ${artista === "la escena" ? "La escena sigue" : "<b>" + artista + "</b> sigue"} en la pelea y tu apoyo cuenta. Vuelve, deja un comentario y dale tu voto de hoy.`,
          textoBoton: "Volver a la plataforma",
          linkBoton: link,
        }, { inactividadAt: FieldValue.serverTimestamp() });
      }
    }
  }

  // C · Quedaste fuera del Top Fans · miércoles(3)
  if (day === 3) {
    const stateRef = db.doc("noti_state/topfans");
    const prevSnap = await stateRef.get();
    const prev = prevSnap.exists ? (prevSnap.data().porArtista || {}) : {};
    const nuevo = {};
    const userDe = {};
    usersSnap.forEach((d) => { const x = d.data(); x._ref = d.ref; userDe[d.id] = x; });

    for (const artistId of Object.keys(fansPorArtista)) {
      const orden = fansPorArtista[artistId].slice()
        .sort((a, b) => (b.total - a.total) || (a.lastMs - b.lastMs))
        .slice(0, TOP_FANS_N).map((f) => f.uid);
      nuevo[artistId] = orden;
      const antes = prev[artistId] || [];
      for (const uid of antes.filter((x) => !orden.includes(x))) {
        const user = userDe[uid];
        if (!user || !user.email || !prefOn(user, "posicion")) continue;
        const artista = artistaNombre[artistId] || "tu artista";
        await enviar("fueraTopFans", user, {
          to: user.email,
          subject: `Alguien te pasó en el Top Fans de ${artista}`,
          preheader: "Un par de votos y recuperas tu lugar.",
          titulo: `Perdiste tu lugar con ${artista}`,
          cuerpoHtml: `Saliste del Top Fans de <b>${artista}</b>. ¿Lo vas a dejar así? Con un par de votos vuelves a subir.`,
          textoBoton: "Recuperar mi lugar",
          linkBoton: linkArtista(artistId),
        }, null);
      }
    }
    if (!dryRun) tareas.push(stateRef.set({ porArtista: nuevo, updatedAt: FieldValue.serverTimestamp() }));
  }

  // E · Logros y hitos: tu artista llegó al #1 (cualquier día) · pref "hitos"
  {
    const totales = {};
    for (const aid of Object.keys(fansPorArtista)) {
      totales[aid] = fansPorArtista[aid].reduce((s, f) => s + f.total, 0);
    }
    let top1 = null;
    for (const aid of Object.keys(totales)) { if (!top1 || totales[aid] > totales[top1]) top1 = aid; }

    const hitoRef = db.doc("noti_state/hito");
    const hitoSnap = await hitoRef.get();
    const prevTop1 = hitoSnap.exists ? hitoSnap.data().top1 : undefined;

    // Solo notifica si hay un cambio real de #1 (no en la primera corrida).
    if (top1 && prevTop1 !== undefined && top1 !== prevTop1) {
      const artista = nombreArtista(top1, artistaNombre);
      const fansIds = new Set((fansPorArtista[top1] || []).map((f) => f.uid));
      for (const doc of usersSnap.docs) {
        const u = doc.data();
        if (!u.email || !fansIds.has(doc.id) || !prefOn(u, "hitos")) continue;
        u._ref = doc.ref;
        await enviar("hito", u, {
          to: u.email,
          subject: `${artista} es #1 esta semana`,
          preheader: "Lo lograste con tu voto.",
          titulo: `${artista} llegó al #1`,
          cuerpoHtml: `Lo lograste con tu voto: <b>${artista}</b> llegó al #1 del ranking. Gracias por empujar. ¿Lo mantenemos ahí?`,
          textoBoton: "Ver el ranking",
          linkBoton: linkArtista(top1),
        }, null);
      }
    }
    if (!dryRun && top1) tareas.push(hitoRef.set({ top1, updatedAt: FieldValue.serverTimestamp() }));
  }

  if (!dryRun) await Promise.allSettled(tareas);
  return { enviados, report, errores, miembros: usersSnap.size, votos: votesSnap.size };
}

// ── Función programada real (diaria 20:00 Ecuador) ─────────────────
exports.engagementDiario = onSchedule(
  { schedule: "0 20 * * *", timeZone: "America/Guayaquil", region: "us-east1", secrets: [BREVO_API_KEY], memory: "256MiB" },
  async () => {
    const day = new Date(Date.now() - 5 * 3600 * 1000).getUTCDay();
    const r = await procesarEngagement({ apiKey: BREVO_API_KEY.value(), day, dryRun: false });
    logger.info("engagementDiario", { day, ...r, report: undefined, detalle: r.report.slice(0, 20) });
  }
);

// ── Endpoint de diagnóstico (dry-run, no envía) ────────────────────
// GET /engagementDiag?key=TOKEN[&day=N][&send=1]
exports.engagementDiag = onRequest(
  { region: "us-east1", secrets: [BREVO_API_KEY] },
  async (req, res) => {
    if (req.query.key !== DIAG_TOKEN) { res.status(403).send("forbidden"); return; }
    const day = req.query.day != null ? Number(req.query.day)
      : new Date(Date.now() - 5 * 3600 * 1000).getUTCDay();
    const dryRun = req.query.send !== "1"; // por defecto NO envía
    const r = await procesarEngagement({ apiKey: BREVO_API_KEY.value(), day, dryRun });
    res.status(200).json({ dryRun, day, ...r });
  }
);
