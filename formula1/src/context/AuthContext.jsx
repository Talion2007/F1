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

const TEMP_REG_KEY = 'tempRegistrationData';
const VERIF_CODE_KEY = 'verificationCode';
const VERIF_CODE_EXP_KEY = 'verificationCodeExpiry';

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
    console.log("signup() called (initiating email verification) for:", email, "with name:", name);

    const taken = await isUsernameTaken(name);
    if (taken) {
      const error = new Error('Nome de usuário já está em uso.');
      error.code = 'auth/username-already-in-use';
      throw error;
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = Date.now() + 15 * 60 * 1000;

    localStorage.setItem(TEMP_REG_KEY, JSON.stringify({ email, name, password }));
    localStorage.setItem(VERIF_CODE_KEY, verificationCode);
    localStorage.setItem(VERIF_CODE_EXP_KEY, expiryTime.toString());
    console.log("Dados de registro e código armazenados temporariamente no localStorage.");
    console.log("Código de verificação gerado:", verificationCode);

    try {
      // ATUALIZE AQUI: use import.meta.env.VITE_...
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_vasotur",
        import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID || "template_yr8rrqi",
        { to_email: email, to_name: name, verification_code: verificationCode },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "AEf0rLomnd13Rvmw6"
      );
      console.log("Email de verificação enviado com sucesso para:", email);
      return { success: true, message: "Código de verificação enviado! Verifique seu e-mail." };
    } catch (err) {
      console.error("Erro ao enviar o email de verificação:", err);
      localStorage.removeItem(TEMP_REG_KEY);
      localStorage.removeItem(VERIF_CODE_KEY);
      localStorage.removeItem(VERIF_CODE_EXP_KEY);
      throw new Error("Não foi possível enviar o código de verificação. Tente novamente.");
    }
  };

  const finalizeSignup = async (enteredCode) => {
    const storedCode = localStorage.getItem(VERIF_CODE_KEY);
    const storedExpiry = localStorage.getItem(VERIF_CODE_EXP_KEY);
    const storedData = JSON.parse(localStorage.getItem(TEMP_REG_KEY));

    if (!storedData || !storedCode || !storedExpiry) {
      throw new Error('Dados de cadastro não encontrados ou expirados. Por favor, reinicie o processo de cadastro.');
    }

    if (Date.now() > parseInt(storedExpiry, 10)) {
        localStorage.removeItem(TEMP_REG_KEY);
        localStorage.removeItem(VERIF_CODE_KEY);
        localStorage.removeItem(VERIF_CODE_EXP_KEY);
        throw new Error('Código de verificação expirado. Por favor, solicite um novo código.');
    }

    if (enteredCode !== storedCode) {
      const error = new Error('Código de verificação inválido. Tente novamente.');
      error.code = 'auth/invalid-verification-code';
      throw error;
    }

    const { email, name, password } = storedData;

    console.log("Código validado. Finalizando cadastro para:", email, "com nome:", name);

    localStorage.removeItem(TEMP_REG_KEY);
    localStorage.removeItem(VERIF_CODE_KEY);
    localStorage.removeItem(VERIF_CODE_EXP_KEY);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Firebase Auth user created/authenticated. UID:", user.uid);

        await updateProfile(user, { displayName: name });

        const usernameLower = name.toLowerCase();
        const dataToFirestore = {
            userId: user.uid,
            name: name,
            email: email
        };

        await setDoc(doc(db, 'usernames', usernameLower), dataToFirestore);
        console.log("Username saved to Firestore successfully!");

        // ATUALIZE AQUI: use import.meta.env.VITE_...
        await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_vasotur",
            import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || "template_yr8rrqi",
            { email, name },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "AEf0rLomnd13Rvmw6"
        );
        console.log("Email de boas-vindas enviado com sucesso!");

        localStorage.setItem("statusEmail", "registered");

        return userCredential;

    } catch (error) {
        console.error("Erro ao finalizar o cadastro no Firebase:", error);
        throw error;
    }
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
    finalizeSignup,
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