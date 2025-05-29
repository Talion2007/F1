// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // <-- IMPORTANTE: Adicione esta linha!

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABSkYgFBV9Z7V1elOelQxfwTYxSM8nX-0",
  authDomain: "f1-database-704d1.firebaseapp.com",
  projectId: "f1-database-704d1",
  storageBucket: "f1-database-704d1.firebasestorage.app",
  messagingSenderId: "984413007930",
  appId: "1:984413007930:web:3ee81aa0858e14bd0f0503",
  measurementId: "G-3JREDLMKZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Mantenha se quiser usar o Analytics

// IMPORTANTE: Adicione esta linha para exportar a instância de autenticação
export const auth = getAuth(app);