import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { logoutUser,getAuthToken,isTokenExpired } from "../Network/User_api";
import './style.css';


const Main = () => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState('Гость');
    const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const main_part_link = 'http://localhost:8080/';

    useEffect(() => {
        const email = localStorage.getItem('name');
        if (email) setUserName(email);
    }, []);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.className = theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark';
        }
    }, [theme]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
        }
    };

    const validateToken = () => {
        const token = getAuthToken();
        if (!token || isTokenExpired(token)) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('name');
            localStorage.removeItem('email');
            navigate('/login');
            return false;
        }
        return token;
    };

    const fetchAllChats = async () => {
        setIsLoadingChats(true);
        try {
            const token = validateToken();
            if (!token) return;

            const response = await axios.post(`${main_part_link}api/v1/chats/all_chats`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const chatsMap = response.data.chats_with_messages || {};
            const loadedChats = Object.entries(chatsMap).flatMap(([chatEntity, messages]) => {
                let chat;
                if (typeof chatEntity === 'string') {
                    try { chat = JSON.parse(chatEntity); } catch { chat = parseChatEntity(chatEntity); }
                } else { chat = chatEntity; }
                if (!chat || !chat.id) return [];
                const parsedMessages = Array.isArray(messages) ? messages.flatMap(m => {
                    if (typeof m === 'string') return [{ type: 'text', content: m }];
                    if (m.message_question && m.message_answer) return [
                        { type: 'question', content: m.message_question },
                        { type: 'answer', content: m.message_answer }
                    ];
                    return [{ type: 'text', content: m.content || m.text || JSON.stringify(m) }];
                }) : [];

                const firstQuestion = parsedMessages.find(m => m.type === 'question');

                return [{
                    id: chat.id,
                    title: firstQuestion?.content || `Новый запрос`,
                    messages: parsedMessages
                }];
            });

            setChats(loadedChats);
            if (loadedChats.length > 0) setActiveChat(loadedChats[0]);
        } catch (err) {
            console.error('Ошибка:', err);
            setError('Ошибка загрузки чатов. Проверьте консоль для деталей.');
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                navigate('/login');
            }
        } finally {
            setIsLoadingChats(false);
        }
    };

    const parseChatEntity = (entity) => {
        if (!entity) return null;
        const regex = /ChatEntity\((.*?)\)/;
        const match = entity.match(regex);
        if (match && match[1]) {
            const props = match[1].split(',').map(p => p.trim());
            const chat = {};
            props.forEach(prop => {
                const [key, val] = prop.split('=').map(x => x.trim());
                if (key === 'user') {
                    const userMatch = val.match(/User\((.*?)\)/);
                    if (userMatch && userMatch[1]) {
                        const userProps = userMatch[1].split(',').map(p => p.trim());
                        const user = {};
                        userProps.forEach(p => { const [k, v] = p.split('=').map(x => x.trim()); user[k] = v.replace(/"/g, ''); });
                        chat[key] = user;
                    }
                } else { chat[key] = val.replace(/"/g, ''); }
            });
            return chat;
        }
        return null;
    };

    useEffect(() => {
        fetchAllChats();
    }, []);

    const handleNewChat = async () => {
        setIsCreatingChat(true);
        setError(null);
        try {
            const token = validateToken();
            if (!token) return;

            const response = await axios.post(`${main_part_link}api/v1/chats/new_chat`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const newChat = {
                id: response.data.chat_id,
                title: 'Новый запрос',
                messages: []
            };

            setChats([newChat, ...chats]);
            setActiveChat(newChat);
        } catch (err) {
            setError('Не удалось создать новый чат');
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                navigate('/login');
            }
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !activeChat?.id) return;

        setIsSendingMessage(true);
        setError(null);

        try {
            const token = validateToken();
            if (!token) return;

            const response = await axios.post(`${main_part_link}api/v1/chats/new_message`, {
                chat_id: activeChat.id,
                message
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const updatedChats = chats.map(chat => {
                if (chat.id === activeChat.id) {
                    const updatedMessages = [
                        ...chat.messages,
                        { type: 'question', content: message },
                        { type: 'answer', content: response.data.message_answer || 'Нет ответа' }
                    ];

                    const firstQuestion = updatedMessages.find(m => m.type === 'question');
                    return {
                        ...chat,
                        messages: updatedMessages,
                        title: firstQuestion?.content || chat.title
                    };
                }
                return chat;
            });

            setChats(updatedChats);
            setActiveChat(updatedChats.find(chat => chat.id === activeChat.id));
            setMessage('');
        } catch (err) {
            setError('Не удалось отправить сообщение');
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                navigate('/login');
            }
        } finally {
            setIsSendingMessage(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
            if (isSidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.menu-toggle-btn')) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSidebarOpen]);
    return (
        <div className={`d-flex vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} position-relative main-container`}>
            {/* Toggle Button for Mobile */}
            <button
                className="menu-toggle-btn btn btn-primary d-block d-md-none position-absolute"
                style={{ top: '10px', left: '10px', zIndex: 30 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <i className="bi bi-list"></i>
            </button>

            {/* Левая панель */}
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''} border-end d-flex flex-column p-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`} style={{ width: '280px' }}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-stars text-primary fs-3 me-2"></i>
                        <h4 className="m-0 fw-bold">WhatIf</h4>
                    </div>
                    <div className="position-relative" ref={menuRef}>
                        <div className="small" style={{ cursor: 'pointer' }} onClick={() => setShowMenu(!showMenu)}>
                            {userName} <i className="bi bi-caret-down-fill ms-1"></i>
                        </div>
                        {showMenu && (
                            <div
                                className={`position-absolute ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white border-light'} border rounded mt-2`}
                                style={{ right: 0, zIndex: 10, minWidth: '150px' }}
                            >
                                <div className="p-2" style={{ cursor: 'pointer' }} onClick={toggleTheme}>
                                    {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                                </div>
                                {getAuthToken() ? (
                                    <div
                                        className="p-2"
                                        style={{ cursor: 'pointer' }}
                                        onClick={async () => {
                                            try { await logoutUser(); } catch (err) { console.error(err); } finally {
                                                localStorage.removeItem('auth_token');
                                                navigate('/login');
                                            }
                                        }}
                                    >
                                        Выйти
                                    </div>
                                ) : (
                                    <div className="p-2" style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>
                                        Войти
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="mb-3">
                    <Link
                        to="/contacts"
                        className={`d-block p-2 mb-2 rounded ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <i className="bi bi-envelope-fill me-2"></i>Контакты
                    </Link>
                    <Link
                        to="/faq"
                        className={`d-block p-2 mb-2 rounded ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <i className="bi bi-question-circle-fill me-2"></i>FAQ
                    </Link>
                </div>

                <button
                    className="btn w-100 mb-3 d-flex align-items-center justify-content-center btn-primary"
                    onClick={handleNewChat}
                    disabled={isCreatingChat}
                >
                    {isCreatingChat ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span> Создание...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-plus-circle me-2"></i> Новый чат
                        </>
                    )}
                </button>

                {error && <div className="alert alert-danger p-2 mb-3">{error}</div>}

                <div className="flex-grow-1 overflow-auto">
                    {isLoadingChats ? (
                        <div className="text-center mt-3">
                            <div className="spinner-border text-primary" role="status"></div>
                        </div>
                    ) : chats.length > 0 ? (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                className={`p-2 mb-2 rounded ${activeChat?.id === chat.id
                                    ? theme === 'dark'
                                        ? 'bg-white text-dark'
                                        : 'bg-dark text-light'
                                    : theme === 'dark'
                                        ? 'bg-dark text-light'
                                        : 'bg-light text-dark'
                                }`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => setActiveChat(chat)}
                            >
                                {chat.title}
                            </div>
                        ))
                    ) : (
                        <div>Нет активных чатов</div>
                    )}
                </div>
            </div>

            {/* Правая часть - область сообщений */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                <div className="flex-grow-1 d-flex flex-column p-4 overflow-auto">
                    {isLoadingChats ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : activeChat ? (
                        <div className="w-100" style={{ maxWidth: '900px', margin: '0 auto' }}>
                            {activeChat.messages.length === 0 ? (
                                <div className="d-flex flex-column justify-content-end align-items-center text-center px-3" style={{ height: '70vh', paddingBottom: '15vh' }}>
                                    <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: '600', color: theme === 'dark' ? '#fff' : '#000' }}>Чем я могу помочь?</h1>
                                    <div className="input-group" style={{ width: '100%', maxWidth: '900px' }}>
                                        <input
                                            type="text"
                                            className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-dark'} rounded-pill px-4 py-3`}
                                            placeholder="Введите ваш запрос..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                            style={{ fontSize: '1rem', paddingRight: '50px' }}
                                        />
                                        <button
                                            className="btn btn-primary rounded-circle p-2 position-absolute"
                                            style={{ width: '40px', height: '40px', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                                            onClick={handleSendMessage}
                                            disabled={isSendingMessage}
                                        >
                                            {isSendingMessage ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-arrow-up"></i>}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                activeChat.messages.map((msg, idx) => {
                                    const isAnswer = msg.type === 'answer';
                                    const isQuestion = msg.type === 'question';

                                    return (
                                        <div key={idx} className={`mb-4 ${isQuestion ? 'd-flex justify-content-end' : 'd-flex justify-content-start'}`}>
                                            <div
                                                className={`p-3 ${isQuestion ? 'bg-primary text-white' : 'bg-secondary text-light'}`}
                                                style={{
                                                    maxWidth: '80%',
                                                    borderRadius: isQuestion ? '28px 28px 6px 28px' : '28px 28px 28px 6px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {isQuestion && (
                                                    <div className="d-flex align-items-center mb-2 justify-content-end">
                                                        <small className="text-muted me-2">Вы</small>
                                                        <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                                            <i className="bi bi-person-fill" style={{ fontSize: '12px' }}></i>
                                                        </div>
                                                    </div>
                                                )}
                                                {isAnswer && (
                                                    <div className="d-flex align-items-center mb-2">
                                                        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', marginRight: '8px' }}>
                                                            <i className="bi bi-robot" style={{ fontSize: '12px' }}></i>
                                                        </div>
                                                        <small className="text-light">WhatIF</small>
                                                    </div>
                                                )}
                                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center px-3">
                            <h1 className="mb-3" style={{ fontSize: '2rem', color: theme === 'dark' ? '#fff' : '#000' }}>Чем я могу помочь?</h1>
                            <p style={{ maxWidth: 480, lineHeight: 1.5, fontSize: '1.1rem', color: theme === 'dark' ? '#ccc' : '#666' }}>
                                Выберите чат или создайте новый.
                            </p>
                        </div>
                    )}
                </div>

                {activeChat && activeChat.messages.length > 0 && (
                    <div className="input-group" style={{ maxWidth: 900, width: '100%', margin: '0 auto', padding: '1rem 0' }}>
                        <input
                            type="text"
                            className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-dark'} rounded-pill px-4 py-3`}
                            placeholder="Введите ваш запрос..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                            style={{ fontSize: '1rem', paddingRight: '50px' }}
                        />
                        <button
                            className="btn btn-primary rounded-circle p-2 position-absolute"
                            style={{ width: '40px', height: '40px', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                            onClick={handleSendMessage}
                            disabled={isSendingMessage}
                        >
                            {isSendingMessage ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-arrow-up"></i>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Main;