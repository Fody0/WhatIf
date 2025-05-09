import React, { useState } from 'react';
import {Link, useNavigate} from "react-router-dom";
import { registerUser, initialRegisterData } from '../Network/User_api';
import { registerValidationSchema, checkPasswordStrength } from "../Network/Validation";
import { Form, Button, Container } from 'react-bootstrap';


const Register = () => {
    const [formData, setFormData] = useState(initialRegisterData);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState({
        level: 0,
        message: 'Слишком короткий',
        valid: false
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const validate = async () => {
        try {
            await registerValidationSchema.validate(formData, { abortEarly: false });
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

        const isValid = await validate();
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
                return 'danger'; // слабый
            case 3:
            case 4:
                return 'warning'; // средний
            case 5:
            case 6:
                return 'success'; // сильный
            default:
                return 'secondary';
        }
    };



    const getStrengthWidth = () => {
        const percent = Math.min((passwordStrength.level / 6) * 100, 100);
        return `${percent}%`;
    };

    return (
        <>

            <Container className="mt-5" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4">Регистрация</h2>
                {errors.submit}
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
                            type="text"
                            name="surname"
                            placeholder="Фамилия"
                            onChange={handleChange}
                            value={formData.surname}
                            isInvalid={!!errors.surname}
                        />
                        <Form.Control.Feedback type="invalid">{errors.surname}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            name="middle_name"
                            placeholder="Отчество"
                            onChange={handleChange}
                            value={formData.middle_name}
                            isInvalid={!!errors.middle_name}
                        />
                        <Form.Control.Feedback type="invalid">{errors.middle_name}</Form.Control.Feedback>
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

                        {formData.password && (
                            <div className="mt-2">
                                <div className="progress" style={{ height: '5px' }}>
                                    <div
                                        className={`progress-bar bg-${getStrengthColor()}`}
                                        style={{ width: getStrengthWidth() }}
                                    ></div>
                                </div>
                                <small className={`text-${getStrengthColor()}`}>
                                    {passwordStrength.message}
                                    {passwordStrength.level <= 2 && ' - добавьте заглавные буквы, цифры и спецсимволы'}
                                </small>
                            </div>
                        )}
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
                    <div className="text-center">

                        <Link to="/login" className="text-decoration-none">
                            Войти
                        </Link>
                    </div>
                </Form>
            </Container>
        </>
    );
};

export default Register;
