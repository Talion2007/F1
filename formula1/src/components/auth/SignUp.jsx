import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx'; // Caminho para o AuthContext
import { useNavigate } from 'react-router-dom'; // Para redirecionar após o registro

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // <-- ADD THIS STATE FOR NAME
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Obtém as funções de registro e login do contexto
  const { signup, login } = useAuth();
  const navigate = useNavigate(); // Hook para navegação

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Primeiro, tente registrar o usuário, PASSANDO O NOME
      await signup(email, password, name); // <-- PASS 'name' HERE

      // Se o registro for bem-sucedido, faça o login automático
      await login(email, password);

      alert('Cadastro realizado e login automático feito com sucesso!');
      navigate('/'); // Redireciona para a página inicial ou dashboard após o login
    } catch (err) {
      console.error('Erro durante o registro ou login automático:', err.message);
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
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Erro de autenticação após o registro. Tente fazer login manualmente.');
          break;
        default:
          setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='totalContainer signup'>
      <h2>Register New Account</h2>
      <form onSubmit={handleSignUp}>
        <label htmlFor="regName">Name:</label> {/* <-- ADD LABEL FOR NAME */}
        <input
          type="text"
          id="regName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
      <div className='accountAlready Register'>
        <h2>Already have an account?</h2>
        <button className="ButtonAccountConfig Register">
          <Link to="/login">Login</Link>
        </button>
      </div>
    </div>
  );
}

export default SignUp;