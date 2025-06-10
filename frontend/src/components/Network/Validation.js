import * as Yup from 'yup';


export const checkPasswordStrength = (password) => {
    if (!password) return { level: 0, message: 'Слишком короткий', valid: false };

    const hasLowercase = /[a-zа-я]/.test(password);
    const hasUppercase = /[A-ZА-Я]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 10;
    const isVeryLong = password.length >= 14;

    let strength = 0;

    if (password.length < 8) return { level: 0, message: 'Слишком короткий', valid: false };

    if (hasLowercase) strength++;
    if (hasUppercase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;
    if (isLongEnough) strength++;
    if (isVeryLong) strength++;

    let message = 'Слабый';
    if (strength >= 6) message = 'Сильный';
    else if (strength >= 4) message = 'Средний';

    const valid = strength >= 4; // средний и выше

    return { level: strength, message, valid };
};


export const registerValidationSchema = Yup.object({
    name: Yup.string()
        .min(2, 'Имя должно содержать минимум 2 символа')
        .required('Имя обязательно'),
    // surname: Yup.string()
    //     .min(2, 'Фамилия должна содержать минимум 2 символа')
    //     .required('Фамилия обязательна'),
    email: Yup.string()
        .email('Некорректный формат email')
        .required('Email обязателен'),
    password: Yup.string()
        .required('Пароль обязателен')
        .test('password-strength', 'Пароль слишком слабый', (value) => {
            const result = checkPasswordStrength(value || '');
            return result.valid;
        }),

    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Пароли должны совпадать')
        .required('Подтверждение пароля обязательно')
});

export const loginValidationSchema = Yup.object({
    email: Yup.string()
        .email('Некорректный формат email')
        .required('Email обязателен'),

    password: Yup.string()
        .min(6, 'Пароль должен содержать минимум 6 символов')
        .required('Пароль обязателен'),
});
