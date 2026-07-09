// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT · Firebase Configuration
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDFcl-X3RE2UvWgJTj_QTmCRnw92vTAKDU",
  authDomain:        "top-of-talent.firebaseapp.com",
  projectId:         "top-of-talent",
  storageBucket:     "top-of-talent.firebasestorage.app",
  messagingSenderId: "793546585657",
  appId:             "1:793546585657:web:5e3d0cbf76e969fa6d7fe8",
  measurementId:     "G-Q6KKB53QSJ"
};

const app  = initializeApp(firebaseConfig);

// ── APP CHECK (anti-bot, reCAPTCHA v3 invisible) ──────────────────
// PASO 1: pega aqui tu "Site Key" de reCAPTCHA v3 (es publica, va en el cliente).
// Mientras diga PEGAR_..., App Check queda INACTIVO y el sitio funciona igual.
// Cuando pegues la llave real, App Check arranca solo. El bloqueo real solo
// ocurre cuando actives "Enforce" en la consola de Firebase (ver guia).
const RECAPTCHA_V3_SITE_KEY = '6LdumUstAAAAABiDCV2X2WhJ5_aGYA48X-o3Mufh';
if (RECAPTCHA_V3_SITE_KEY.indexOf('PEGAR_') !== 0) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (e) { console.warn('App Check no se inicializo:', e); }
}

const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db };
