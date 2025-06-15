import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/Main/Main'
import Admin from './components/Admin/Admin';
import Register from './components/Auth/Register';
import Login from "./components/Auth/Login";
import OAuthRedirectHandler from "./components/Auth/OAuthRedirectHandler";
import Contacts from './components/pages/Contacts';
import Faq from './components/pages/Faq';
import {isTokenExpired,getAuthToken} from "./components/Network/User_api";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";

const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const token = getAuthToken();

    useEffect(() => {
        if (!token || isTokenExpired(token)) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('name');
            localStorage.removeItem('email');
            navigate('/login');
        }
    }, [token, navigate]);

    return token && !isTokenExpired(token) ? children : null;
};

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/oauth2/redirect" element={<OAuthRedirectHandler />} />
            <Route path="/" element={<ProtectedRoute><Main /></ProtectedRoute>}/>
        </Routes>
      </Router>
  );
}
export default App;
