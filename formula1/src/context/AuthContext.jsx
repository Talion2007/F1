/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  updateProfile,
  sendPasswordResetEmail, // <-- IMPORTANTE: Adicionado para redefinição de senha
  // GoogleAuthProvider,    // <-- Descomente se for usar login com Google
  // signInWithPopup        // <-- Descomente se for usar login com Google
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

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

  const signup = async (email, password, name) => {
    console.log("signup() function was called with:", email, name);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    console.log("Attempting to send welcome email for:", email);
    console.log("Recipient Name for welcome email:", name);

    // Use emailjs.send com .then()/.catch() para o email de boas-vindas
    emailjs.send(
      "service_vasotur",
      "template_yr8rrqi", // Usando o seu novo template ID
      { email, name },     // Usando 'email' e 'name' como chaves, como no seu último código
      "AEf0rLomnd13Rvmw6"
    ).then(() => {
      console.log("Email de boas-vindas enviado com Sucesso!");
      localStorage.setItem("statusEmail", "sent"); // Altere o valor para um string, ex: "sent"
    }).catch((err) => {
      console.error("Erro ao enviar o email de boas-vindas:", err);
      // Não alteramos o 'statusEmail' para 'false' em caso de erro no envio do e-mail de boas-vindas
      // pois o registro em si foi bem-sucedido.
    });

    localStorage.setItem("statusEmail", "registered"); // Indica que o registro foi feito
    return userCredential;
  };

  const login = (email, password) => {
    localStorage.setItem("statusEmail", "loggedIn"); // Indica que o login foi feito
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    localStorage.setItem("statusEmail", "loggedOut"); // Indica que o logout foi feito
    return signOut(auth);
  };

  // --- NOVA FUNÇÃO: redefinir a senha ---
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // --- OPCIONAL: Login com Google ---
  // const loginWithGoogle = () => {
  //   const provider = new GoogleAuthProvider();
  //   return signInWithPopup(auth, provider);
  // };

  const deleteAccount = async () => {
    if (!currentUser) {
      throw new Error("No user is logged in to delete.");
    }

    try {
      await deleteUser(currentUser);
      localStorage.setItem("statusEmail", "deleted"); // Indica que a conta foi deletada
      console.log("Firebase Auth user deleted.");
    } catch (error) {
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
    resetPassword, // <-- IMPORTANTE: Exporte a função resetPassword
    // loginWithGoogle, // <-- Descomente se for usar login com Google
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}