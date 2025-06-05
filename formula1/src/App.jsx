import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import Home from './pages/Home';
import Drivers from './pages/Drivers';

import Practices from './pages/Pratices.jsx';
import Sprints from './pages/Sprints.jsx';
import Qualifying from './pages/Qualifying.jsx';
import Races from './pages/Races.jsx';

import Contact from './pages/Contact';
import ChatScreen from './pages/Chat.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/Forgot.jsx';

import './App.css';

// Importe o AuthProvider
import { AuthProvider } from './context/AuthContext.jsx'; // Ajuste o caminho se necessário

function App() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/drivers" element={<Drivers />} />

            <Route path="/pratices" element={<Practices />} />
            <Route path="/sprints" element={<Sprints />} />
            <Route path="/qualifying" element={<Qualifying />} />
            <Route path="/races" element={<Races />} />

            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;