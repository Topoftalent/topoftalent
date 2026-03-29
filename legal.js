// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT — Legal Modal + Cookie Consent  v1.0
// Handles: Términos, Privacidad, Cookies, Aviso Legal
// Cookie consent stored in localStorage as 'tot_cookies'
// ─────────────────────────────────────────────────────────────────
(function(){
'use strict';

// ── LEGAL CONTENT ─────────────────────────────────────────────────
var LEGAL = {
  terminos: {
    title: 'Términos y Condiciones',
    date: 'Última actualización: marzo 2026',
    sections: [
      {h:'1. Aceptación de los Términos', p:'Al acceder y usar la plataforma Top of Talent (<strong>topoftalentoficial.com</strong>), el usuario acepta de forma expresa y sin reservas los presentes Términos y Condiciones. Si no está de acuerdo con alguno de ellos, debe abstenerse de usar la plataforma.'},
      {h:'2. Descripción del Servicio', p:'Top of Talent es una plataforma editorial digital dedicada al descubrimiento, visibilidad y promoción de talentos emergentes del Ecuador, con énfasis en la música y la cultura. El sitio ofrece contenido editorial, rankings, perfiles de artistas, información de eventos y otras secciones de interés cultural. La plataforma es operada por sus fundadores con domicilio en <strong>Milán, Italia</strong> y <strong>Praga, República Checa</strong>, y está dirigida principalmente al público <strong>ecuatoriano</strong>.'},
      {h:'3. Uso de la Plataforma', p:'El usuario se compromete a utilizar la plataforma de forma lícita, responsable y de buena fe. Queda prohibido: (a) reproducir o redistribuir contenido sin autorización; (b) usar la plataforma para actividades ilegales o que infrinjan derechos de terceros; (c) intentar acceder de forma no autorizada a sistemas o datos de la plataforma; (d) realizar actos que puedan dañar la reputación o funcionamiento de Top of Talent.'},
      {h:'4. Cuentas de Usuario', p:'Los usuarios pueden crear una cuenta para acceder a funciones adicionales. El usuario es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada desde su cuenta. Top of Talent se reserva el derecho de suspender o eliminar cuentas que violen estos términos.'},
      {h:'5. Propiedad Intelectual', p:'Todo el contenido editorial, diseño, código, marcas y demás elementos de la plataforma son propiedad de Top of Talent o de sus respectivos titulares, y están protegidos por la legislación aplicable sobre propiedad intelectual. Los rankings y evaluaciones son elaborados de forma independiente por el equipo editorial.'},
      {h:'6. Contenido de Terceros', p:'La plataforma puede incluir contenido embebido de servicios externos como YouTube y Spotify. Top of Talent no es responsable del contenido, términos o privacidad de dichos servicios. El uso de contenido de artistas se realiza con fines editoriales y de promoción; los derechos de imagen y obra pertenecen a sus respectivos titulares.'},
      {h:'7. Limitación de Responsabilidad', p:'Top of Talent no garantiza la disponibilidad continua de la plataforma ni la exactitud absoluta de la información editorial. En ningún caso será responsable por daños directos, indirectos o consecuentes derivados del uso o imposibilidad de uso de la plataforma.'},
      {h:'8. Modificaciones', p:'Top of Talent se reserva el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigor desde su publicación. El uso continuado de la plataforma implica la aceptación de los términos actualizados.'},
      {h:'9. Ley Aplicable y Jurisdicción', p:'Los presentes términos se rigen por la legislación ecuatoriana aplicable, complementada por la normativa de la Unión Europea en lo que corresponda a los operadores establecidos en Italia y República Checa. Cualquier controversia se someterá a los tribunales competentes.'},
      {h:'10. Contacto', p:'Para consultas legales: <a href="mailto:contactoftalent@gmail.com" style="color:#c86cff">contactoftalent@gmail.com</a>'}
    ]
  },
  privacidad: {
    title: 'Política de Privacidad',
    date: 'Última actualización: marzo 2026',
    sections: [
      {h:'1. Responsable del Tratamiento', p:'Top of Talent, operado desde <strong>Milán, Italia</strong> y <strong>Praga, República Checa</strong>, actúa como responsable del tratamiento de los datos personales recopilados a través de <strong>topoftalentoficial.com</strong>. Contacto: <a href="mailto:contactoftalent@gmail.com" style="color:#c86cff">contactoftalent@gmail.com</a>'},
      {h:'2. Datos que Recopilamos', p:'Podemos recopilar los siguientes datos: <br>• Nombre y dirección de correo electrónico (al registrarse)<br>• Nombre de usuario y contraseña (al crear cuenta)<br>• País o región de residencia<br>• Datos de inicio de sesión social (Google, Apple, Facebook, X) cuando el usuario elige esta opción<br>• Datos de uso y navegación (páginas visitadas, tiempo de sesión)<br>• Información técnica del dispositivo y del navegador'},
      {h:'3. Finalidades del Tratamiento', p:'Los datos recopilados se utilizan para: (a) gestionar el acceso y la cuenta del usuario; (b) enviar notificaciones según las preferencias del usuario; (c) mejorar y personalizar la experiencia en la plataforma; (d) cumplir obligaciones legales; (e) análisis estadístico agregado (sin identificación individual).'},
      {h:'4. Base Legal (RGPD)', p:'El tratamiento se basa en: (a) consentimiento del usuario al registrarse; (b) interés legítimo en el funcionamiento de la plataforma; (c) cumplimiento de obligaciones legales aplicables. Los usuarios de la Unión Europea están protegidos bajo el <strong>Reglamento General de Protección de Datos (RGPD / GDPR)</strong>.'},
      {h:'5. Derechos del Usuario', p:'El usuario tiene derecho a: acceder a sus datos, rectificarlos, suprimirlos ("derecho al olvido"), limitar u oponerse al tratamiento, y portabilidad de datos. Para ejercer estos derechos, contactar a: <a href="mailto:contactoftalent@gmail.com" style="color:#c86cff">contactoftalent@gmail.com</a>'},
      {h:'6. Servicios de Terceros', p:'Utilizamos <strong>Firebase (Google LLC)</strong> para autenticación y almacenamiento. Podemos utilizar Google Analytics para estadísticas de uso. Estos servicios tienen sus propias políticas de privacidad. Los datos pueden transferirse a servidores fuera del Ecuador y de la UE, siempre bajo garantías adecuadas conforme al RGPD.'},
      {h:'7. Retención de Datos', p:'Los datos se conservan mientras la cuenta esté activa. Al eliminar la cuenta, los datos se suprimen en un plazo razonable, salvo obligación legal de conservación.'},
      {h:'8. Seguridad', p:'Implementamos medidas técnicas y organizativas adecuadas para proteger los datos personales contra acceso no autorizado, alteración, divulgación o destrucción.'},
      {h:'9. Menores de Edad', p:'La plataforma no está dirigida a menores de 13 años. No recopilamos intencionadamente datos de menores. Si detectamos tal recopilación, procederemos a su eliminación.'},
      {h:'10. Cambios en la Política', p:'Nos reservamos el derecho de actualizar esta política. Los cambios significativos se notificarán a los usuarios registrados. La versión vigente siempre estará disponible en la plataforma.'}
    ]
  },
  cookies: {
    title: 'Política de Cookies',
    date: 'Última actualización: marzo 2026',
    sections: [
      {h:'1. ¿Qué son las Cookies?', p:'Las cookies son pequeños archivos de texto que un sitio web almacena en el dispositivo del usuario cuando este lo visita. Permiten que la plataforma recuerde información sobre la visita para mejorar la experiencia.'},
      {h:'2. Cookies que Utilizamos', p:'<strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico de la plataforma (gestión de sesión, autenticación). No pueden desactivarse sin afectar el funcionamiento del sitio.<br><br><strong>Cookies de análisis:</strong> Nos ayudan a entender cómo los usuarios interactúan con la plataforma (páginas visitadas, tiempo en el sitio). Se usan de forma agregada y anónima.<br><br><strong>Cookies de preferencias:</strong> Guardan preferencias del usuario (idioma, configuración de notificaciones, consentimiento de cookies).'},
      {h:'3. Cookies de Terceros', p:'Podemos utilizar servicios de terceros que establecen sus propias cookies:<br>• <strong>Firebase (Google):</strong> Autenticación y sesión<br>• <strong>Google Analytics:</strong> Estadísticas de uso (si está habilitado)<br>• <strong>YouTube / Spotify:</strong> Contenido embebido en la plataforma<br><br>Estos servicios tienen sus propias políticas de cookies, que recomendamos revisar.'},
      {h:'4. Consentimiento', p:'Al acceder a topoftalentoficial.com por primera vez, se mostrará un banner de consentimiento de cookies. El usuario puede aceptar todas las cookies, rechazar las no esenciales, o gestionar sus preferencias. El consentimiento puede retirarse en cualquier momento desde la sección de configuración del navegador.'},
      {h:'5. Cómo Gestionar las Cookies', p:'El usuario puede controlar y/o eliminar las cookies desde la configuración de su navegador:<br>• <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies<br>• <strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies<br>• <strong>Safari:</strong> Preferencias → Privacidad → Cookies<br>• <strong>Edge:</strong> Configuración → Privacidad y seguridad → Cookies<br><br>Desactivar cookies esenciales puede afectar el funcionamiento del sitio.'},
      {h:'6. Sobre el Almacenamiento Local', p:'Además de cookies, utilizamos <strong>localStorage</strong> del navegador para guardar datos de sesión y preferencias del usuario. Esta información permanece en el dispositivo del usuario y no se transmite a servidores externos hasta que se integre Firebase.'},
      {h:'7. Contacto', p:'Para preguntas sobre nuestra política de cookies: <a href="mailto:contactoftalent@gmail.com" style="color:#c86cff">contactoftalent@gmail.com</a>'}
    ]
  },
  aviso: {
    title: 'Aviso Legal y Disclaimer',
    date: 'Última actualización: marzo 2026',
    sections: [
      {h:'1. Titular de la Plataforma', p:'Top of Talent es una plataforma editorial digital operada de forma independiente, con base de operaciones en <strong>Milán, Italia</strong> y <strong>Praga, República Checa</strong>, dirigida al público ecuatoriano y latinoamericano. Contacto: <a href="mailto:contactoftalent@gmail.com" style="color:#c86cff">contactoftalent@gmail.com</a>'},
      {h:'2. Naturaleza Editorial', p:'Top of Talent es una publicación editorial independiente de música y cultura. Los rankings, puntuaciones, selecciones de artistas y cualquier otro contenido evaluativo son expresión de la <strong>opinión editorial</strong> del equipo de Top of Talent. No tienen carácter oficial ni vinculante, y no representan un reconocimiento formal de ningún tipo.'},
      {h:'3. Derechos de Imagen y Contenido de Artistas', p:'Top of Talent promueve a artistas con fines editoriales y de visibilidad cultural. Las imágenes, fotografías y contenido multimedia utilizados en la plataforma han sido obtenidos de fuentes públicas (redes sociales de los artistas) o aportados directamente por los mismos. Los derechos de imagen y de las obras pertenecen a sus respectivos titulares. Si un artista desea que su contenido sea modificado o retirado, puede contactarnos en cualquier momento.'},
      {h:'4. Contenido de Terceros', p:'La plataforma puede incluir enlaces o contenido embebido de servicios como YouTube, Spotify e Instagram. Top of Talent no es responsable de la disponibilidad, exactitud o contenido de dichos servicios externos. El acceso a los mismos está sujeto a sus propias condiciones de uso.'},
      {h:'5. Exactitud de la Información', p:'Top of Talent se esfuerza por mantener la información actualizada y precisa, pero <strong>no garantiza la exactitud, completitud ni vigencia</strong> de los contenidos publicados. Los datos de artistas (estadísticas, fechas, etc.) pueden no reflejar la situación actual en todo momento.'},
      {h:'6. Exención de Responsabilidad', p:'Top of Talent no asume responsabilidad alguna por:<br>• Daños derivados del uso o imposibilidad de uso de la plataforma<br>• Decisiones tomadas con base en el contenido de la plataforma<br>• Fallos técnicos, interrupciones del servicio o pérdida de datos<br>• Contenido publicado por usuarios registrados'},
      {h:'7. Propiedad Intelectual', p:'El nombre "Top of Talent", el logotipo, el diseño y todo el contenido editorial son propiedad de sus creadores. Queda prohibida su reproducción total o parcial sin autorización expresa y escrita.'},
      {h:'8. Legislación Aplicable', p:'Este aviso legal se rige por la legislación ecuatoriana vigente en lo relativo a servicios de la sociedad de la información, complementada por la normativa europea aplicable a los operadores. La resolución de controversias se realizará ante los tribunales competentes.'}
    ]
  }
};

// ── CSS ────────────────────────────────────────────────────────────
var css = `
/* LEGAL MODAL */
#tot-legal-backdrop{
  position:fixed;inset:0;z-index:2000;
  background:rgba(0,0,0,.82);backdrop-filter:blur(10px);
  display:flex;align-items:center;justify-content:center;
  opacity:0;transition:opacity .3s;pointer-events:none;
  padding:20px;
}
#tot-legal-backdrop.open{opacity:1;pointer-events:all}
#tot-legal-modal{
  background:#0d0d0d;
  border:1px solid rgba(200,108,255,.2);
  width:100%;max-width:820px;
  max-height:85vh;
  display:flex;flex-direction:column;
  transform:translateY(24px) scale(.97);
  transition:transform .35s cubic-bezier(.68,-.05,.27,1.05);
  position:relative;
}
#tot-legal-backdrop.open #tot-legal-modal{transform:translateY(0) scale(1)}
.tlm-header{
  padding:28px 32px 20px;
  border-bottom:1px solid rgba(255,255,255,.08);
  display:flex;align-items:flex-start;justify-content:space-between;
  flex-shrink:0;
}
.tlm-eyebrow{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.35em;color:#c86cff;text-transform:uppercase;margin-bottom:6px}
.tlm-title{font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:clamp(18px,3vw,26px);color:#fff;letter-spacing:-.01em}
.tlm-date{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.08em;margin-top:5px}
.tlm-close{background:none;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.5);font-size:16px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;margin-left:16px}
.tlm-close:hover{border-color:#c86cff;color:#c86cff;cursor:none}
.tlm-body{
  overflow-y:auto;
  padding:28px 32px 32px;
  flex:1;
  scrollbar-width:thin;scrollbar-color:#c86cff33 transparent;
}
.tlm-body::-webkit-scrollbar{width:4px}
.tlm-body::-webkit-scrollbar-thumb{background:rgba(200,108,255,.3)}
.tlm-section{margin-bottom:28px}
.tlm-section h3{
  font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;
  font-weight:700;font-size:13px;letter-spacing:.05em;
  color:#fff;text-transform:uppercase;
  margin-bottom:10px;
  padding-bottom:8px;
  border-bottom:1px solid rgba(200,108,255,.2);
}
.tlm-section p{
  font-family:'JetBrains Mono',monospace;
  font-size:12px;line-height:1.9;
  color:rgba(255,255,255,.65);
}
.tlm-section p a{color:#c86cff;text-decoration:none}
.tlm-footer{
  padding:16px 32px 20px;
  border-top:1px solid rgba(255,255,255,.06);
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;
}
.tlm-footer-tabs{display:flex;gap:6px;flex-wrap:wrap}
.tlm-tab-btn{
  font-family:'JetBrains Mono',monospace;font-size:9px;
  letter-spacing:.18em;text-transform:uppercase;
  padding:7px 14px;border:1px solid rgba(255,255,255,.1);
  background:transparent;color:rgba(255,255,255,.35);
  transition:all .2s;
}
.tlm-tab-btn:hover{border-color:rgba(200,108,255,.5);color:#c86cff;cursor:none}
.tlm-tab-btn.active{background:rgba(200,108,255,.12);border-color:#c86cff;color:#c86cff}
.tlm-close-btn{
  font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;
  font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  padding:10px 24px;background:#fff;color:#000;border:none;
  transition:background .2s;
}
.tlm-close-btn:hover{background:#c86cff;color:#fff;cursor:none}

/* COOKIE CONSENT BANNER */
#tot-cookie-banner{
  position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
  z-index:1900;
  background:#0d0d0d;
  border:1px solid rgba(200,108,255,.3);
  width:calc(100% - 40px);max-width:640px;
  padding:24px 28px;
  opacity:0;transform:translateX(-50%) translateY(20px);
  transition:opacity .45s, transform .45s;
  pointer-events:none;
}
#tot-cookie-banner.show{
  opacity:1;transform:translateX(-50%) translateY(0);
  pointer-events:all;
}
.tcb-eyebrow{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.35em;color:#c86cff;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px}
.tcb-eyebrow::before{content:'';display:block;width:20px;height:1px;background:#c86cff}
.tcb-title{font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:16px;color:#fff;letter-spacing:-.01em;margin-bottom:10px}
.tcb-text{font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.8;color:rgba(255,255,255,.55);margin-bottom:18px}
.tcb-text a{color:#c86cff;text-decoration:none}
.tcb-btns{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.tcb-accept{
  font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;font-weight:700;
  font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  padding:12px 24px;background:#c86cff;color:#fff;border:none;
  transition:background .2s;
}
.tcb-accept:hover{background:#b050ff;cursor:none}
.tcb-reject{
  font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;font-weight:700;
  font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  padding:12px 24px;background:transparent;color:rgba(255,255,255,.4);
  border:1px solid rgba(255,255,255,.15);transition:all .2s;
}
.tcb-reject:hover{border-color:#c86cff;color:#c86cff;cursor:none}
.tcb-settings{
  font-family:'JetBrains Mono',monospace;font-size:10px;
  color:rgba(255,255,255,.3);text-decoration:underline;
  background:none;border:none;letter-spacing:.05em;
  transition:color .2s;
}
.tcb-settings:hover{color:#c86cff;cursor:none}

@media(max-width:600px){
  #tot-legal-modal{max-width:100%;border-left:none;border-right:none}
  .tlm-header,.tlm-body,.tlm-footer{padding-left:20px;padding-right:20px}
  .tlm-footer-tabs{display:none}
  #tot-cookie-banner{bottom:16px;padding:18px 20px}
}
`;

// ── INJECT CSS ──────────────────────────────────────────────────────
var styleEl = document.createElement('style');
styleEl.textContent = css;
document.head.appendChild(styleEl);

// ── INJECT HTML ────────────────────────────────────────────────────
var HTML = `
<div id="tot-legal-backdrop" onclick="TotLegal.closeBg(event)">
  <div id="tot-legal-modal">
    <div class="tlm-header">
      <div>
        <div class="tlm-eyebrow">Top of Talent · Legal</div>
        <div class="tlm-title" id="tlm-title">Términos y Condiciones</div>
        <div class="tlm-date" id="tlm-date"></div>
      </div>
      <button class="tlm-close" onclick="TotLegal.close()">✕</button>
    </div>
    <div class="tlm-body" id="tlm-body"></div>
    <div class="tlm-footer">
      <div class="tlm-footer-tabs">
        <button class="tlm-tab-btn active" id="tlm-tab-terminos" onclick="TotLegal.open('terminos')">Términos</button>
        <button class="tlm-tab-btn" id="tlm-tab-privacidad" onclick="TotLegal.open('privacidad')">Privacidad</button>
        <button class="tlm-tab-btn" id="tlm-tab-cookies" onclick="TotLegal.open('cookies')">Cookies</button>
        <button class="tlm-tab-btn" id="tlm-tab-aviso" onclick="TotLegal.open('aviso')">Aviso Legal</button>
      </div>
      <button class="tlm-close-btn" onclick="TotLegal.close()">Cerrar</button>
    </div>
  </div>
</div>

<div id="tot-cookie-banner">
  <div class="tcb-eyebrow">Cookies</div>
  <div class="tcb-title">Usamos cookies</div>
  <div class="tcb-text">
    Utilizamos cookies esenciales para el funcionamiento de la plataforma y, con tu consentimiento, cookies de análisis para mejorar tu experiencia. Puedes aceptar todas, rechazar las no esenciales, o revisar nuestra <a href="#" onclick="TotLegal.open('cookies');return false">Política de Cookies</a>.
  </div>
  <div class="tcb-btns">
    <button class="tcb-accept" onclick="TotLegal.acceptCookies()">Aceptar todo</button>
    <button class="tcb-reject" onclick="TotLegal.rejectCookies()">Solo esenciales</button>
    <button class="tcb-settings" onclick="TotLegal.open('cookies')">Más información</button>
  </div>
</div>
`;

var wrapper = document.createElement('div');
wrapper.innerHTML = HTML;
document.body.insertBefore(wrapper, document.body.firstChild);

// ── PUBLIC API ──────────────────────────────────────────────────────
window.TotLegal = {
  currentDoc: null,

  open: function(doc) {
    var data = LEGAL[doc];
    if (!data) return;
    this.currentDoc = doc;

    document.getElementById('tlm-title').textContent = data.title;
    document.getElementById('tlm-date').textContent = data.date;

    var body = '';
    data.sections.forEach(function(s) {
      body += '<div class="tlm-section"><h3>' + s.h + '</h3><p>' + s.p + '</p></div>';
    });
    document.getElementById('tlm-body').innerHTML = body;
    document.getElementById('tlm-body').scrollTop = 0;

    // Update tabs
    ['terminos','privacidad','cookies','aviso'].forEach(function(t) {
      var btn = document.getElementById('tlm-tab-' + t);
      if (btn) btn.classList.toggle('active', t === doc);
    });

    document.getElementById('tot-legal-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close: function() {
    document.getElementById('tot-legal-backdrop').classList.remove('open');
    document.body.style.overflow = '';
  },

  closeBg: function(e) {
    if (e.target.id === 'tot-legal-backdrop') this.close();
  },

  // ── COOKIES ──
  acceptCookies: function() {
    localStorage.setItem('tot_cookies', JSON.stringify({
      essential: true, analytics: true, preferences: true,
      timestamp: Date.now(), decision: 'accepted'
    }));
    document.getElementById('tot-cookie-banner').classList.remove('show');
  },

  rejectCookies: function() {
    localStorage.setItem('tot_cookies', JSON.stringify({
      essential: true, analytics: false, preferences: false,
      timestamp: Date.now(), decision: 'essential_only'
    }));
    document.getElementById('tot-cookie-banner').classList.remove('show');
  },

  checkCookies: function() {
    var consent = null;
    try { consent = JSON.parse(localStorage.getItem('tot_cookies')); } catch(e) {}
    if (!consent) {
      // Show banner after 2s
      setTimeout(function() {
        document.getElementById('tot-cookie-banner').classList.add('show');
      }, 2000);
    }
  }
};

// Wire footer links
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-legal]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      TotLegal.open(el.getAttribute('data-legal'));
    });
  });
  TotLegal.checkCookies();
});

// Also check if DOM is already ready
if (document.readyState !== 'loading') {
  document.querySelectorAll('[data-legal]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      TotLegal.open(el.getAttribute('data-legal'));
    });
  });
  TotLegal.checkCookies();
}

})();
