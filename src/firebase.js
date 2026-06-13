import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC5ro9odA5JuoLpJqo36h2YFaueqQAoRlE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "edubridgez.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "edubridgez",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "edubridgez.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "215386065995",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:215386065995:web:6c0d8ed50789238e6111ce"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
