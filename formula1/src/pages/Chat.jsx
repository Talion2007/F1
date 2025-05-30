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

const ADMIN_EMAIL = 'radiance.knight.2007@gmail.com'; // Certifique-se que este email é EXATAMENTE o mesmo do seu admin no Firebase

function Chat() {
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const { currentUser } = useAuth(); // Obtém o usuário do contexto

    const [userUid, setUserUid] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('Usuário Anônimo');

    // MUDANÇA: useEffect para garantir que o UID, EMAIL e nome do usuário sejam atualizados quando currentUser mudar
    useEffect(() => {
        if (currentUser) {
            setUserUid(currentUser.uid);
            setUserEmail(currentUser.email);
            setUserDisplayName(currentUser.displayName || 'Usuário Anônimo');
            // ADICIONADO PARA DEBUG:
            console.log("Chat.js: currentUser atualizado. Email:", currentUser.email, "UID:", currentUser.uid);
        } else {
            setUserUid(null);
            setUserEmail(null);
            setUserDisplayName('Usuário Anônimo');
            // ADICIONADO PARA DEBUG:
            console.log("Chat.js: currentUser é NULO.");
        }
    }, [currentUser]);

    const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

    const audioRef = useRef(new Audio(notificationSound));
    const messagesEndRef = useRef(null);
    const isInitialLoad = useRef(true);

    const handleSendMessage = async () => {
        // ADICIONADO PARA DEBUG:
        console.log("handleSendMessage chamado.");
        console.log("  messageText:", messageText);
        console.log("  currentUser (do AuthContext):", currentUser);
        console.log("  userEmail (estado local do Chat):", userEmail);
        console.log("  isAdmin:", isAdmin);

        // Usa userEmail para garantir que o EMAIL está presente e atualizado
        if (messageText.trim() === '' || !userEmail) {
            // ADICIONADO PARA DEBUG:
            console.warn("Bloqueando envio: Mensagem vazia ou userEmail ausente. userEmail:", userEmail);
            alert('Por favor, digite uma mensagem e certifique-se de estar logado.');
            return;
        }
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
            // ADICIONADO PARA DEBUG:
            console.error("ERRO CRÍTICO ao enviar mensagem:", error);
            alert('Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setSending(false);
        }
    };

    const handleHideMessage = async (messageId, messageSenderEmail) => {
        // ADICIONADO PARA DEBUG:
        console.log("handleHideMessage chamado.");
        console.log("  isAdmin:", isAdmin);
        console.log("  messageId:", messageId);
        console.log("  messageSenderEmail:", messageSenderEmail);

        if (!isAdmin) {
            // ADICIONADO PARA DEBUG:
            console.warn("Bloqueando ocultação: Usuário não é admin.");
            alert("Você não tem permissão para ocultar mensagens.");
            return;
        }

        // Adiciona uma verificação extra para o admin não ocultar mensagens de outros admins (opcional)
        // Isso impede que um admin oculte a mensagem de outro admin. Se quiser, remova ou ajuste.
        if (isAdmin && messageSenderEmail === ADMIN_EMAIL && userEmail !== ADMIN_EMAIL) {
            // ADICIONADO PARA DEBUG:
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
                // ADICIONADO PARA DEBUG:
                console.error("ERRO CRÍTICO ao ocultar mensagem:", error);
                alert("Não foi possível ocultar a mensagem. Verifique as regras do Firestore.");
            }
        }
    };

    useEffect(() => {
        const messagesQuery = query(
            collection(db, "chats", "general_chat", "messages"),
            orderBy("timestamp", "desc") // Ordena por timestamp para pegar as mais recentes
        );

        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const loadedMessages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            let shouldPlaySound = false;

            // Lógica para tocar som apenas para novas mensagens de outros usuários
            if (!isInitialLoad.current) {
                querySnapshot.docChanges().forEach((change) => {
                    if (change.type === "added" && currentUser && change.doc.data().senderEmail !== currentUser.email) {
                        shouldPlaySound = true;
                    }
                });
            } else {
                isInitialLoad.current = false;
            }

            setMessages(loadedMessages);

            if (shouldPlaySound) {
                audioRef.current.play().catch(error => {
                    console.log("Erro ao tocar o som (política de autoplay do navegador?):", error);
                });
            }

            // Scroll para o final das mensagens
            if (messagesEndRef.current) {
                // Pequeno delay para garantir que o DOM foi atualizado
                setTimeout(() => {
                    messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
                }, 100);
            }

        }, (error) => {
            console.error("Erro ao carregar mensagens em tempo real:", error); // Adicionei detalhes
        });

        // Cleanup function para desinscrever do listener do Firestore
        return () => {
            unsubscribe();
            isInitialLoad.current = true; // Reseta para que a primeira carga sempre toque som no login/recarregamento
        };
    }, [currentUser]); // Dependência de currentUser para re-executar se o usuário mudar

    const renderMessage = useCallback(({ message }) => {
        const isMyMessage = currentUser && message.senderEmail === currentUser.email;
        const isHidden = message.hiddenByAdmin;

        return (
            <div className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'}`}>
                <p className="message-sender-name">{message.senderName}</p>
                <p className="message-text">{isHidden ? '[Conteúdo removido pelo administrador]' : message.text}</p>
                {message.timestamp && (
                    <span className="message-timestamp">
                        {new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                {/* Botão de ocultar visível apenas para admin e se a mensagem não estiver oculta */}
                {isAdmin && !isHidden && (
                    <button
                        className="hide-message-button"
                        onClick={() => handleHideMessage(message.id, message.senderEmail)}
                    >
                        Ocultar
                    </button>
                )}
            </div>
        );
    }, [currentUser, isAdmin, handleHideMessage]); // Dependências do useCallback

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
                            <div className="messages-display-area">
                                {messages.length === 0 ? (
                                    <p className="no-messages-text">Any message yet! Be the first to send!</p>
                                ) : (
                                    <div className="messages-list-scrollable" ref={messagesEndRef}>
                                        {/* Exibe as mensagens na ordem correta (mais antigas em cima, mais recentes em baixo) */}
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