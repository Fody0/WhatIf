import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Contacts = () => {
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
        <Container className={`vh-100 d-flex flex-column justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
            <div className="text-center" style={{ maxWidth: '600px' }}>
                <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: '600' }}>Контакты</h1>
                <p style={{ lineHeight: '1.5', fontSize: '1.1rem' }}>
                    Свяжитесь с нами для получения дополнительной информации или поддержки.
                </p>
                <p>
                    <i className="bi bi-envelope-fill me-2"></i>
                    Email: <a href="mailto:support@whatif.com">support@whatif.com</a>
                </p>


                <Button
                    variant="primary"
                    className="mt-3"
                    onClick={() => navigate('/')}
                >
                    Вернуться на главную
                </Button>

            </div>
        </Container>
    );
};

export default Contacts;