import { useEffect } from 'react';
import SignIn from '../components/auth/SignIn.jsx';
import "../styles/Auth.css";
import "../styles/Page.css";

function Login() {
  useEffect(() => {
    // --- SEO: Gerenciamento do Título da Página ---
    document.title = "Login | Fórmula 1 - Statistics"; // Título mais descritivo

    // --- SEO: Gerenciamento da Meta Descrição ---
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Faça login no F1 Dashboard para acessar resultados, notícias e estatísticas exclusivas da Fórmula 1. Conecte-se com a comunidade de fãs.";

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
        <SignIn />
      </section>
    </>
  );
}

export default Login;