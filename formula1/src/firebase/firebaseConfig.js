// src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Mantenha se quiser usar o Analytics
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- IMPORTANTE: Adicione esta linha!

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABSkYgFBV9Z7V1elOelQxfwTYxSM8nX-0",
  authDomain: "f1-database-704d1.firebaseapp.com",
  projectId: "f1-database-704d1",
  storageBucket: "f1-database-704d1.firebasestorage.app",
  messagingSenderId: "984413007930",
  appId: "1:984413007930:web:3ee81aa0858e14bd0f0503",
  measurementId: "G-3JREDLMKZN" // Mantenha se quiser usar o Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Mantenha se quiser usar o Analytics

// --- NOVO/CORRIGIDO: Inicialize e exporte a autenticação e o Firestore ---
export const auth = getAuth(app);
export const db = getFirestore(app); // <-- IMPORTANTE: Inicializa e exporta o Firestore