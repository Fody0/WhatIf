import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logoutUser } from "../Network/User_api";

const Main = () => {
    // Состояния компонента
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState('Гость');
    const [theme, setTheme] = useState(() => {
        // Безопасное получение темы из localStorage
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    const menuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const main_part_link = 'http://localhost:8080/';

    // Эффекты
    useEffect(() => {
        const email = localStorage.getItem('name');
        if (email) setUserName(email);
    }, []);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.className = theme === 'dark' ? 'bg-black text-light' : 'bg-light text-dark';
        }
    }, [theme]);

    useEffect(() => {
        // Прокрутка вниз при изменении сообщений
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages]);

    // Функции
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
        }
    };

    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    };

    const fetchAllChats = async () => {
        setIsLoadingChats(true);
        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.post(`${main_part_link}api/v1/chats/all_chats`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const chatsMap = response.data.chats_with_messages || {};
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

                    if (!chat || !chat.id) continue;

                    loadedChats.push({
                        id: chat.id,
                        title: chat.title || `Запрос #${chat.id}`,
                        messages: Array.isArray(messages)
                            ? messages.flatMap(m => {
                                if (typeof m === 'string') return [{ type: 'text', content: m }];
                                if (m.message_question && m.message_answer) {
                                    return [
                                        { type: 'question', content: m.message_question },
                                        { type: 'answer', content: m.message_answer }
                                    ];
                                }
                                return [{ type: 'text', content: m.content || m.text || JSON.stringify(m) }];
                            }) : []
                    });
                } catch (e) {
                    console.error('Ошибка обработки чата:', e);
                }
            }

            setChats(loadedChats);
            if (loadedChats.length > 0) {
                setActiveChat(loadedChats[0]);
            }
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
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
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
        if (!message.trim() || !activeChat?.id) return;

        setIsSendingMessage(true);
        setError(null);

        try {
            const response = await axios.post(`${main_part_link}api/v1/chats/new_message`, {
                chat_id: activeChat.id,
                message
            }, {
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });

            const updatedChats = chats.map(chat =>
                chat.id === activeChat.id
                    ? {
                        ...chat,
                        messages: [
                            ...chat.messages,
                            { type: 'question', content: message },
                            { type: 'answer', content: response.data.message_answer || 'Нет ответа' }
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

    // Рендер компонента
    return (
        <div
            className={`d-flex vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} position-relative`}
            style={{ overflowX: 'hidden', width: '100%' }}>

            {/* Левая панель - исправленная версия */}
            <div
                className={`border-end d-flex flex-column p-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}
                style={{ width: '280px' }}> {/* ✅ Правильное расположение style */}

                {/* Заголовок и меню пользователя */}
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
                            <div className={`position-absolute ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white border-light'} border rounded mt-2`}
                                 style={{ right: 0, zIndex: 10, minWidth: '150px' }}>
                                <div className="p-2" style={{ cursor: 'pointer' }} onClick={toggleTheme}>
                                    {theme === 'dark' ? 'Светлая тема 🌞' : 'Тёмная тема 🌙'}
                                </div>
                                {getAuthToken() ? (
                                    <div className="p-2" style={{ cursor: 'pointer' }} onClick={async () => {
                                        try {
                                            await logoutUser();
                                        } catch (err) {
                                            console.error(err);
                                        } finally {
                                            localStorage.removeItem('auth_token');
                                            navigate('/login');
                                        }
                                    }}>
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

                {/* Кнопка нового чата */}
                <button className="btn w-100 mb-3 d-flex align-items-center justify-content-center btn-primary"
                        onClick={handleNewChat}
                        disabled={isCreatingChat}>
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

                {/* Список чатов */}
                <div className="flex-grow-1 overflow-auto">
                    {isLoadingChats ? (
                        <div className="text-center mt-3">
                            <div className="spinner-border text-primary" role="status"></div>
                        </div>
                    ) : chats.length > 0 ? (
                        chats.map(chat => (
                            <div key={chat.id}
                                 className={`p-2 mb-2 rounded ${activeChat?.id === chat.id
                                     ? theme === 'dark'
                                         ? 'bg-white text-dark'
                                         : 'bg-dark text-light'
                                     : theme === 'dark'
                                         ? 'bg-dark text-light'
                                         : 'bg-light text-dark'
                                 }`}
                                 style={{ cursor: 'pointer' }}
                                 onClick={() => setActiveChat(chat)}>
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
                            {activeChat.messages.map((msg, idx) => {
                                const isAnswer = msg.type === 'answer';
                                const isQuestion = msg.type === 'question';


                                return (
                                    <div key={idx} className={`mb-4 ${isQuestion ? 'd-flex justify-content-end' : 'd-flex justify-content-start'}`}>
                                        <div className={`p-3 ${isQuestion
                                            ? theme === 'dark'
                                                ? 'bg-primary text-white'
                                                : 'bg-primary text-white'
                                            : theme === 'dark'
                                                ? 'bg-secondary text-light'
                                                : 'bg-light text-dark border'
                                        }`}
                                             style={{
                                                 maxWidth: '80%',
                                                 borderRadius: isQuestion
                                                     ? '28px 28px 6px 28px'  // Умеренное скругление + острый угол слева внизу
                                                     : '28px 28px 28px 6px',  // Умеренное скругление + острый угол справа внизу
                                                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                 overflow: 'hidden'
                                             }}>
                                            {isQuestion && (
                                                <div className="d-flex align-items-center mb-2 justify-content-end">
                                                    <small className="text-muted me-2">Вы</small>
                                                    <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center"
                                                         style={{ width: '28px', height: '28px' }}>
                                                        <i className="bi bi-person-fill" style={{ fontSize: '12px' }}></i>
                                                    </div>
                                                </div>
                                            )}
                                            {isAnswer && (
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                                                         style={{ width: '28px', height: '28px', marginRight: '8px' }}>
                                                        <i className="bi bi-robot" style={{ fontSize: '12px' }}></i>
                                                    </div>
                                                    <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>WhatIF</small>
                                                </div>
                                            )}
                                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center h-100">
                            <h1 className="mb-3 fw-bold text-center">Добро пожаловать в NVplans ✨</h1>
                            <p className="text-muted">Начните новый запрос</p>
                        </div>
                    )}
                </div>

                {/* Поле ввода сообщения */}
                {activeChat && (
                    <div
                        className={`d-flex flex-column align-items-center py-4 px-3 ${activeChat.messages.length === 0 ? 'position-absolute w-100' : theme === 'dark' ? 'border-top border-secondary' : 'border-top border-dark bg-light'}`}
                        style={{
                            bottom: activeChat.messages.length === 0 ? '50%' : '0',
                            left: activeChat.messages.length === 0 ? '59%' : '0',
                            transform: activeChat.messages.length === 0 ? 'translate(-50%, 50%)' : 'none',
                            width: activeChat.messages.length === 0 ? 'auto' : '100%',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {activeChat.messages.length === 0 && (
                            <div className="mb-3 fs-3 fw-semibold text-center">Чем я могу помочь?</div>
                        )}
                        <div className="input-group" style={{ width: '100%', maxWidth: '900px' }}>
                            <input
                                type="text"
                                className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-dark'} rounded-pill px-4 py-3`}
                                placeholder="Введите ваш запрос..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                style={{
                                    fontSize: '1rem',
                                    paddingRight: '50px' // Добавляем отступ справа для кнопки
                                }}
                            />
                            <button
                                className="btn btn-primary rounded-circle p-2 position-absolute"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 5
                                }}
                                onClick={handleSendMessage}
                                disabled={isSendingMessage}
                            >
                                {isSendingMessage ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <i className="bi bi-arrow-up"></i>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Main;