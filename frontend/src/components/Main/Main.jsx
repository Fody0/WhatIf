import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logoutUser } from "../Network/User_api";

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
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    const menuRef = useRef(null);
    const navigate = useNavigate();
    const main_part_link = 'http://localhost:8080/';

    useEffect(() => {
        const email = localStorage.getItem('name');
        if (email) setUserName(email);
    }, []);

    useEffect(() => {
        document.body.className = theme === 'dark' ? 'bg-black text-light' : 'bg-light text-dark';
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const getAuthToken = () => localStorage.getItem('auth_token');

    const fetchAllChats = async () => {
        setIsLoadingChats(true);
        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.post(`${main_part_link}api/v1/chats/all_chats`, {}, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const chatsMap = response.data.chats_with_messages;
            const loadedChats = [];

            for (const [chatEntity, messages] of Object.entries(chatsMap)) {
                try {
                    let chat;
                    if (typeof chatEntity === 'string') {
                        try {
                            chat = JSON.parse(chatEntity);
                        } catch {
                            chat = parseChatEntity(chatEntity);
                        }
                    } else {
                        chat = chatEntity;
                    }
                    loadedChats.push({
                        id: chat.id,
                        title: chat.title || `Запрос #${chat.id}`,
                        messages: Array.isArray(messages)
                            ? messages.flatMap(m => {
                                if (typeof m === 'string') return [m];
                                if (m.message_question && m.message_answer) {
                                    return [
                                        `🧑‍💬 Вопрос: ${m.message_question}`,
                                        `🤖 Ответ: ${m.message_answer}`
                                    ];
                                }
                                return [m.content || m.text || JSON.stringify(m)];
                            }) : []
                    });
                } catch (e) {
                    console.error('Ошибка обработки чата:', e);
                }
            }
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
                        userProps.forEach(p => {
                            const [k, v] = p.split('=').map(x => x.trim());
                            user[k] = v.replace(/"/g, '');
                        });
                        chat[key] = user;
                    }
                } else {
                    chat[key] = val.replace(/"/g, '');
                }
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
            const response = await axios.post(`${main_part_link}api/v1/chats/new_chat`, {}, {
                headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            });
            const newChat = {
                id: response.data.chat_id,
                title: `Запрос #${chats.length + 1}`,
                messages: []
            };
            setChats([newChat, ...chats]);
            setActiveChat(newChat);
        } catch (err) {
            setError('Не удалось создать новый чат');
            console.error(err);
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        setIsSendingMessage(true);
        setError(null);
        try {
            const response = await axios.post(`${main_part_link}api/v1/chats/new_message`, {
                chat_id: activeChat.id,
                message
            }, {
                headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            });

            const updatedChats = chats.map(chat =>
                chat.id === activeChat.id
                    ? {
                        ...chat,
                        messages: [
                            ...chat.messages,
                            `🧑‍💬 Вопрос: ${message}`,
                            `🤖 Ответ: ${response.data.message_answer || 'Нет ответа'}`
                        ]
                    }
                    : chat
            );

            setChats(updatedChats);
            setActiveChat(updatedChats.find(chat => chat.id === activeChat.id));
            setMessage('');
        } catch (err) {
            setError('Не удалось отправить сообщение');
            console.error(err);
        } finally {
            setIsSendingMessage(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`d-flex vh-100 ${theme === 'dark' ? 'bg-black text-light' : 'bg-light text-dark'} position-relative`} style={{ overflowX: 'hidden', width: '100%' }}>
            {/* Левая панель */}
            <div className={`border-end d-flex flex-column p-3 ${theme === 'dark' ? 'bg-black border-secondary' : 'bg-white border-light'}`} style={{ width: '280px' }}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-stars text-primary fs-3 me-2"></i>
                        <h4 className="m-0 fw-bold">NVplans</h4>
                    </div>
                    <div className="position-relative" ref={menuRef}>
                        <div
                            className="small"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            {userName} <i className="bi bi-caret-down-fill ms-1"></i>
                        </div>
                        {showMenu && (
                            <div className={`position-absolute ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white border-light'} border rounded mt-2`} style={{ right: 0, zIndex: 10, minWidth: '150px' }}>
                                <div
                                    className="p-2"
                                    style={{ cursor: 'pointer' }}
                                    onClick={toggleTheme}
                                >
                                    {theme === 'dark' ? 'Светлая тема 🌞' : 'Тёмная тема 🌙'}
                                </div>
                                {localStorage.getItem('auth_token') ? (
                                    <div
                                        className="p-2"
                                        style={{ cursor: 'pointer' }}
                                        onClick={async () => {
                                            try {
                                                await logoutUser();
                                            } catch (err) {
                                                console.error(err);
                                            } finally {
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

            {/* Правая часть */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                <div className="flex-grow-1 d-flex flex-column p-4 overflow-auto">
                    {isLoadingChats ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : activeChat ? (
                        <div className="w-100">
                            {activeChat.messages.map((msg, idx) => {
                                const isAnswer = msg.startsWith('🤖 Ответ:');
                                const isQuestion = msg.startsWith('🧑‍💬 Вопрос:');

                                return (
                                    <div
                                        key={idx}
                                        className={`mb-2 p-3 rounded shadow-sm ${isAnswer ? 'bg-secondary text-white align-self-end' : theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark align-self-start'}`}
                                        style={{
                                            maxWidth: '80%',
                                            alignSelf: isAnswer ? 'flex-end' : 'flex-start',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        <strong>{isAnswer ? 'Ответ:' : isQuestion ? 'Вопрос:' : ''}</strong>{' '}
                                        {msg.replace(/^🧑‍💬 Вопрос:\s?|^🤖 Ответ:\s?/, '')}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center h-100">
                            <h1 className="mb-3 fw-bold text-center">Добро пожаловать в NVplans ✨</h1>
                            <p className="text-muted">Начните новый запрос</p>
                        </div>
                    )}
                </div>

                {/* Поле ввода */}
                {activeChat && (
                    <div
                        className={`d-flex flex-column align-items-center py-4 px-3 ${activeChat.messages.length === 0 ? 'position-absolute w-100' : theme === 'dark' ? 'border-top border-secondary' : 'border-top border-dark bg-light'}`}
                        style={{
                            bottom: activeChat.messages.length === 0 ? '50%' : '0',
                            transform: activeChat.messages.length === 0 ? 'translateY(50%)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {activeChat.messages.length === 0 && (
                            <div className="mb-3 fs-3 fw-semibold text-center">Чем я могу помочь?</div>
                        )}
                        <div className="input-group" style={{ width: '100%', maxWidth: '900px' }}>
                            <input
                                type="text"
                                className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-dark'} rounded-start-pill px-4 py-3`}
                                placeholder="Введите ваш запрос..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                style={{ fontSize: '1rem' }}
                            />
                            <button
                                className="btn rounded-end-pill px-4 btn-primary"

                                onClick={handleSendMessage}
                                disabled={isSendingMessage}
                            >
                                {isSendingMessage ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : 'Отправить'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Main;
