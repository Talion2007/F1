// src/components/auth/SignIn.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Caminho para o AuthContext
import { useNavigate } from 'react-router-dom'; // Para redirecionar após o login

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Para desabilitar o botão durante o login

  const { login } = useAuth(); // Obtém as funções de login do contexto
  const navigate = useNavigate(); // Hook para navegação

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true); // Ativa o estado de carregamento

    try {
      await login(email, password); // Chama a função de login do contexto
      alert('Login realizado com sucesso!');
      navigate('/'); // Redireciona para a página inicial após o login
    } catch (err) {
      console.error('Erro ao fazer login:', err.message);
      // Mapeia mensagens de erro do Firebase para algo mais amigável
      switch (err.code) {
        case 'auth/invalid-email':
          setError('E-mail inválido.');
          break;
        case 'auth/user-not-found':
          setError('Usuário não encontrado. Verifique o e-mail.');
          break;
        case 'auth/wrong-password':
          setError('Senha incorreta.');
          break;
        case 'auth/invalid-credential':
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
            break;
        default:
          setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <div className='totalContainer signin'>
        <h2>Sign In (Login)</h2>
      <form onSubmit={handleSignIn}>
          <label htmlFor="loginEmail">E-mail:</label>
          <input
            type="email"
            id="loginEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="loginPassword">Password:</label>
          <input
            type="password"
            id="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            
          />

        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading} // Desabilita o botão enquanto estiver carregando
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      <div className='accountAlready'>
        <h2>Don't have an account?</h2>
        <button className="ButtonAccountConfig">
                <Link to="/register">Register</Link>
              </button>
      </div>
    </div>
  );
}

export default SignIn;