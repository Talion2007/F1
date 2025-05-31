// src/pages/Forgot.jsx
import { useEffect } from 'react';
import ResetPassword from '../components/auth/ResetPassword.jsx';
import "../styles/Auth.css";
import "../styles/Page.css";

function Forgot() {
  useEffect(() => {
    // --- SEO: Gerenciamento do Título da Página ---
    document.title = "Redefinir Senha | F1 Dashboard"; // Título já estava em PT-BR, adicionei um complemento

    // --- SEO: Gerenciamento da Meta Descrição ---
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Página para redefinir sua senha de acesso ao F1 Dashboard. Insira seu e-mail para receber as instruções de recuperação.";

    return () => {
      // Limpeza: Remove a meta tag ao desmontar o componente
      if (metaDescription && metaDescription.parentNode) {
        metaDescription.parentNode.removeChild(metaDescription);
      }
    };
  }, []); // Sem dependências, pois o conteúdo é estático para esta página

  return (
    <>
      <section className="auth-page">
        <ResetPassword />
      </section>
    </>
  );
}

export default Forgot;