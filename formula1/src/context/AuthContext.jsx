/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  updateProfile
} from 'firebase/auth';
// REMOVED/COMMENTED OUT: Firestore imports if not in use
import { auth } from '../firebase/firebaseConfig';

// --- NEW: Import emailjs-com for client-side email sending ---
import emailjs from 'emailjs-com';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- Corrected signup function: Removed outer useless try/catch ---
const signup = async (email, password, name) => {
    console.log("signup() function was called with:", email, name); // <--- ADD THIS
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  console.log("Attempting to send email for:", email);
  console.log("Recipient Name:", name);

  // Use email and name directly (not from state)
  emailjs.send(
    "service_vasotur",
    "template_yr8rrqi",
    { email, name },
    "AEf0rLomnd13Rvmw6"
  ).then(() => {
    console.log("Email enviado com Sucesso!");
    localStorage.setItem("statusEmail", false)
  }).catch((err) => {
    console.error(err);
    console.log("Erro ao enviar o email. Tente novamente mais tarde.");
  });

  return userCredential;
};

  const login = (email, password) => {
        localStorage.setItem("statusEmail", false)
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
        localStorage.setItem("statusEmail", true)
    return signOut(auth);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // --- Corrected deleteAccount function: Removed outer useless try/catch ---
  const deleteAccount = async () => {
    if (!currentUser) {
      // This is a valid throw, no try/catch needed around it
      throw new Error("No user is logged in to delete.");
    }

    try { // <-- This try/catch is useful because it processes the specific 'auth/requires-recent-login' error
      // REMOVED/COMMENTED OUT: Firestore document deletion logic if not in use
      // if (db) { ... }

      await deleteUser(currentUser);
          localStorage.setItem("statusEmail", true)
      console.log("Firebase Auth user deleted.");
    } catch (error) {
      // This catch block is NOT useless because it specifically handles
      // the 'auth/requires-recent-login' error and re-throws others.
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("Please re-authenticate to delete your account. Log out and log back in, then try again.");
      }
      throw error;
    }
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}