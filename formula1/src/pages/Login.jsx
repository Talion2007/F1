import { useEffect } from 'react';
import SignIn from '../components/auth/SignIn.jsx'; // Importe o componente de Login
import "../styles/Auth.css"

import "../styles/Page.css"; // Seus estilos globais para a página

function Login() {
  useEffect(() => {
    document.title = "Login";
  })

  return (
    <>
      <section className="auth-page">
        <SignIn />
      </section>
    </>
  );
}

export default Login;