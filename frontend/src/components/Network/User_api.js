import axios from 'axios';

export const initialRegisterData = {
    name: '',
    surname: '',
    middle_name: '',
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
        window.localStorage.setItem('surname', response.data.surname);
        window.localStorage.setItem('middle_name', response.data.middle_name);
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
        window.localStorage.setItem('surname', response.data.surname);
        window.localStorage.setItem('middle_name', response.data.middle_name);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка при входе:', error);
        throw error;
    }


};
export const forgotPassword = async (email) => {
    try {
        const response = await axios.post('/api/v1', { email },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        return response.data;
    } catch (error) {
        console.error('Ошибка при отправке письма для сброса пароля:', error);
        throw error;
    }
};
export const logoutUser = async () => {
    try {
        /*  var header;
          if(getAuthToken() == null) header = "null";
          else header = "Bearer ".concat(getAuthToken());
          console.log('Logging out...');
          const response = await axios.post(`${main_part_link}/api/v1/Users/logout`, {}, {
              headers: {
                  "Authorization": header,
              },

          });*/
        /*return response.data;*/


        setAuthToken('');
        localStorage.clear();


    } catch (error) {
        console.error('Ошибка при выходе из системы:', error);
        throw error;
    }
};

export const fetchPersonalData = async () => {
    try {
        const response = await axios.get(
            `${main_part_link}api/v1/auth/register_personal`,
            {
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            }
        );

        const data = typeof response.data === 'object' ? response.data : {};
        if (data.passport) {
            data.passport = parsePassport(data.passport);
        } else {
            data.passport = "";
        }

        return data;
    } catch (error) {
        console.error('Ошибка при получении персональных данных:', error);
        throw error;
    }
};
const parsePassport = (passport) => {
    if (!passport) return "";

    passport = passport.toString();
    let parsed_passport = "";

    for (let i = 0; i < 4 && i < passport.length; i++) {
        parsed_passport += passport[i];
    }
    parsed_passport += " ";

    for (let i = 4; i < 10 && i < passport.length; i++) {
        parsed_passport += passport[i];
    }

    return parsed_passport;
}
export const savePersonalData = async (formData) => {
    try {
        const cleanValue = (value) => value.replace(/[^0-9]/g, '');
        const personalData = {
            snils: formData.snils,
            insurancePolicy: cleanValue(formData.insurancePolicy),
            passport: cleanValue(formData.passport)
        };


        const response = await axios.post(
            `${main_part_link}api/v1/auth/register_personal`,
            personalData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Ошибка при сохранении персональных данных:', error);
        throw error;
    }
};

