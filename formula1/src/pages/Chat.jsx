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
import "../styles/Chat.css";

const ADMIN_EMAIL = 'radiance.knight.2007@gmail.com';

function Chat() {
    // --- SEO: Gerenciamento do Título da Página e Meta Descrição ---
    useEffect(() => {
        document.title = "Chat Global F1 | Fórmula 1 - Statistics";

        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = "Participe do chat global da Fórmula 1! Conecte-se com outros fãs, discuta corridas, pilotos e o universo da F1 em tempo real.";

        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, []); // Este useEffect não depende de estados, então roda uma vez ao montar

    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const { currentUser } = useAuth();

    const [userUid, setUserUid] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('Usuário Anônimo');

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
            audioRef.current.currentTime = 0;
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
                    hiddenBy: currentUser.email,
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
            orderBy("timestamp", "asc")
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

    const renderMessage = useCallback(({ message, index, allMessages }) => {
        const isMyMessage = currentUser && message.senderEmail === currentUser.email;
        const isHidden = message.hiddenByAdmin;

        const isMessageFromAdmin = message.senderEmail === ADMIN_EMAIL;

        const showSenderName = (() => {
            if (index === 0) {
                return true;
            }
            const prevMessage = allMessages[index - 1];
            return prevMessage && (
                prevMessage.senderEmail !== message.senderEmail ||
                (isMessageFromAdmin && prevMessage.senderEmail !== ADMIN_EMAIL) ||
                (!isMessageFromAdmin && prevMessage.senderEmail === ADMIN_EMAIL)
            );
        })();


        return (
            <div className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'} ${isMessageFromAdmin ? 'admin-message' : ''}`}>
                {showSenderName && <p className="message-sender-name">{message.senderName}</p>}
                <p className="message-text">{isHidden ? '[Conteúdo removido pelo administrador]' : message.text}</p>
                {message.timestamp && (
                    <span className="message-timestamp">
                        {new Date(message.timestamp.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {/* <-- Alterado para pt-BR */}
                    </span>
                )}
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
    }, [currentUser, isAdmin, handleHideMessage, ADMIN_EMAIL]);

    return (
        <>
            <Header />

            <section className="Main">
                {!currentUser ? (
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Chat - F1</h1>
                            {/* Traduzido aqui */}
                            <h3>Este conteúdo é restrito a membros registrados. Faça login ou registre uma conta para continuar!</h3>
                        </div>
                        <div className="buttons">
                            <button className="LoginButton">
                                <Link to="/login">Login</Link>
                            </button>
                            <button className="LoginButton Register">
                                <Link to="/register">Registrar</Link> {/* Traduzido aqui */}
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
                                    <p className="no-messages-text">Nenhuma mensagem ainda! Seja o primeiro a enviar!</p>
                                ) : (
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
                                    disabled={sending || !userEmail}
                                >
                                    {sending ? "Enviando..." : "Enviar"} {/* Traduzido aqui */}
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