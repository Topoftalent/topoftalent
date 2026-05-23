// ─────────────────────────────────────────────────────────────────
// TOP OF TALENT — Firebase Configuration
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db };
