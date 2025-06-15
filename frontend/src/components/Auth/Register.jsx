import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { registerUser, initialRegisterData, getAuthToken, isTokenExpired } from '../Network/User_api';
import { Form, Button, Container } from 'react-bootstrap';
import { checkPasswordStrength } from "../Network/Validation";

const Register = () => {
    const [formData, setFormData] = useState(initialRegisterData);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState({
        level: 0,
        message: 'Слишком короткий',
        valid: false
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = getAuthToken();
        if (token && !isTokenExpired(token)) {
            navigate('/'); // Перенаправляем на главную, если токен валиден
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (formData.password.length < 6) {
            newErrors.password = 'Пароль должен содержать не менее 6 символов';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = validate();
        if (!isValid) return;

        const { confirmPassword, ...dataToSend } = formData;

        try {
            const data = await registerUser(dataToSend);
            console.log('Регистрация успешна:', data);
            navigate('/');
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            setErrors({ submit: error.response?.data?.message || 'Ошибка при регистрации' });
        }
    };

    const getStrengthColor = () => {
        if (!formData.password) return 'secondary';
        switch (passwordStrength.level) {
            case 0:
            case 1:
            case 2:
                return 'danger';
            case 3:
            case 4:
                return 'warning';
            case 5:
            case 6:
                return 'success';
            default:
                return 'secondary';
        }
    };

    return (
        <Container className="mt-5" style={{ maxWidth: '400px' }}>
            <h2 className="text-center mb-4">Регистрация</h2>
            {errors.submit && <div className="alert alert-danger">{errors.submit}</div>}
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="text"
                        name="name"
                        placeholder="Имя"
                        onChange={handleChange}
                        value={formData.name}
                        isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                        value={formData.email}
                        isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        onChange={handleChange}
                        value={formData.password}
                        isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="password"
                        name="confirmPassword"
                        placeholder="Повторите пароль"
                        onChange={handleChange}
                        value={formData.confirmPassword}
                        isInvalid={!!errors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100">
                    Зарегистрироваться
                </Button>
                <div className="text-center mt-3">
                    <Link to="/login" className="text-decoration-none">
                        Войти
                    </Link>
                </div>
            </Form>
        </Container>
    );
};

export default Register;