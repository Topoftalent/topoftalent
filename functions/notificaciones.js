// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Motor de notificaciones por email (Brevo)
//
// Fase de prueba (prelanzamiento). Este módulo cubre lo que ya se
// puede disparar con los datos existentes:
//   1. Registro   -> sincroniza contacto en Brevo + Bienvenida (#1)
//   2. Se hace miembro -> Bienvenida de miembro (#2)
//
// Los correos de engagement (voto 8h, top fans, inactividad) se
// agregan después: necesitan timestamps reales que aún no existen
// en el esquema (ver nota sobre createdAt).
//
// La API key de Brevo NO va en el código: se guarda como SECRET.
//   firebase functions:secrets:set BREVO_API_KEY
// ─────────────────────────────────────────────────────────────────
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const BREVO_API_KEY = defineSecret("BREVO_API_KEY");

// ── CONFIGURACIÓN (ajusta estos valores) ─────────────────────────
const SENDER = { name: "Top of Talent", email: "notificacion@topoftalentoficial.com" };
const TRIAL_CODE = "TOT2MESES";        // código de descuento 100% del prelanzamiento
const BREVO_LIST_ID = 3;               // Lista "Prelanzamiento" de Brevo (para broadcasts)
const SITE = "https://topoftalentoficial.com";
// ─────────────────────────────────────────────────────────────────

const db = getFirestore();

// Llama a la API de Brevo. path ej. "/v3/smtp/email".
async function brevo(path, method, body, apiKey) {
  const res = await fetch("https://api.brevo.com" + path, {
    method,
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Brevo ${path} ${res.status}: ${txt}`);
  }
  return res.status === 204 ? {} : res.json();
}

// Sincroniza (crea o actualiza) el contacto en Brevo.
async function upsertContact(data, apiKey) {
  const body = {
    email: data.email,
    updateEnabled: true,
    attributes: {
      NOMBRE: data.nombre || data.username || "",
      FANNUM: data.fanNum || "",
      COUNTRY: data.country || "",
    },
  };
  if (BREVO_LIST_ID) body.listIds = [BREVO_LIST_ID];
  await brevo("/v3/contacts", "POST", body, apiKey);
}

// Envía un correo transaccional con la plantilla oscura de marca.
async function sendEmail({ to, subject, preheader, titulo, cuerpoHtml, textoBoton, linkBoton }, apiKey) {
  await brevo("/v3/smtp/email", "POST", {
    sender: SENDER,
    to: [{ email: to }],
    subject,
    htmlContent: plantilla({ preheader, titulo, cuerpoHtml, textoBoton, linkBoton }),
  }, apiKey);
}

// Plantilla oscura oficial (misma que plantillas-email/plantilla-oscura.html).
function plantilla({ preheader, titulo, cuerpoHtml, textoBoton, linkBoton }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<style>:root{color-scheme:dark;supported-color-schemes:dark;}</style></head>
<body style="margin:0;padding:0;background:#08080c;font-family:Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#08080c;font-size:1px;line-height:1px;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08080c;"><tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#0e0d14;border-radius:18px;overflow:hidden;border:1px solid #1c1a26;">
<tr><td style="padding:30px 36px 6px;"><img src="${SITE}/email-logo-white.png" width="210" height="86" alt="Top of Talent" style="display:block;width:210px;height:86px;border:0;outline:none;text-decoration:none;"></td></tr>
<tr><td style="padding:18px 36px 0;"><div style="height:3px;width:60px;background:#c86cff;border-radius:3px;line-height:3px;font-size:0;">&nbsp;</div></td></tr>
<tr><td style="padding:18px 36px 0;"><h1 style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:26px;line-height:1.2;color:#ffffff;font-weight:bold;letter-spacing:-0.5px;">${titulo}</h1></td></tr>
<tr><td style="padding:16px 36px 0;"><p style="margin:0;font-size:15px;line-height:1.7;color:#b7b3c4;">${cuerpoHtml}</p></td></tr>
<tr><td style="padding:28px 36px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#c86cff;border-radius:10px;"><a href="${linkBoton}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#0e0d14;text-decoration:none;">${textoBoton}</a></td></tr></table></td></tr>
<tr><td style="padding:32px 36px 0;"><div style="height:1px;background:#1c1a26;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
<tr><td style="padding:18px 36px 30px;"><p style="margin:0 0 12px;font-size:11px;line-height:1.7;color:#4d4959;"><a href="${SITE}" style="color:#c86cff;text-decoration:none;">topoftalentoficial.com</a> &nbsp;·&nbsp; <a href="${SITE}/talento" style="color:#8a8598;text-decoration:none;">Ver artistas</a></p><p style="margin:0;font-size:10px;color:#3a3644;letter-spacing:0.5px;">Top of Talent &nbsp;·&nbsp; &copy; 2026</p></td></tr>
</table></td></tr></table></body></html>`;
}

// ── #1 · Registro: sincroniza contacto + envía bienvenida ────────
exports.onUserCreated = onDocumentCreated(
  { document: "users/{uid}", secrets: [BREVO_API_KEY] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data() || {};
    if (!data.email) { logger.warn("Usuario sin email, se omite", { uid: event.params.uid }); return; }
    if (data.welcomeEmailSent) return; // idempotencia

    const apiKey = BREVO_API_KEY.value();
    const nombre = data.nombre || data.username || "";

    try {
      await upsertContact(data, apiKey);
      await sendEmail({
        to: data.email,
        subject: "Bienvenido a Top of Talent. Tienes un regalo",
        preheader: "2 meses gratis para vivir la plataforma completa.",
        titulo: "Algo grande empieza contigo",
        cuerpoHtml: `${nombre ? "Hola " + nombre + ", b" : "B"}ienvenido a Top of Talent, la casa del talento musical emergente del Ecuador. Para que la disfrutes sin límites, te regalamos <b>2 meses de membresía gratis</b>. Actívalos con este código al hacerte miembro:<br><br><span style="display:inline-block;background:#1c1a26;color:#c86cff;font-weight:bold;letter-spacing:2px;padding:10px 18px;border-radius:8px;">${TRIAL_CODE}</span><br><br>Con la membresía tu voto pesa, apareces en los rankings y accedes a todo.`,
        textoBoton: "Activar mi membresía",
        linkBoton: `${SITE}/perfil`,
      }, apiKey);
      await snap.ref.update({ welcomeEmailSent: true });
      logger.info("Bienvenida enviada", { email: data.email });
    } catch (e) {
      logger.error("Fallo en onUserCreated", { error: e.message, email: data.email });
      throw e; // permite reintento
    }
  }
);

// ── Activar membresía con código (callable desde el sitio) ───────
// El cliente NO puede poner isMember por reglas de Firestore. Esta
// función valida el código de prueba y activa la membresía con
// permisos de servidor. Al poner isMember:true dispara #2.
exports.activarMembresia = onCall({ region: "us-east1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para activar tu membresía.");
  }
  const uid = request.auth.uid;
  const codigo = String((request.data && request.data.codigo) || "").trim().toUpperCase();

  if (codigo !== TRIAL_CODE.toUpperCase()) {
    throw new HttpsError("invalid-argument", "El código no es válido. Revisa el correo de bienvenida.");
  }

  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "No encontramos tu cuenta.");
  }
  if (snap.data().isMember === true) {
    return { already: true };
  }

  const trialUntil = new Date();
  trialUntil.setMonth(trialUntil.getMonth() + 2); // 2 meses gratis

  await ref.update({
    isMember: true,
    membershipType: "prelanzamiento",
    memberSince: FieldValue.serverTimestamp(),
    trialUntil: trialUntil,
  });

  logger.info("Membresía de prueba activada", { uid });
  return { ok: true };
});

