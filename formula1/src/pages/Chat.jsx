import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import notificationSound from '../assets/notification.mp3';

import "../styles/Page.css";
import "../styles/Auth.css";
import "../styles/Chat.css"; // Certifique-se que este é o CSS que você está usando (ou ChatSpecific.css)

const ADMIN_EMAIL = 'radiance.knight.2007@gmail.com'; // Certifique-se que este email é EXATAMENTE o mesmo do seu admin no Firebase

function Chat() {
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const { currentUser } = useAuth(); // Obtém o usuário do contexto

    const [userUid, setUserUid] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('Usuário Anônimo');

    // useEffect para garantir que o UID, EMAIL e nome do usuário sejam atualizados quando currentUser mudar
    useEffect(() => {
        if (currentUser) {
            setUserUid(currentUser.uid);
            setUserEmail(currentUser.email);
            setUserDisplayName(currentUser.displayName || 'Usuário Anônimo');
            console.log("Chat.js: currentUser atualizado. Email:", currentUser.email, "UID:", currentUser.uid);
        } else {
            setUserUid(null);
            setUserEmail(null);
            setUserDisplayName('Usuário Anônimo');
            console.log("Chat.js: currentUser é NULO.");
        }
    }, [currentUser]);

    const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

    const audioRef = useRef(new Audio(notificationSound));
    const messagesEndRef = useRef(null);
    const isInitialLoad = useRef(true);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0; // Reinicia o áudio
            audioRef.current.play().catch(error => {
                console.warn("Não foi possível tocar o som da notificação. Motivo:", error.name, error.message);
                console.warn("Isso geralmente acontece porque o usuário não interagiu com a página ainda (política de autoplay).");
            });
        }
    }, []);

    const unlockAudioContext = useCallback(() => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.volume = 0;
            audioRef.current.play().then(() => {
                audioRef.current.pause();
                audioRef.current.volume = 1;
                console.log("Contexto de áudio desbloqueado.");
            }).catch(e => {
                console.warn("Falha ao desbloquear o contexto de áudio (esperado se já desbloqueado ou sem interação prévia):", e.name);
            });
        }
    }, []);


    const handleSendMessage = async () => {
        console.log("handleSendMessage chamado.");
        console.log("  messageText:", messageText);
        console.log("  currentUser (do AuthContext):", currentUser);
        console.log("  userEmail (estado local do Chat):", userEmail);
        console.log("  isAdmin:", isAdmin);

        if (messageText.trim() === '' || !userEmail) {
            console.warn("Bloqueando envio: Mensagem vazia ou userEmail ausente. userEmail:", userEmail);
            alert('Por favor, digite uma mensagem e certifique-se de estar logado.');
            return;
        }

        unlockAudioContext();

        setSending(true);

        try {
            await addDoc(collection(db, "chats", "general_chat", "messages"), {
                text: messageText,
                senderEmail: userEmail,
                senderName: userDisplayName,
                timestamp: serverTimestamp(),
                hiddenByAdmin: false,
            });
            setMessageText('');
            console.log('Mensagem enviada com sucesso!');
        } catch (error) {
            console.error("ERRO CRÍTICO ao enviar mensagem:", error);
            alert('Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setSending(false);
        }
    };

    const handleHideMessage = async (messageId, messageSenderEmail) => {
        console.log("handleHideMessage chamado.");
        console.log("  isAdmin:", isAdmin);
        console.log("  messageId:", messageId);
        console.log("  messageSenderEmail:", messageSenderEmail);

        if (!isAdmin) {
            console.warn("Bloqueando ocultação: Usuário não é admin.");
            alert("Você não tem permissão para ocultar mensagens.");
            return;
        }

        if (isAdmin && messageSenderEmail === ADMIN_EMAIL && userEmail !== ADMIN_EMAIL) {
            console.warn("Bloqueando ocultação: Admin tentando ocultar mensagem de outro admin.");
            alert("Administradores não podem ocultar mensagens de outros administradores.");
            return;
        }

        if (window.confirm("Tem certeza que deseja ocultar esta mensagem?")) {
            try {
                const messageRef = doc(db, "chats", "general_chat", "messages", messageId);
                await updateDoc(messageRef, {
                    text: '[Conteúdo removido pelo administrador]',
                    hiddenByAdmin: true,
                    hiddenAt: serverTimestamp(),
                    hiddenBy: currentUser.email, // Salva quem ocultou
                });
                console.log(`Mensagem ${messageId} ocultada pelo admin.`);
            } catch (error) {
                console.error("ERRO CRÍTICO ao ocultar mensagem:", error);
                alert("Não foi possível ocultar a mensagem. Verifique as regras do Firestore.");
            }
        }
    };

    useEffect(() => {
        const messagesQuery = query(
            collection(db, "chats", "general_chat", "messages"),
            orderBy("timestamp", "asc") // Ordenar por timestamp de forma crescente (ascendente)
        );

        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const loadedMessages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            let shouldPlaySound = false;

            console.log("onSnapshot disparado. isInitialLoad.current:", isInitialLoad.current);

            if (!isInitialLoad.current) {
                querySnapshot.docChanges().forEach((change) => {
                    console.log("Change type:", change.type, "Sender email:", change.doc.data().senderEmail, "Current user email:", currentUser?.email);
                    if (change.type === "added" && currentUser && change.doc.data().senderEmail !== currentUser.email) {
                        shouldPlaySound = true;
                        console.log("NOTIFICAÇÃO DEVE TOCAR! Nova mensagem de outro usuário.");
                    }
                });
            } else {
                isInitialLoad.current = false;
                console.log("Primeira carga do chat, não toca som.");
            }

            setMessages(loadedMessages);

            if (shouldPlaySound) {
                playNotificationSound();
            }

            // Scroll para o final das mensagens
            if (messagesEndRef.current) {
                setTimeout(() => {
                    messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
                }, 100);
            }

        }, (error) => {
            console.error("Erro ao carregar mensagens em tempo real:", error);
        });

        return () => {
            unsubscribe();
            isInitialLoad.current = true;
        };
    }, [currentUser, playNotificationSound]);

    // MUDANÇA: renderMessage agora recebe 'index' e 'allMessages'
    const renderMessage = useCallback(({ message, index, allMessages }) => {
        const isMyMessage = currentUser && message.senderEmail === currentUser.email;
        const isHidden = message.hiddenByAdmin;

        // NOVO: Adiciona uma verificação para saber se a mensagem é do admin
        const isMessageFromAdmin = message.senderEmail === ADMIN_EMAIL;

        // Lógica para verificar se o nome do remetente deve ser exibido
        const showSenderName = (() => {
            // Se for a primeira mensagem, sempre mostra o nome
            if (index === 0) {
                return true;
            }
            // Obter a mensagem anterior
            const prevMessage = allMessages[index - 1];
            // Mostrar o nome se o remetente for diferente do remetente da mensagem anterior
            // NOVO: Também mostra o nome se for mensagem de admin e a anterior não for de admin,
            // ou se a anterior for de admin e a atual for de outro usuário.
            return prevMessage && (
                prevMessage.senderEmail !== message.senderEmail ||
                (isMessageFromAdmin && prevMessage.senderEmail !== ADMIN_EMAIL) ||
                (!isMessageFromAdmin && prevMessage.senderEmail === ADMIN_EMAIL)
            );
        })();


        return (
            // NOVO: Adiciona a classe 'admin-message' se a mensagem for do admin
            <div className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'} ${isMessageFromAdmin ? 'admin-message' : ''}`}>
                {/* Condicionalmente renderiza o nome do remetente */}
                {showSenderName && <p className="message-sender-name">{message.senderName}</p>}
                <p className="message-text">{isHidden ? '[Conteúdo removido pelo administrador]' : message.text}</p>
                {message.timestamp && (
                    <span className="message-timestamp">
                        {new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                {/* Botão de ocultar visível apenas para admin e se a mensagem não estiver oculta */}
                {isAdmin && !isHidden && (
                    <button
                        className="LoginButton Register Admin"
                        onClick={() => handleHideMessage(message.id, message.senderEmail)}
                    >
                        Ocultar
                    </button>
                )}
            </div>
        );
    }, [currentUser, isAdmin, handleHideMessage, ADMIN_EMAIL]); // NOVO: Adicione ADMIN_EMAIL às dependências

    return (
        <>
            <Header />

            <section className="Main">
                {!currentUser ? (
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Chat - F1</h1>
                            <h3>This content is restricted to Registered Members. Sign In or Register an account to Continue!</h3>
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
                        <div className="container">
                            <h1 className="title">Chat</h1>
                        </div>
                        <article>
                            <div className="messages-display-area" ref={messagesEndRef}>
                                {messages.length === 0 ? (
                                    <p className="no-messages-text">Any message yet! Be the first to send!</p>
                                ) : (
                                    // MUDANÇA: Passa 'index' e 'messages' para renderMessage
                                    messages.map((msg, index) => (
                                        <div key={msg.id}>
                                            {renderMessage({ message: msg, index: index, allMessages: messages })}
                                        </div>
                                    ))
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
                                    className="LoginButton Register Chat"
                                    onClick={handleSendMessage}
                                    disabled={sending || !userEmail} // Desabilita se estiver enviando ou se userEmail não estiver pronto
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