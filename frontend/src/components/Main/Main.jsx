import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Main = () => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [error, setError] = useState(null);
    const userName = 'Гость';
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const main_part_link = 'http://localhost:8080/';

    const getAuthToken = () => {
        return window.localStorage.getItem('auth_token');
    };

    const fetchAllChats = async () => {
        setIsLoadingChats(true);
        try {
            const token = getAuthToken();
            console.log('Токен:', token); // Логируем токен для отладки
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.post(`${main_part_link}api/v1/chats/all_chats`, {}, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            console.log('Полный ответ сервера:', response); // Логируем весь ответ
            // Проверяем наличие данных
            if (!response.data || !response.data.chats_with_messages) {
                throw new Error('Некорректный формат ответа от сервера');
            }
            // Преобразуем данные с сервера
            const chatsMap = response.data.chats_with_messages;
            const loadedChats = [];
            // Перебираем записи в Map
            for (const [chatEntity, messages] of Object.entries(chatsMap)) {
                try {
                    // Добавляем проверку на валидность JSON строки
                    let chat;
                    if (typeof chatEntity === 'string') {
                        try {
                            // Попытка парсинга JSON строки
                            chat = JSON.parse(chatEntity);
                        } catch (parseErr) {
                            console.error('Ошибка парсинга JSON:', parseErr);
                            // Преобразуем строковое представление в JSON объект
                            chat = parseChatEntity(chatEntity);
                        }
                    } else {
                        chat = chatEntity;
                    }
                    loadedChats.push({
                        id: chat.id,
                        title: chat.title || `Запрос #${chat.id}`,
                        messages: Array.isArray(messages)
                            ? messages.map(m => m.content || m.text || JSON.stringify(m))
                            : []
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
            console.error('Подробная ошибка:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                config: err.config
            });
            setError('Ошибка загрузки чатов. Проверьте консоль для деталей.');
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                navigate('/login');
            }
        } finally {
            setIsLoadingChats(false);
        }
    };

    // Функция для преобразования строкового представления в JSON объект
    const parseChatEntity = (entity) => {
        // Пример преобразования строки в JSON объект
        // Предполагается, что строка имеет формат: ChatEntity(id=8, user=User(id=1, name=qwerty, ...)
        const regex = /ChatEntity\((.*?)\)/;
        const match = entity.match(regex);
        if (match && match[1]) {
            const properties = match[1].split(',').map(prop => prop.trim());
            const chat = {};
            properties.forEach(prop => {
                const [key, value] = prop.split('=').map(part => part.trim());
                if (key === 'user') {
                    // Преобразуем строку пользователя в JSON объект
                    const userRegex = /User\((.*?)\)/;
                    const userMatch = value.match(userRegex);
                    if (userMatch && userMatch[1]) {
                        const userProperties = userMatch[1].split(',').map(userProp => userProp.trim());
                        const user = {};
                        userProperties.forEach(userProp => {
                            const [userKey, userValue] = userProp.split('=').map(userPart => userPart.trim());
                            user[userKey] = userValue.replace(/"/g, '');
                        });
                        chat[key] = user;
                    }
                } else {
                    chat[key] = value.replace(/"/g, '');
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
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${main_part_link}api/v1/chats/new_chat`, {}, {
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
            const newChat = {
                id: response.data.chat_id,
                title: `Запрос #${chats.length + 1}`,
                messages: []
            };
            console.log(newChat);
            setChats([newChat, ...chats]);
            setActiveChat(newChat);
        } catch (err) {
            setError('Не удалось создать новый чат');
            console.error('Ошибка при создании чата:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${main_part_link}api/v1/chats/new_message`, {
                chat_id: activeChat.id,
                message: message
            }, {
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });

            console.log(response.data);

            const updatedChats = chats.map(chat => {
                if (chat.id === activeChat.id) {
                    return {
                        ...chat,
                        messages: [...chat.messages, message, response.data.message_answer]
                    };
                }
                return chat;
            });

            setChats(updatedChats);
            setActiveChat(updatedChats.find(chat => chat.id === activeChat.id));
            setMessage('');
        } catch (err) {
            setError('Не удалось отправить сообщение');
            console.error('Ошибка при отправке сообщения:', err);
        } finally {
            setIsLoading(false);
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
        <div className="d-flex vh-100 bg-black text-light position-relative" style={{ overflowX: 'hidden', width: '100%' }}>
            {/* Левая панель */}
            <div className="border-end border-secondary d-flex flex-column p-3 bg-black" style={{ width: '280px' }}>
                {/* Логотип и пользователь */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-stars text-primary fs-3 me-2"></i>
                        <h4 className="m-0 fw-bold">NVplans</h4>
                    </div>
                    <div className="position-relative" ref={menuRef}>
                        <div
                            className="text-light small cursor-pointer"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            {userName} <i className="bi bi-caret-down-fill ms-1"></i>
                        </div>
                        {showMenu && (
                            <div
                                className="position-absolute bg-dark border border-secondary rounded mt-2"
                                style={{ right: 0, zIndex: 10, minWidth: '150px' }}
                            >
                                <div
                                    className="p-2 text-white border-bottom border-secondary"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate('/admin')}
                                >
                                    Админ панель
                                </div>
                                <div className="p-2 text-white border-bottom border-secondary"
                                     style={{ cursor: 'pointer' }}
                                     onClick={() => navigate('/login')}>
                                    Войти
                                </div>
                                <div className="p-2 text-white" style={{ cursor: 'pointer' }}>
                                    Выйти
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Кнопка новый чат */}
                <button
                    className="btn w-100 mb-3 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: '#6c8cff', color: 'white', border: 'none' }}
                    onClick={handleNewChat}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Создание...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-plus-circle me-2"></i> Новый чат
                        </>
                    )}
                </button>
                {/* Сообщение об ошибке */}
                {error && (
                    <div className="alert alert-danger p-2 mb-3">
                        {error}
                    </div>
                )}
                {/* Список чатов */}
                <div className="flex-grow-1 overflow-auto">
                    {isLoadingChats ? (
                        <div className="text-center mt-3">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                        </div>
                    ) : chats.length > 0 ? (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                className={`p-2 mb-2 rounded ${activeChat?.id === chat.id ? 'bg-white text-dark' : 'bg-dark text-light'}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => setActiveChat(chat)}
                            >
                                {chat.title}
                            </div>
                        ))
                    ) : (
                        <div className="text-white">Нет активных чатов</div>
                    )}
                </div>
            </div>
            {/* Правая часть */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                {/* Содержимое чата */}
                <div className="flex-grow-1 d-flex flex-column p-4 overflow-auto">
                    {isLoadingChats ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                        </div>
                    ) : activeChat ? (
                        <div className="w-100">
                            {activeChat.messages.map((msg, idx) => (
                                <div key={idx} className="mb-2 p-3 bg-dark rounded shadow-sm">
                                    {msg}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center h-100">
                            <h1 className="mb-3 fw-bold text-light text-center">Добро пожаловать в NVplans ✨</h1>
                            <p className="text-muted">Начните новый запрос</p>
                        </div>
                    )}
                </div>
                {/* Поле ввода */}
                {activeChat && (
                    <div
                        className={`bg-black d-flex flex-column align-items-center py-4 px-3 ${
                            activeChat.messages.length === 0 ? 'position-absolute w-100' : 'border-top border-secondary'
                        }`}
                        style={{
                            bottom: activeChat.messages.length === 0 ? '50%' : '0',
                            transform: activeChat.messages.length === 0 ? 'translateY(50%)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {activeChat.messages.length === 0 && (
                            <div className="mb-3 text-white fs-3 fw-semibold text-center">Чем я могу помочь?</div>
                        )}
                        <div className="input-group" style={{ width: '100%', maxWidth: '900px' }}>
                            <input
                                type="text"
                                className="form-control bg-dark text-white border border-secondary rounded-start-pill px-4 py-3"
                                placeholder="Введите ваш запрос..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSendMessage();
                                }}
                                style={{ fontSize: '1rem' }}
                            />
                            <button
                                className="btn rounded-end-pill px-4"
                                style={{ backgroundColor: '#6c8cff', color: 'white', border: 'none' }}
                                onClick={handleSendMessage}
                            >
                                Отправить
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Main;