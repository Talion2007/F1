import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Home from './pages/Home';
import Drivers from './pages/Drivers';
import Pratices from './pages/Sprints&Pratices.jsx';
import Qualifying from './pages/Races&Qualify.jsx';
import Contact from './pages/Contact';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/Forgot.jsx';
import ChatScreen from './pages/Chat.jsx';

import './App.css';

// Importe o AuthProvider
import { AuthProvider } from './context/AuthContext.jsx'; // Ajuste o caminho se necessário

function App() {
  return (
    <>
      <Analytics/>
      <SpeedInsights/>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/chat" element={<ChatScreen />} />
          
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/sprints&pratices" element={<Pratices />} />
            <Route path="/races&qualifying" element={<Qualifying />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;