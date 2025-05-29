import { useEffect } from 'react';
import SignUp from '../components/auth/SignUp.jsx'; // Importe o componente de Registro
import "../styles/Auth.css"
import "../styles/Page.css"; // Seus estilos globais para a página

function Register() {
  useEffect(() => {
    document.title = "Register";
  })

  return (
    <>
      <section className="auth-page">
        <SignUp />
      </section>
    </>
  );
}

export default Register;