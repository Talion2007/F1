// src/pages/Chat.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from "../firebase/firebaseConfig"; // Ajustado o caminho
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from "../context/AuthContext"; // Ajustado o caminho

import Header from "../components/Header"; // Ajustado o caminho
import Footer from "../components/Footer"; // Ajustado o caminho

// Importe o arquivo de som
import notificationSound from '../assets/notification.mp3'; // Ajustado o caminho para o som

// Estilos
import "../styles/Page.css";
import "../styles/Auth.css";
import "../styles/Chat.css";

function Chat() { // Assumindo que o nome do seu componente é Chat
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const { currentUser } = useAuth();

  // Referência para o elemento de áudio
  const audioRef = useRef(new Audio(notificationSound));

  const handleSendMessage = async () => {
    if (messageText.trim() === '' || !currentUser) {
      alert('Por favor, digite uma mensagem e certifique-se de estar logado.');
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, "chats", "general_chat", "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Usuário Anônimo',
        timestamp: serverTimestamp(),
      });
      setMessageText('');
      console.log('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  // Efeito para LER Mensagens em Tempo Real E TOCAR SOM
  useEffect(() => {
    const messagesQuery = query(
      collection(db, "chats", "general_chat", "messages"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      let newMessagesReceived = false;
      const loadedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Verifica se houve novas mensagens de outros usuários
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // Se for uma mensagem adicionada E não for do usuário atual, marcamos para tocar o som
          const newMessageSenderId = change.doc.data().senderId;
          if (currentUser && newMessageSenderId !== currentUser.uid) {
            newMessagesReceived = true;
          }
        }
      });

      setMessages(loadedMessages);

      if (newMessagesReceived) {
        // Tenta tocar o som. O navegador pode bloquear o autoplay sem interação prévia.
        audioRef.current.play().catch(error => {
          console.log("Erro ao tocar o som (política de autoplay?):", error);
        });
      }
    }, (error) => {
      console.error("Erro ao carregar mensagens:", error);
    });

    return () => unsubscribe();
  }, [currentUser]); // currentUser na dependência para reconfigurar o listener se o usuário mudar

  // Função para renderizar cada bolha de mensagem
  const renderMessage = useCallback(({ message }) => {
    const isMyMessage = currentUser && message.senderId === currentUser.uid;
    return (
      <div className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'}`}>
        <p className="message-sender-name">{message.senderName}</p>
        <p className="message-text">{message.text}</p>
        {message.timestamp && (
          <span className="message-timestamp">
            {new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }, [currentUser]);

  return (
    <>
      <Header />

      <section className="Main">
        <div className="totalContainer chat-container-wrapper">
          <h2>Chat Coletivo</h2>

          <div className="messages-display-area">
            {messages.length === 0 ? (
              <p className="no-messages-text">Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
            ) : (
              <div className="messages-list-scrollable">
                {[...messages].reverse().map((msg) => ( // Reverse para exibir as mais novas embaixo
                  <div key={msg.id}>
                    {renderMessage({ message: msg })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="message-input-area accountAlready">
            <textarea
              className="message-input"
              placeholder="Digite sua mensagem..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows="3"
            ></textarea>
            <button
              className="LoginButton Register"
              onClick={handleSendMessage}
              disabled={sending}
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Chat; // Certifique-se que o nome do componente é Chat