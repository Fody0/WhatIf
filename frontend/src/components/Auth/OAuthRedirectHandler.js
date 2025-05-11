import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthRedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');

        if (token) {
            localStorage.setItem('auth_token', token);
            navigate('/');
        } else {
            console.error('Token not found in URL');
            navigate('/login');
        }
    }, [location, navigate]);

    return <div>Processing login...</div>;
};

export default OAuthRedirectHandler;