import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/Main/Main'
import Admin from './components/Admin/Admin';
import Register from './components/Auth/Register';
import Login from "./components/Auth/Login";
import OAuthRedirectHandler from "./components/Auth/OAuthRedirectHandler";

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
            <Route path="/oauth2/redirect" element={<OAuthRedirectHandler />} />

        </Routes>
      </Router>
  );
}
export default App;