// ── #2 · Se hace miembro: bienvenida de miembro ──────────────────
exports.onMemberActivated = onDocumentUpdated(
  { document: "users/{uid}", secrets: [BREVO_API_KEY] },
  async (event) => {
    const before = event.data.before.data() || {};
    const after = event.data.after.data() || {};
    const seHizoMiembro = before.isMember !== true && after.isMember === true;
    if (!seHizoMiembro) return;
    if (after.memberWelcomeSent) return; // idempotencia
    if (!after.email) return;

    const apiKey = BREVO_API_KEY.value();
    const nombre = after.nombre || after.username || "";

    try {
      await sendEmail({
        to: after.email,
        subject: "Ya eres Miembro. Esto es lo que desbloqueas",
        preheader: "Tu voto ahora mueve la escena.",
        titulo: "Bienvenido al club",
        cuerpoHtml: `${nombre ? nombre + ", y" : "Y"}a eres parte del club. Durante estos 2 meses tienes todo desbloqueado: tu voto cuenta en el ranking de artistas, apareces en el Top Fans de los artistas que apoyas, comentas, sigues el TOP 7 y accedes a beneficios de eventos. Gracias por ayudarnos a construir esto. Tu actividad de estas semanas define hacia dónde crece la plataforma.`,
        textoBoton: "Empezar a votar",
        linkBoton: `${SITE}/talento`,
      }, apiKey);
      await event.data.after.ref.update({ memberWelcomeSent: true });
      logger.info("Bienvenida de miembro enviada", { email: after.email });
    } catch (e) {
      logger.error("Fallo en onMemberActivated", { error: e.message, email: after.email });
      throw e;
    }
  }
);
