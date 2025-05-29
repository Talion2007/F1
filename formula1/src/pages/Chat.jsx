import React, { useState, useEffect, useCallback } from 'react';
import { db } from "../firebase/firebaseConfig"; // <-- CORREÇÃO AQUI
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from "../context/AuthContext"; // <-- CORREÇÃO AQUI também se AuthContext estiver em src/context

// Importe Header e Footer para manter o layout da Home
import Header from "../components/Header"; // <-- CORREÇÃO AQUI
import Footer from "../components/Footer"; // <-- CORREÇÃO AQUI

// Você pode querer criar um Chat.css para estilos específicos do chat
// mas usaremos Page.css para estilos gerais e Auth.css para containers iniciais
import "../styles/Page.css"; // <-- CORREÇÃO AQUI
import "../styles/Auth.css"; // <-- CORREÇÃO AQUI
import "../styles/Chat.css"; // <-- CORREÇÃO AQUI

function ChatScreen() {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]); // Estado para armazenar as mensagens do chat
  const [sending, setSending] = useState(false);
  const { currentUser } = useAuth();

  // --- Função para ENVIAR Mensagens ---
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
        timestamp: serverTimestamp(), // Garante que o timestamp é do servidor
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

  // --- Efeito para LER Mensagens em Tempo Real ---
  useEffect(() => {
    // 1. Crie uma query para a coleção de mensagens, ordenando por timestamp descendente
    // Isso garante que as mensagens mais recentes vêm primeiro
    const messagesQuery = query(
      collection(db, "chats", "general_chat", "messages"),
      orderBy("timestamp", "desc") // Ordene do mais novo para o mais antigo
    );

    // 2. Configure um listener em tempo real (onSnapshot)
    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const loadedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id, // O ID do documento é importante para a key da lista
        ...doc.data(), // Todos os outros dados (text, senderId, senderName, timestamp)
      }));
      setMessages(loadedMessages);
    }, (error) => {
      console.error("Erro ao carregar mensagens:", error);
    });

    // 3. Retorne a função de unsubscribe para parar de ouvir quando o componente for desmontado
    return () => unsubscribe();
  }, []); // A dependência vazia [] garante que este efeito roda apenas uma vez (ao montar)

  // --- Função para renderizar cada item da FlatList (ou div neste caso) ---
  // Usamos useCallback para otimização, já que esta função é passada como prop
  const renderMessage = useCallback(({ message }) => {
    // Verifica se a mensagem foi enviada pelo usuário atual
    const isMyMessage = currentUser && message.senderId === currentUser.uid;

    return (
      <div className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'}`}>
        <p className="message-sender-name">{message.senderName}</p>
        <p className="message-text">{message.text}</p>
        {/* Opcional: exiba o timestamp formatado */}
        {message.timestamp && (
          <span className="message-timestamp">
            {new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }, [currentUser]); // Recalcule se o currentUser mudar

  return (
    <>
      <Header />

      <section className="Main"> {/* Reutilizando a classe Main da sua Home */}
        <div className="totalContainer chat-container-wrapper"> {/* Container como os de Auth */}
          <h2>Chat Coletivo</h2>

          {/* Área de exibição das mensagens */}
          <div className="messages-display-area">
            {messages.length === 0 ? (
              <p className="no-messages-text">Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
            ) : (
              // Usamos um div com overflow para simular a FlatList (já que é React web)
              // Em React Native, seria uma FlatList de verdade aqui.
              <div className="messages-list-scrollable">
                {/* As mensagens são renderizadas em ordem inversa para parecer um chat (mais novas embaixo) */}
                {[...messages].reverse().map((msg) => (
                  <div key={msg.id}>
                    {renderMessage({ message: msg })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Área de input da mensagem */}
          <div className="message-input-area accountAlready"> {/* Reutilizando accountAlready para estilo de container */}
            <textarea
              className="message-input"
              placeholder="Digite sua mensagem..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows="3"
            ></textarea>
            <button
              className="LoginButton Register" // Reutilizando classes de botão
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

export default ChatScreen;