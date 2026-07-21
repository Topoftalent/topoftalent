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
const { getFirestore } = require("firebase-admin/firestore");
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

// ── Resumen semanal combinado (TOP 7 + #1) · sábado 11:00 Ecuador ──
// UN solo correo por semana: anuncia el nuevo TOP 7 y el artista #1.
exports.resumenSemanal = onSchedule(
  { schedule: "0 11 * * 6", timeZone: "America/Guayaquil", region: "us-east1", secrets: [BREVO_API_KEY], memory: "256MiB" },
  async () => {
    const uno = await artistaNumeroUno();
    const lineaUno = uno
      ? `Esta semana el artista más votado es <b>${uno.nombre}</b>. `
      : "";
    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey: "semanal",
      buildCorreo: (u) => ({
        to: u.email,
        subject: "Tu semana en Top of Talent",
        preheader: "El nuevo TOP 7 y el #1 de la semana, en un vistazo.",
        titulo: "Tu semana en Top of Talent",
        cuerpoHtml: `Ya está el nuevo TOP 7 de la semana. ${lineaUno}Escucha las 7 mejores, mira tu posición en los Top Fans y vota por tus favoritas para mantener a tus artistas arriba.`,
        textoBoton: "Ver el TOP 7",
        linkBoton: `${SITE}/talento`,
      }),
    });
    logger.info("resumenSemanal", { ...r, uno: uno && uno.id });
  }
);

// ── Nuevo(s) artista(s) · endpoint admin, envío AGRUPADO por tanda ──
// Sube los artistas a Firestore (colección artistas) y luego llama a
// este endpoint UNA vez: junta todos los que aún no se notificaron y
// manda UN solo correo (1 artista = correo simple; varios = agrupado).
//   GET /notificarNuevosArtistas?key=TOKEN[&send=1]
exports.notificarNuevosArtistas = onRequest(
  { region: "us-east1", secrets: [BREVO_API_KEY] },
  async (req, res) => {
    if (req.query.key !== ADMIN_TOKEN) { res.status(403).send("forbidden"); return; }
    const dryRun = req.query.send !== "1";

    const snap = await db.collection("artistas").get();
    const nuevos = [];
    snap.forEach((d) => {
      const data = d.data() || {};
      if (data.notificado === true) return;
      nuevos.push({
        id: d.id,
        nombre: data.name || data.nombre || NOMBRES[d.id] || d.id,
        slug: data.slug || SLUGS[d.id] || "talento",
        ref: d.ref,
      });
    });

    if (nuevos.length === 0) { res.status(200).json({ ok: true, nuevos: 0, msg: "No hay artistas nuevos por notificar." }); return; }

    // baseline=1: marca los actuales como ya notificados SIN enviar correo
    // (para no incluir artistas viejos en el primer envío real).
    if (req.query.baseline === "1") {
      await Promise.allSettled(nuevos.map((a) => a.ref.set({ notificado: true }, { merge: true })));
      res.status(200).json({ baseline: true, marcados: nuevos.map((a) => a.nombre) });
      return;
    }

    let correoBase;
    if (nuevos.length === 1) {
      const a = nuevos[0];
      correoBase = {
        subject: `Nuevo talento en Top of Talent: ${a.nombre}`,
        preheader: "Conócelo y dale tu voto.",
        titulo: `Nuevo talento: ${a.nombre}`,
        cuerpoHtml: `<b>${a.nombre}</b> acaba de entrar a la plataforma. Escúchalo, conoce su historia y, si te gusta, súmate a los que lo están impulsando al TOP.`,
        textoBoton: `Conocer a ${a.nombre}`,
        linkBoton: `${SITE}/${a.slug}`,
      };
    } else {
      const lista = nuevos.map((a) => a.nombre).join(", ");
      correoBase = {
        subject: "Nuevos talentos en Top of Talent",
        preheader: "Se sumaron nuevos artistas. Conócelos y vota.",
        titulo: "Llegaron nuevos talentos",
        cuerpoHtml: `Se sumaron <b>${nuevos.length}</b> artistas a la plataforma: ${lista}. Conócelos, escúchalos y vota por los que te gusten para impulsarlos al TOP.`,
        textoBoton: "Ver los artistas",
        linkBoton: `${SITE}/talento`,
      };
    }

    const r = await enviarAMiembros({
      apiKey: BREVO_API_KEY.value(),
      prefKey: "novedades",
      buildCorreo: (u) => Object.assign({ to: u.email }, correoBase),
      dryRun,
    });

    if (!dryRun) {
      await Promise.allSettled(nuevos.map((a) => a.ref.set({ notificado: true }, { merge: true })));
    }
    res.status(200).json({ dryRun, nuevos: nuevos.map((a) => a.nombre), ...r });
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
