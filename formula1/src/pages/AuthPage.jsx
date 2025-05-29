// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import SignIn from '../components/auth/SignIn.jsx'; // Importe o componente de Login
import SignUp from '../components/auth/SignUp.jsx'; // Importe o componente de Registro
import "../styles/Auth.css"

import "../styles/Page.css"; // Seus estilos globais para a página

function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true); // Controla se mostra o login ou registro

  return (
    <>
      <section className="auth-page">
        <div className='auth-container'>
          <h1>Login or Register: </h1>
          <button className='LoginButton'
            onClick={() => setIsLoginView(true)}
            
            >
            Login
          </button>
          <button className='RegisterButton'
            onClick={() => setIsLoginView(false)}
            >
            Register
          </button>
            </div>

              {isLoginView ? <SignIn /> : <SignUp />}
      </section>
    </>
  );
}

export default AuthPage;