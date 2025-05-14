import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'; // OAuth2 для Google
import { loginUser, initialLoginData } from '../Network/User_api';
import { loginValidationSchema } from '../Network/Validation';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container } from 'react-bootstrap';
import axios from 'axios';

const clientId = '142264896052-489s9b70bks27578lq0lua635r90oj0g.apps.googleusercontent.com';
const main_part_link = 'http://localhost:8080/';

const LoginContent = () => {
    const [formData, setFormData] = useState(initialLoginData);
    const [errors, setErrors] = useState({});
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
        const isValid = await validate();
        if (isValid) {
            try {
                const data = await loginUser(formData);
                console.log('Логин успешен:', data);
                navigate('/');
            } catch (error) {
                console.error('Ошибка при входе:', error);
            }
        }
    };

    // Логин через Google
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // console.log('Google token:', tokenResponse);
            window.location.href = `${main_part_link}oauth2/authorization/google`;


            // Отправляем id_token на ваш backend
        //     try {
        //         // const res = "";
        //         const res = await axios.get(`${main_part_link}oauth2/authorization/google`, {
        //             headers: {
        //                 'Content-Type': 'application/json',
        //             },
        //         });
        //
        //         const data = res.data;
        //
        //         if (res.status >= 200 && res.status < 300) {
        //             localStorage.setItem('access_token', data.accessToken);
        //             navigate('/');
        //             console.log('success');
        //         } else {
        //             console.error('Ошибка авторизации через Google');
        //         }
        //         console.log(res);
        //     } catch (err) {
        //         console.error('Ошибка запроса на сервер:', err);
        //     }
        //             },
        // onError: (err) => {
        //     console.error('Ошибка входа через Google:', err);
        },
    });

    return (
        <>
            <Container className="mt-5" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4">Вход</h2>

                {/* Форма логина */}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder="Email"
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    <Button variant="outline-danger" onClick={() => handleGoogleLogin()} className="w-100">
                        Войти через Google
                    </Button>
                </div>

                {/* Ссылка на главную */}
                <div className="text-center mt-3">
                    <Link to="/register" className="text-decoration-none">
                        На регистрацию
                    </Link>
                </div>
            </Container>
        </>
    );
};

// Обёртка с GoogleOAuthProvider
const Login = () => {
    return (
        <GoogleOAuthProvider clientId="142264896052-489s9b70bks27578lq0lua635r90oj0g.apps.googleusercontent.com">
            <LoginContent />
        </GoogleOAuthProvider>
    );
};

export default Login;