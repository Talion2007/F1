import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signup, login, isUsernameTaken } = useAuth();
  const navigate = useNavigate();

  const [nameAvailabilityMessage, setNameAvailabilityMessage] = useState('');
  const [nameCheckTimeout, setNameCheckTimeout] = useState(null);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setNameAvailabilityMessage('');

    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout);
    }

    setNameCheckTimeout(
      setTimeout(async () => {
        if (newName.length > 0) {
          setLoading(true);
          try {
            const taken = await isUsernameTaken(newName);
            if (taken) {
              setNameAvailabilityMessage('Nome de usuário já está em uso.');
            } else {
              setNameAvailabilityMessage('Nome de usuário disponível!');
            }
          } catch (err) {
            console.error("Erro ao verificar nome de usuário:", err);
            setNameAvailabilityMessage('Erro ao verificar nome.');
          } finally {
            setLoading(false);
          }
        }
      }, 500)
    );
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(email, password, name);

      await login(email, password);

      alert('Cadastro realizado e login automático feito com sucesso!');
      navigate('/');
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
        case 'auth/username-already-in-use':
          setError('Este nome de usuário já está em uso. Por favor, escolha outro.');
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
      <h2>Registrar Nova Conta</h2> {/* Traduzido */}
      <form onSubmit={handleSignUp}>
        <label htmlFor="regName">Nome:</label> {/* Traduzido */}
        <input
          type="text"
          id="regName"
          value={name}
          onChange={handleNameChange}
          required
        />
        {nameAvailabilityMessage && (
          <p style={{ color: nameAvailabilityMessage.includes('disponível') ? 'green' : 'red' }}>
            {nameAvailabilityMessage}
          </p>
        )}

        <label htmlFor="regEmail">E-mail:</label> {/* Já estava em PT-BR */}
        <input
          type="email"
          id="regEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="regPassword">Senha:</label> {/* Traduzido */}
        <input
          type="password"
          id="regPassword"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>} {/* Mantive o estilo inline de erro do Login */}
        <button
          type="submit"
          disabled={loading || nameAvailabilityMessage.includes('já está em uso')}
        >
          {loading ? 'Carregando...' : 'Registrar'} {/* Traduzido */}
        </button>
      </form>
      <div className='accountAlready Register'>
        <h2>Já tem uma conta?</h2> {/* Traduzido */}
        <button className="ButtonAccountConfig Register">
          <Link to="/login">Login</Link> {/* Já estava em PT-BR, mas garantindo */}
        </button>
      </div>
      <div style={{ marginTop: '15px' }}>
              <Link
                to="/"
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
                Voltar para Home!
              </Link>
            </div>
    </div>
  );
}

export default SignUp;