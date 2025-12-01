// --- DEPLOYMENT CONFIGURATION ---
// To host this app on GitHub/Vercel/Netlify without a Setup Screen,
// paste your Firebase Config object inside the quotes below.

export const HARDCODED_FIREBASE_CONFIG = {
  // Paste your config here like this:
  // apiKey: "AIzaSy...",
  // authDomain: "mediflow-xyz.firebaseapp.com",
  // ...
  apiKey: "AIzaSyDIt_qFn3i60zCp019OooVyRPZbBIZPofk",
  authDomain: "orthoflow-83b9d.firebaseapp.com",
  projectId: "orthoflow-83b9d",
  storageBucket: "orthoflow-83b9d.firebasestorage.app",
  messagingSenderId: "76489126738",
  appId: "1:76489126738:web:5d321aeccc1ae8893b008b",
  measurementId: "G-QF0YFRQMET"

};

// If left empty, the app will fall back to the Setup Screen (LocalStorage).
export const hasHardcodedConfig = Object.keys(HARDCODED_FIREBASE_CONFIG).length > 0;