import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthRedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        const email = queryParams.get('email');
        const name = queryParams.get('name');
        const surname = queryParams.get('surname');
        const middle_name = queryParams.get('middle_name');

        console.log('Redirect token:', token);

        if (token) {
            localStorage.setItem('auth_token', token);
            if (email) localStorage.setItem('email', email);
            if (name) localStorage.setItem('name', name);
            if (surname) localStorage.setItem('surname', surname);
            if (middle_name) localStorage.setItem('middle_name', middle_name);

            console.log('Redirecting to home...');
            navigate('/');
        } else {
            console.error('Token not found in URL');
            navigate('/login');
        }
    }, [location, navigate]);
}

    export default OAuthRedirectHandler;
