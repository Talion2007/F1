// src/pages/Forgot.jsx
import { useEffect } from 'react';
import ResetPassword from '../components/auth/ResetPassword.jsx'; // <-- Importe o componente ResetPassword
import "../styles/Auth.css"; // Seus estilos para Auth
import "../styles/Page.css"; // Seus estilos globais para a página

function Forgot() {
  useEffect(() => {
    document.title = "Redefinir Senha"; // Define o título da página
  }, []);

  return (
    <>
      <section className="auth-page"> {/* Use a mesma classe de seção do seu Login.jsx */}
        <ResetPassword /> {/* Renderiza o componente ResetPassword aqui */}
      </section>
    </>
  );
}

export default Forgot;