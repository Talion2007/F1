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

  const { signup, login, isUsernameTaken } = useAuth(); // Importe isUsernameTaken
  const navigate = useNavigate();

  // Opcional: Estado para feedback de disponibilidade do nome de usuário em tempo real
  const [nameAvailabilityMessage, setNameAvailabilityMessage] = useState('');
  const [nameCheckTimeout, setNameCheckTimeout] = useState(null);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setNameAvailabilityMessage(''); // Limpa a mensagem ao digitar

    // Limpa o timeout anterior para evitar múltiplas checagens desnecessárias
    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout);
    }

    // Define um novo timeout para checar após um pequeno atraso
    setNameCheckTimeout(
      setTimeout(async () => {
        if (newName.length > 0) { // Só checa se algo foi digitado
          setLoading(true); // Pode adicionar um loading para essa checagem
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
            setLoading(false); // Remove o loading
          }
        }
      }, 500) // Checa 500ms depois que o usuário para de digitar
    );
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // A validação de unicidade do nome agora é feita dentro da função `signup` no AuthContext
      await signup(email, password, name);

      // Se o registro for bem-sucedido, faça o login automático
      await login(email, password);

      alert('Cadastro realizado e login automático feito com sucesso!');
      navigate('/');
    } catch (err) {
      console.error('Erro durante o registro ou login automático:', err.message);
      // Trate o novo erro 'auth/username-already-in-use'
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
        case 'auth/username-already-in-use': // NOVO TRATAMENTO DE ERRO
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
      <h2>Register New Account</h2>
      <form onSubmit={handleSignUp}>
        <label htmlFor="regName">Name:</label>
        <input
          type="text"
          id="regName"
          value={name}
          onChange={handleNameChange} // Usar a nova função de onChange
          required
        />
        {nameAvailabilityMessage && (
          <p style={{ color: nameAvailabilityMessage.includes('disponível') ? 'green' : 'red' }}>
            {nameAvailabilityMessage}
          </p>
        )}

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
          disabled={loading || nameAvailabilityMessage.includes('já está em uso')} // Desabilita se o nome não estiver disponível
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