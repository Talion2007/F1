// src/components/EmailForm.jsx

import React, { useState, useEffect } from "react";
import emailjs from "emailjs-com";
import { db } from "../firebase/firebaseConfig"; // Importe a instância do Firestore
import { doc, getDoc, setDoc } from "firebase/firestore"; // Importe as funções do Firestore
import { useAuth } from "../context/AuthContext"; // Importe o contexto de autenticação

import "../styles/Email.css";

function EmailForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  // 'status' agora indica se o FORMULÁRIO deve ser mostrado (true) ou a mensagem de sucesso (false)
  const [status, setStatus] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Novo estado para controlar o carregamento
  const { currentUser } = useAuth(); // Pega o usuário logado

  // Efeito para carregar o status do email do Firestore quando o componente montar ou o usuário mudar
  useEffect(() => {
    const fetchEmailStatus = async () => {
      if (!currentUser) {
        // Se não houver usuário logado (embora o componente Contact já verifique isso),
        // podemos assumir que o formulário sempre deve ser visível ou redirecionar.
        // Neste caso, vamos assumir que ele só será renderizado se houver currentUser.
        setStatus(true); // Mostra o formulário para usuários não logados (se for o caso)
        setIsLoading(false);
        return;
      }

      setIsLoading(true); // Começa a carregar
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Se 'hasSentContactEmail' for true, o formulário NÃO deve ser mostrado
          if (userData.hasSentContactEmail) {
            setStatus(false);
          } else {
            setStatus(true); // Mostra o formulário
          }
        } else {
          // Se o documento do usuário não existe, assume que nunca enviou e cria o documento
          // setDoc(userDocRef, { hasSentContactEmail: false }, { merge: true }); // Pode inicializar ou deixar para quando enviar
          setStatus(true); // Mostra o formulário
        }
      } catch (error) {
        console.error("Erro ao buscar status do email:", error);
        setStatus(true); // Em caso de erro, assume que o formulário deve ser mostrado
        alert("Erro ao carregar o status do email. Por favor, recarregue a página.");
      } finally {
        setIsLoading(false); // Termina o carregamento
      }
    };

    fetchEmailStatus();
  }, [currentUser]); // Rode este efeito sempre que o usuário logado mudar

  const sendEmail = async (e) => { // Tornar assíncrona para usar await
    e.preventDefault();

    if (!currentUser) {
        alert("Você precisa estar logado para enviar um email de contato.");
        return;
    }

    // Validação básica do formulário
    if (name.trim() === '' || email.trim() === '') {
        alert("Por favor, preencha seu nome e email.");
        return;
    }

    setIsLoading(true); // Define loading para evitar múltiplos envios
    
    try {
      // 1. Envia o email via EmailJS
      await emailjs.send(
        "service_vasotur",     // Seu Service ID do EmailJS
        "template_b164ekm",    // Seu Template ID do EmailJS
        { email, name },       // Dados do template
        "AEf0rLomnd13Rvmw6"      // Sua Public Key do EmailJS
      );

      // 2. Atualiza o status no Firestore para o usuário logado
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { hasSentContactEmail: true }, { merge: true }); // 'merge: true' para não sobrescrever outros campos

      setStatus(false); // Esconde o formulário, mostra a mensagem de sucesso
      setEmail("");
      setName("");
      alert("Email enviado com sucesso!");

    } catch (err) {
      console.error("Erro ao enviar o email ou atualizar Firestore:", err);
      setStatus(true); // Em caso de erro, mantém o formulário visível
      alert("Erro ao enviar o email. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false); // Termina o loading
    }
  };

  if (isLoading) {
    return <div className="email-form-loading">Loading email status...</div>;
  }

  return (
    <>
      {status ? // Se status for true, mostra o formulário
        <form onSubmit={sendEmail} className="email-form">
          <input
            type="text"
            placeholder="Insert your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Insert your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Email"}
          </button>
        </form>
        : // Se status for false, mostra a mensagem de sucesso
        <>
          <h3>Email sent successfully!</h3>
        </>
      }
    </>
  );
}

export default EmailForm;