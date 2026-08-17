// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Notificación de autorización firmada
// Cuando un talento firma en /autorizacion, se crea un doc en
// "autorizaciones"; esta función avisa al correo principal.
// ─────────────────────────────────────────────────────────────────
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const noti = require("./notificaciones");

const BREVO_API_KEY = noti.BREVO_API_KEY;
const AVISAR_A = "contactoftalent@gmail.com";

exports.onAutorizacion = onDocumentCreated(
  { document: "autorizaciones/{id}", secrets: [BREVO_API_KEY] },
  async (event) => {
    const snap = event.data; if (!snap) return;
    const d = snap.data() || {};
    const tipo = d.tipo === "top" ? "Artista del Top" : "Otro Talento";
    const cuando = new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" });
    try {
      await noti._helpers.sendEmail({
        to: AVISAR_A,
        subject: `Nueva autorización firmada: ${d.nombre}`,
        preheader: `${d.nombre} firmó su autorización de uso.`,
        titulo: "Autorización firmada",
        cuerpoHtml: `<b>${d.nombre}</b> (${tipo}) acaba de firmar su autorización de uso en Top of Talent.<br><br>` +
          `Firma: ${d.firma || d.nombre}<br>ID: ${d.artistaId}<br>Fecha: ${cuando}`,
        textoBoton: "Ver su ficha",
        linkBoton: d.tipo === "top"
          ? `${noti.SITE}/talento`
          : `${noti.SITE}/ot-perfil.html?id=${d.artistaId}`,
      }, BREVO_API_KEY.value());
      logger.info("Aviso de autorización enviado", { nombre: d.nombre, id: d.artistaId });
    } catch (e) {
      logger.error("Fallo aviso autorización", { error: e.message });
    }
  }
);
