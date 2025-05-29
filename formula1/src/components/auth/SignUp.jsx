// src/components/auth/SignUp.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx'; // Caminho para o AuthContext
import { useNavigate } from 'react-router-dom'; // Para redirecionar após o registro

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth(); // Obtém a função de registro do contexto
  const navigate = useNavigate(); // Hook para navegação

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(email, password); // Chama a função de registro do contexto
      alert('Cadastro realizado com sucesso! Faça login agora.');
      navigate('/auth'); // Redireciona para a página de autenticação (Login/Registro)
    } catch (err) {
      console.error('Erro ao registrar:', err.message);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail já está em uso.');
          break;
        case 'auth/invalid-email':
          setError('O formato do e-mail é inválido.');
          break;
        case 'auth/weak-password':
          setError('A senha deve ter pelo menos 6 caracteres.');
          break;
        default:
          setError('Ocorreu um erro ao registrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='totalContainer signup'>
      <h2>Register New Account</h2>
      <form onSubmit={handleSignUp}> 
          <label htmlFor="regEmail">E-mail:</label>
          <input
            type="email"
            id="regEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required

          />

          <label htmlFor="regPassword">Password:</label>
          <input
            type="password"
            id="regPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        {error && <p>{error}</p>}
        <button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;