// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Endpoint de PRUEBA (temporal)
// Envía UN correo de un tipo concreto a UNA dirección, para revisar
// cómo se ven. No toca datos ni respeta preferencias.
//   GET /pruebaCorreo?key=TOKEN&tipo=top7&to=correo@x.com
// ─────────────────────────────────────────────────────────────────
const { onRequest } = require("firebase-functions/v2/https");
const noti = require("./notificaciones");

const BREVO_API_KEY = noti.BREVO_API_KEY;
const SITE = noti.SITE;
const TOKEN = "tot-prueba-7c1e9a";

// Artista de ejemplo para que los links del correo de prueba funcionen.
const ARTISTA = "Johann Vera";
const LINK_ARTISTA = `${SITE}/johann-vera`;

const CORREOS = {
  top7: {
    subject: "El nuevo TOP 7 de la semana ya está aquí",
    preheader: "Descubre quién entró y vota por tu favorita.",
    titulo: "El nuevo TOP 7 ya está aquí",
    cuerpoHtml: "Actualizamos las 7 mejores canciones de la semana. Mira quién subió, quién se mantiene y vota por la que más suena para ti.",
    textoBoton: "Ver el TOP 7",
    linkBoton: `${SITE}/talento`,
  },
  resumen: {
    subject: "Tu semana en Top of Talent",
    preheader: "El #1 de la semana y el nuevo TOP 7, en un vistazo.",
    titulo: "Tu semana en Top of Talent",
    cuerpoHtml: `Esta semana el artista más votado es <b>${ARTISTA}</b>. Descubre el nuevo TOP 7, mira tu posición en los Top Fans y sigue votando para mantener a tus artistas arriba.`,
    textoBoton: "Ver la plataforma",
    linkBoton: `${SITE}/talento`,
  },
  invitar: {
    subject: "Tu voto todavía no suena",
    preheader: "Elige a tu primer artista y súbelo en el ranking.",
    titulo: "Da tu primer voto",
    cuerpoHtml: "Aún no has votado. Aquí tu voz mueve la escena: elige a un artista que te guste y dale tu primer voto. Es el primer paso para aparecer en su Top Fans.",
    textoBoton: "Dar mi primer voto",
    linkBoton: `${SITE}/talento`,
  },
  topfans: {
    subject: `Alguien te pasó en el Top Fans de ${ARTISTA}`,
    preheader: "Un par de votos y recuperas tu lugar.",
    titulo: `Perdiste tu lugar con ${ARTISTA}`,
    cuerpoHtml: `Saliste del Top Fans de <b>${ARTISTA}</b>. ¿Lo vas a dejar así? Con un par de votos vuelves a subir.`,
    textoBoton: "Recuperar mi lugar",
    linkBoton: LINK_ARTISTA,
  },
  inactividad: {
    subject: "Tu artista te extraña",
    preheader: "Deja un comentario y vuelve a la escena.",
    titulo: "Hace rato no te vemos",
    cuerpoHtml: `Hace unos días que no pasas. <b>${ARTISTA}</b> sigue en la pelea y tu apoyo cuenta. Vuelve, deja un comentario y dale tu voto de hoy.`,
    textoBoton: "Volver a la plataforma",
    linkBoton: LINK_ARTISTA,
  },
  hito: {
    subject: `${ARTISTA} es #1 esta semana`,
    preheader: "Lo lograste con tu voto.",
    titulo: `${ARTISTA} llegó al #1`,
    cuerpoHtml: `Lo lograste con tu voto: <b>${ARTISTA}</b> llegó al #1 del ranking. Gracias por empujar. ¿Lo mantenemos ahí?`,
    textoBoton: "Ver el ranking",
    linkBoton: LINK_ARTISTA,
  },
};

exports.pruebaCorreo = onRequest(
  { region: "us-east1", secrets: [BREVO_API_KEY] },
  async (req, res) => {
    if (req.query.key !== TOKEN) { res.status(403).send("forbidden"); return; }
    const tipo = req.query.tipo;
    const to = req.query.to;
    const base = CORREOS[tipo];
    if (!base || !to) {
      res.status(400).json({ error: "tipo o to inválido", tipos: Object.keys(CORREOS) });
      return;
    }
    try {
      await noti._helpers.sendEmail(Object.assign({ to }, base), BREVO_API_KEY.value());
      res.status(200).json({ ok: true, tipo, to });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
);
