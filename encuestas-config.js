// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Configuración de encuestas del prelanzamiento
// Las claves llevan un token que solo nosotros conocemos: la encuesta
// NO se enlaza desde ningún lado y solo es accesible con la URL exacta.
//   /encuesta?s=mes1-a7f3k9   ·   /encuesta?s=final-c2m8p5
// ─────────────────────────────────────────────────────────────────
window.TOT_ENCUESTAS = {

  "mes1-a7f3k9": {
    tag: "Encuesta 1 · Checkpoint",
    titulo: "¿Cómo va tu primer mes?",
    sub: "Rápida · 2 minutos",
    intro: "Fuiste seleccionado. Eres parte de un grupo pequeño de fans que estamos analizando de cerca para construir Top of Talent antes del lanzamiento oficial. Tu experiencia de este primer mes vale muchísimo: nos dice qué está funcionando y qué mejorar. Son solo un par de minutos y tus respuestas cambian directamente la plataforma. Gracias por ser parte de esto.",
    secciones: [
      { titulo: "Tu experiencia", preguntas: [
        { id: "q1", txt: "¿Cómo describirías tu primer mes en Top of Talent?", tipo: "radio", ops: ["Excelente", "Bueno", "Normal", "Regular", "Malo"] },
        { id: "q2", txt: "¿Qué es lo que más usaste o disfrutaste?", tipo: "radio", ops: ["Votar", "Rankings / TOP 7", "Comentar", "Eventos", "Otros Talentos", "Explorar artistas"] },
        { id: "q3", txt: "¿Cómo te sentiste votando por tus artistas?", tipo: "radio", ops: ["Me encantó, sentí que aportaba", "Bien", "Neutral", "No le vi mucho sentido"] },
      ]},
      { titulo: "Las herramientas", preguntas: [
        { id: "q4", txt: "¿Usaste la sección de comentarios de fans (en los perfiles de los artistas)?", tipo: "radio", ops: ["Sí y me gustó", "Sí, pero mejorable", "No la usé", "No sabía que existía"] },
        { id: "q5", txt: "¿La sección de eventos te sirvió?", tipo: "radio", ops: ["Sí, me enteré de algo", "La vi, pero aún no me sirvió", "No la revisé"] },
        { id: "q6", txt: "¿Descubriste talentos nuevos en \"Otros Talentos\"?", tipo: "radio", ops: ["Sí, varios", "Sí, alguno", "No", "No entré a esa sección"] },
        { id: "q7", txt: "Con el TOP 7, ¿descubriste música nueva que te gustó?", tipo: "radio", ops: ["Sí, varias", "Sí, alguna", "No mucho", "No lo revisé"] },
      ]},
      { titulo: "Qué tan fácil fue usarlo", preguntas: [
        { id: "q8", txt: "¿Qué tan fácil e intuitivo te resultó el sitio?", tipo: "radio", ops: ["Muy fácil", "Fácil", "Normal", "Algo confuso", "Difícil"] },
        { id: "q9", txt: "¿Hubo algo que te costó encontrar o entender?", tipo: "radio", ops: ["No, todo claro", "Un poco al inicio", "Sí, algunas cosas", "Sí, bastante"] },
        { id: "q10", txt: "¿Sientes que le falta algo a la plataforma?", tipo: "radio", ops: ["No, está completa", "Tal vez", "Sí, le falta"], seguimiento: { txt: "Si marcaste \"Sí, le falta\", cuéntanos qué:", si: "Sí, le falta" } },
      ]},
      { titulo: "Para cerrar", preguntas: [
        { id: "q11", txt: "Si algo te costó o sientes que falta, cuéntanos qué.", tipo: "texto", opcional: true },
        { id: "q12", txt: "¿Algo más que quieras decirnos?", tipo: "texto", opcional: true },
      ]},
    ],
  },

  "final-c2m8p5": {
    tag: "Encuesta 2 · Satisfacción",
    titulo: "Cuéntanos cómo te fue",
    sub: "Cierre del prelanzamiento · 2 minutos",
    intro: "Llegamos al final del prelanzamiento. Fuiste parte de un grupo pequeño y seleccionado que vivió Top of Talent antes que nadie, y tu voz define la versión oficial. Esta última encuesta es la más importante: nos dice cómo te sentiste de verdad y si vamos por buen camino. Son solo un par de minutos. Gracias por acompañarnos hasta aquí.",
    secciones: [
      { titulo: "Cómo te sentiste", preguntas: [
        { id: "q1", txt: "En general, ¿cómo te sentiste con Top of Talent estos 2 meses?", tipo: "radio", ops: ["Me encantó", "Me gustó", "Neutral", "No me convenció"] },
        { id: "q2", txt: "¿Qué fue lo que MÁS te gustó?", tipo: "radio", ops: ["Votar y el ranking", "Descubrir música (TOP 7)", "La comunidad (comentarios de fans y ranking de fans de cada artista)", "Los eventos", "Otros Talentos", "El diseño"] },
        { id: "q3", txt: "¿Sentiste que tu voto impactaba a los artistas?", tipo: "radio", ops: ["Sí, totalmente", "Algo", "Poco", "Nada"] },
        { id: "q4", txt: "¿Volviste a la plataforma por tu cuenta o solo por los correos?", tipo: "radio", ops: ["Seguido, por mi cuenta", "A veces por mi cuenta", "Solo cuando llegaban correos", "Casi no volví"] },
      ]},
      { titulo: "Comunidad y recomendación", preguntas: [
        { id: "q5", txt: "¿Recomendarías Top of Talent a un amigo?", tipo: "radio", ops: ["Sí, seguro", "Probablemente", "Tal vez", "No"] },
        { id: "q6", txt: "¿Qué tan conectado te sentiste con la comunidad y los artistas?", tipo: "radio", ops: ["Muy conectado", "Algo", "Poco", "Nada"] },
      ]},
      { titulo: "El precio y el futuro", preguntas: [
        { id: "q7", txt: "La membresía costaría $2,99 al mes para sostener el proyecto. ¿Qué te parece el precio?", tipo: "radio", ops: ["Muy justo", "Razonable", "Un poco alto", "Demasiado"] },
        { id: "q8", txt: "¿Pagarías esa membresía para seguir?", tipo: "radio", ops: ["Sí", "Tal vez", "No"] },
        { id: "q9", txt: "¿Qué te haría pagarla sin dudarlo?", tipo: "radio", ops: ["Más artistas", "Más beneficios (descuentos, sorteos)", "Eventos exclusivos", "Ya la pagaría así", "Otro"] },
      ]},
      { titulo: "Para cerrar", preguntas: [
        { id: "q10", txt: "Si pudieras cambiar UNA sola cosa de Top of Talent, ¿cuál sería?", tipo: "texto" },
        { id: "q11", txt: "Opinión general: cuéntanos lo que quieras, con toda confianza.", tipo: "texto", opcional: true },
      ]},
    ],
  },

};
