import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, initialLoginData, getAuthToken, isTokenExpired } from '../Network/User_api';
import { loginValidationSchema } from '../Network/Validation';
import { Form, Button, Container, Alert } from 'react-bootstrap';

const LoginContent = () => {
    const [formData, setFormData] = useState(initialLoginData);
    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.className = 'bg-light text-dark';
        const token = getAuthToken();
        if (token && !isTokenExpired(token)) {
            navigate('/'); // Перенаправляем на главную, если токен валиден
        }
    }, [navigate]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        const isValid = await validate();
        if (isValid) {
            try {
                const data = await loginUser(formData);
                console.log('Логин успешен:', data);
                navigate('/');
            } catch (error) {
                console.error('Ошибка при входе:', error);
                setLoginError(
                    error.response?.data?.message || 'Неверный email или пароль'
                );
            }
        }
    };

    return (
        <Container className="mt-5" style={{ maxWidth: '400px' }}>
            <h2 className="text-center mb-4">Вход</h2>
            {loginError && (
                <Alert variant="danger" onClose={() => setLoginError(null)} dismissible>
                    {loginError}
                </Alert>
            )}
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
            <div className="text-center mt-3">
                <Link to="/register" className="text-decoration-none">
                    Зарегистрироваться
                </Link>
            </div>
        </Container>
    );
};

const Login = () => {
    return <LoginContent />;
};

export default Login;