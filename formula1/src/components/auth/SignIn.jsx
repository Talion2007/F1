// src/components/auth/SignIn.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth(); // Não precisa mais de 'resetPassword' aqui
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      alert('Login realizado com sucesso!');
      navigate('/');
    } catch (err) {
      console.error('Erro ao fazer login:', err.message);
      switch (err.code) {
        case 'auth/invalid-email': setError('E-mail inválido.'); break;
        case 'auth/user-not-found': setError('Usuário não encontrado. Verifique o e-mail.'); break;
        case 'auth/wrong-password': setError('Senha incorreta.'); break;
        case 'auth/invalid-credential': setError('Credenciais inválidas. Verifique seu e-mail e senha.'); break;
        default: setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
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

        <div style={{ marginTop: '15px' }}>
        <Link 
          to="/forgot" // <-- Rota para a nova página Forgot.jsx
          style={{ 
            color: '#007bff', 
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            fontSize: '0.9em'
          }}
        >
          Forgot your password?
        </Link>
      </div>

        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
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