// src/pages/Chat.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom"; // Mantém o Link para a navegação de Login/Register

import Header from "../components/Header";
import Footer from "../components/Footer";

// Importe o arquivo de som (Verifique o caminho do seu arquivo de som)
import notificationSound from '../assets/notification.mp3'; // <-- Confirme este caminho! Ex: '../assets/sounds/notification.mp3' se estiver em subpasta

// Estilos (Você já os importa, apenas confirmando)
import "../styles/Page.css";
import "../styles/Auth.css";
import "../styles/Chat.css"; // Seu CSS específico para o chat

function Chat() {
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const { currentUser } = useAuth();

    // Referência para o elemento de áudio
    const audioRef = useRef(new Audio(notificationSound));

    const handleSendMessage = async () => {
        // Validação: Garante que há texto e que o usuário está logado
        if (messageText.trim() === '' || !currentUser) {
            alert('Por favor, digite uma mensagem e certifique-se de estar logado.');
            return;
        }
        setSending(true); // Desabilita o botão para evitar múltiplos envios

        try {
            // Adiciona a mensagem ao Firestore
            await addDoc(collection(db, "chats", "general_chat", "messages"), {
                text: messageText,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Usuário Anônimo', // Usa o nome de exibição ou 'Usuário Anônimo'
                timestamp: serverTimestamp(), // Carimbo de data/hora do servidor
            });
            setMessageText(''); // Limpa o campo de texto
            console.log('Mensagem enviada com sucesso!');
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            alert('Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setSending(false); // Reabilita o botão
        }
    };

    // Efeito para LER Mensagens em Tempo Real e Tocar Som
    useEffect(() => {
        // Cria a query para as mensagens, ordenando do mais novo para o mais antigo
        const messagesQuery = query(
            collection(db, "chats", "general_chat", "messages"),
            orderBy("timestamp", "desc")
        );

        // Configura o listener em tempo real
        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            let newMessagesReceived = false;
            const loadedMessages = querySnapshot.docs.map(doc => ({
                id: doc.id, // ID do documento para a key
                ...doc.data(), // Todos os outros dados da mensagem
            }));

            // Itera sobre as mudanças para detectar novas mensagens de outros usuários
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const newMessageSenderId = change.doc.data().senderId;
                    // Toca o som APENAS se a mensagem for nova E não foi enviada pelo usuário atual
                    if (currentUser && newMessageSenderId !== currentUser.uid) {
                        newMessagesReceived = true;
                    }
                }
            });

            setMessages(loadedMessages); // Atualiza o estado das mensagens

            // Se novas mensagens de outros usuários foram recebidas, tenta tocar o som
            if (newMessagesReceived) {
                audioRef.current.play().catch(error => {
                    console.log("Erro ao tocar o som (política de autoplay do navegador?):", error);
                });
            }
        }, (error) => {
            console.error("Erro ao carregar mensagens:", error);
        });

        // Limpa o listener ao desmontar o componente para evitar vazamento de memória
        return () => unsubscribe();
    }, [currentUser]); // currentUser na dependência para reconfigurar o listener se o usuário logar/deslogar

    // Função memoizada para renderizar cada bolha de mensagem
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
    }, [currentUser]); // Depende de currentUser para re-renderizar corretamente o estilo da própria mensagem

    return (
        <>
            <Header /> {/* Seu componente de cabeçalho */}

            <section className="Main"> {/* Seção principal, similar à Home */}
                {!currentUser ? ( // Lógica de restrição de acesso
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Chat - F1</h1>
                            <h3>Este conteúdo é restrito a Membros Registrados. Faça login ou registre uma conta para continuar!</h3>
                        </div>
                        <div className="buttons">
                            <button className="LoginButton">
                                <Link to="/login">Login</Link>
                            </button>
                            <button className="LoginButton Register">
                                <Link to="/register">Register</Link>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Conteúdo do Chat para usuário logado */}
                        <div className="container"> {/* Usei 'container' como você fez em outros lugares */}
                            <h1 className="title">Chat</h1>
                        </div>
                        <article> {/* Conteúdo principal do chat */}
                            <div className="messages-display-area">
                                {messages.length === 0 ? (
                                    <p className="no-messages-text">Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
                                ) : (
                                    <div className="messages-list-scrollable">
                                        {/* Inverte a ordem para que as mensagens mais recentes apareçam no final da área de rolagem */}
                                        {[...messages].reverse().map((msg) => (
                                            <div key={msg.id}>
                                                {renderMessage({ message: msg })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="message-input-area">
                                <textarea
                                    className="message-input"
                                    placeholder="Digite sua mensagem..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    rows="3"
                                ></textarea>
                                <button
                                    className="LoginButton Register Chat" // Mantém suas classes
                                    onClick={handleSendMessage}
                                    disabled={sending}
                                >
                                    {sending ? "Enviando..." : "Enviar"}
                                </button>
                            </div>
                        </article>
                    </>
                )}
            </section>

            <Footer />
        </>
    );
}

export default Chat;