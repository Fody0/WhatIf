import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { loginUser, initialLoginData } from '../Network/User_api';
import { loginValidationSchema } from '../Network/Validation';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';

const clientId = '142264896052-489s9b70bks27578lq0lua635r90oj0g.apps.googleusercontent.com';
const main_part_link = 'http://localhost:8080/';

const LoginContent = () => {
    const [formData, setFormData] = useState(initialLoginData);
    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState(null); // Добавляем состояние для ошибки логина
    const navigate = useNavigate();

    useEffect(() => {
        document.body.className = 'bg-light text-dark';
    }, []);

    // Валидация формы
    const validate = async () => {
        try {
            await loginValidationSchema.validate(formData, { abortEarly: false });
            setErrors({});
            return true;
        } catch (err) {
            const formErrors = err.inner.reduce((acc, curr) => {
                acc[curr.path] = curr.message;
                return acc;
            }, {});
            setErrors(formErrors);
            return false;
        }
    };

    // Обычный логин по email/password
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null); // Сбрасываем предыдущую ошибку
        const isValid = await validate();
        if (isValid) {
            try {
                const data = await loginUser(formData);
                console.log('Логин успешен:', data);
                navigate('/'); // Редирект только при успешном логине
            } catch (error) {
                console.error('Ошибка при входе:', error);
                // Показываем пользователю ошибку
                setLoginError(
                    error.response?.data?.message || 'Неверный email или пароль'
                );
            }
        }
    };

    // Логин через Google
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            window.location.href = `${main_part_link}oauth2/authorization/google`;
        },
        onError: () => {
            setLoginError('Ошибка при входе через Google');
        },
    });

    return (
        <Container className="mt-5" style={{ maxWidth: '400px' }}>
            <h2 className="text-center mb-4">Вход</h2>

            {/* Показываем ошибку логина, если она есть */}
            {loginError && (
                <Alert variant="danger" onClose={() => setLoginError(null)} dismissible>
                    {loginError}
                </Alert>
            )}

            {/* Форма логина */}
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="Email"
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        value={formData.email}
                        isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.email}
                    </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Control
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                        value={formData.password}
                        isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.password}
                    </Form.Control.Feedback>
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mb-3">
                    Войти
                </Button>
            </Form>

            {/* Кнопка Google OAuth */}
            <div className="d-grid gap-2">
                <Button
                    variant="outline-danger"
                    onClick={() => handleGoogleLogin()}
                    className="w-100"
                >
                    Войти через Google
                </Button>
            </div>

            {/* Ссылка на регистрацию */}
            <div className="text-center mt-3">
                <Link to="/register" className="text-decoration-none">
                    Зарегистрироваться
                </Link>
            </div>
        </Container>
    );
};

// Обёртка с GoogleOAuthProvider
const Login = () => {
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <LoginContent />
        </GoogleOAuthProvider>
    );
};

export default Login;