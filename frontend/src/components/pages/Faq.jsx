import React, { useState, useEffect } from 'react';
import { Container, Accordion, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const FAQ = () => {
    const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark'));
    const navigate = useNavigate();

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.className = theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark';
        }
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
        }
    };

    return (
        <Container className={`vh-100 d-flex flex-column py-5 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
            <h1 className="text-center mb-4" style={{ fontSize: '2rem', fontWeight: '600' }}>Часто задаваемые вопросы</h1>
            <Accordion className={theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Что такое WhatIf?</Accordion.Header>
                    <Accordion.Body>
                        WhatIf — это платформа для взаимодействия с искусственным интеллектом. Основной задачей приложения является онлайн моделирование вариантов развития истории нашей страны.
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                    <Accordion.Header>Как зарегистрироваться?</Accordion.Header>
                    <Accordion.Body>
                        Перейдите на страницу регистрации, введите имя, email и пароль.
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                    <Accordion.Header>Как сменить тему?</Accordion.Header>
                    <Accordion.Body>
                        Нажмите на своё имя в левом верхнем углу на главной странице и выберите опцию смены темы (светлая/тёмная).
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                    <Accordion.Header>Куда обратиться за поддержкой?</Accordion.Header>
                    <Accordion.Body>
                        Свяжитесь с нами через страницу "Контакты" или отправьте письмо на support@whatif.com.
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            <div className="text-center mt-4">
                <Button
                    variant="primary"
                    className="me-3"
                    onClick={() => navigate('/')}
                >
                    Вернуться на главную
                </Button>

            </div>
        </Container>
    );
};

export default FAQ;