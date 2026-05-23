// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT — Firebase Configuration
// Reemplaza los valores de AQUI_TU_* con tu firebaseConfig real
// obtenido de: Firebase Console → Configuración → Tus apps → Web
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AQUI_TU_API_KEY",
  authDomain:        "AQUI_TU_AUTH_DOMAIN",
  projectId:         "AQUI_TU_PROJECT_ID",
  storageBucket:     "AQUI_TU_STORAGE_BUCKET",
  messagingSenderId: "AQUI_TU_MESSAGING_SENDER_ID",
  appId:             "AQUI_TU_APP_ID"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db };
