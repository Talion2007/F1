// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup // Para o login com Google
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig'; // Ajuste o caminho se necessário

// 1. Criação do Contexto
const AuthContext = createContext();

// 2. Hook personalizado para usar o contexto facilmente
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Provedor de Autenticação
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para saber se o estado inicial do usuário já foi carregado

  // Efeito para observar o estado de autenticação do Firebase
  // Isso roda uma vez quando o componente é montado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Define o usuário atual
      setLoading(false);    // Indica que o carregamento inicial terminou
    });

    // Função de limpeza: remove o listener quando o componente é desmontado
    return unsubscribe;
  }, []);

  // Funções de Autenticação
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Valor que será fornecido a todos os componentes que usarem o AuthContext
  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Renderiza os filhos apenas quando o carregamento inicial do usuário terminar */}
      {!loading && children}
    </AuthContext.Provider>
  );
}