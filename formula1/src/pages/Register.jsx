import { useEffect } from 'react';
import SignUp from '../components/auth/SignUp.jsx';
import "../styles/Auth.css"
import "../styles/Page.css";

function Register() {
  useEffect(() => {
    // --- SEO: Gerenciamento do Título da Página ---
    document.title = "Registrar | Crie sua Conta F1 Dashboard"; // Título mais descritivo

    // --- SEO: Gerenciamento da Meta Descrição ---
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Crie sua conta gratuita no F1 Dashboard para ter acesso exclusivo a resultados, análises e a comunidade de fãs da Fórmula 1. Registre-se agora!";

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
        <SignUp />
      </section>
    </>
  );
}

export default Register;