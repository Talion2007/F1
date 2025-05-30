// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
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

  const isUsernameTaken = async (username) => {
    const usernameLower = username.toLowerCase();
    const userDocRef = doc(db, 'usernames', usernameLower);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists();
  };

  const signup = async (email, password, name) => {
    console.log("signup() function called with: Email =", email, "Name =", name); // Log inicial

    const taken = await isUsernameTaken(name);
    if (taken) {
      const error = new Error('Nome de usuário já está em uso.');
      error.code = 'auth/username-already-in-use';
      throw error;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("Firebase Auth user created/authenticated. UID:", user.uid); // Log após criação de usuário

    await updateProfile(user, { displayName: name });

    const usernameLower = name.toLowerCase();
    // Dados que serão enviados para o Firestore
    const dataToFirestore = {
      userId: user.uid,
      name: name,
      email: email
    };

    console.log("Attempting to save username to Firestore:"); // Log antes de salvar no Firestore
    console.log("  Document ID (usernameLower):", usernameLower);
    console.log("  Data object:", dataToFirestore); // Log do objeto de dados completo

    await setDoc(doc(db, 'usernames', usernameLower), dataToFirestore);

    console.log("Username saved to Firestore successfully!"); // Log de sucesso no Firestore

    // Restante do seu código para enviar e-mail e localStorage
    console.log("Attempting to send welcome email for:", email);
    console.log("Recipient Name for welcome email:", name);

    emailjs.send(
      "service_vasotur",
      "template_yr8rrqi",
      { email, name },
      "AEf0rLomnd13Rvmw6"
    ).then(() => {
      console.log("Email de boas-vindas enviado com Sucesso!");
      localStorage.setItem("statusEmail", "sent");
    }).catch((err) => {
      console.error("Erro ao enviar o email de boas-vindas:", err);
    });

    localStorage.setItem("statusEmail", "registered");
    return userCredential;
  };

  const login = (email, password) => {
    localStorage.setItem("statusEmail", "loggedIn");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    localStorage.setItem("statusEmail", "loggedOut");
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const deleteAccount = async () => {
    if (!currentUser) {
      throw new Error("No user is logged in to delete.");
    }

    try {
      await deleteUser(currentUser);
      localStorage.setItem("statusEmail", "deleted");
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
    resetPassword,
    deleteAccount,
    isUsernameTaken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}