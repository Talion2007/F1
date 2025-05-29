import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Home from './pages/Home';
import Drivers from './pages/Drivers';
import Sprints from './pages/Sprints';
import Pratices from './pages/Pratices';
import Qualifying from './pages/Qualify';
import Contact from './pages/Contact';

// Importe a nova página de autenticação
import AuthPage from './pages/AuthPage.jsx'; // Certifique-se de usar .jsx

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
            {/* Nova rota para a página de autenticação */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/sprints" element={<Sprints />} />
            <Route path="/pratices" element={<Pratices />} />
            <Route path="/qualifying" element={<Qualifying />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;