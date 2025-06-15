import axios from 'axios';

export const initialRegisterData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
};

export const initialLoginData = {
    email: '',
    password: ''
};

export const getAuthToken = () => {
    return window.localStorage.getItem('auth_token');
}

export const setAuthToken = (token) => {
    window.localStorage.setItem('auth_token', token);
}


const main_part_link = 'http://localhost:8080/';

export const registerUser = async (formData) => {
    try {
        console.log(formData);
        var header;
        if(getAuthToken() == null) header = "null";
        else header = "Bearer ".concat(getAuthToken());
        console.log(header);
        const response = await axios.post(`${main_part_link}api/v1/auth/register`, formData, {
            headers: {
                'Content-Type': 'application/json',

            },

        });
        setAuthToken(response.data.token);
        window.localStorage.setItem('name', response.data.name);
        window.localStorage.setItem('email', response.data.email);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        throw error;
    }
};

export const loginUser = async (formData) => {
    try {
        console.log(formData);
        var header;
        if(getAuthToken() == null) header = "null";
        else header = "Bearer ".concat(getAuthToken());
        const response = await axios.post(`${main_part_link}api/v1/auth/authenticate`, formData, {
            headers: {
                'Content-Type': 'application/json',
            },

        });

        setAuthToken(response.data.token);
        window.localStorage.setItem('name', response.data.name);
        window.localStorage.setItem('email', response.data.email);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка при входе:', error);
        throw error;
    }


};

export const logoutUser = async () => {
    try {
        setAuthToken('');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('name');
        localStorage.removeItem('email');
    } catch (error) {
        console.error('Ошибка при выходе из системы:', error);
        throw error;
    }
};
export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return decoded.exp * 1000 < Date.now();
    } catch (e) {
        console.error('Ошибка декодирования токена:', e);
        return true; // Считаем токен недействительным при ошибке
    }
};


