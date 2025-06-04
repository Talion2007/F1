import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState(''); // Estado para o código de verificação digitado
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial'); // 'initial' ou 'verifyCode'

  // IMPORTANTE: Agora você desestrutura 'signup' (que envia o código) e 'finalizeSignup' (que cria a conta)
  const { signup, finalizeSignup, login, isUsernameTaken } = useAuth();
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
            setError('Erro ao verificar nome.'); // Usando setError para exibir para o usuário
          } finally {
            setLoading(false);
          }
        }
      }, 500)
    );
  };

  // ESTA FUNÇÃO AGORA SERÁ CHAMADA NO PRIMEIRO PASSO DO FORMULÁRIO (enviar dados e pedir código)
  const handleInitialSignUpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Chama a função 'signup' do AuthContext, que AGORA envia o código de verificação
      await signup(email, password, name);
      // Se o código foi enviado com sucesso, avança para a etapa de verificação
      setCurrentStep('verifyCode');
      alert('Um código de verificação foi enviado para seu e-mail! Por favor, verifique sua caixa de entrada.');
    } catch (err) {
      console.error('Erro na etapa inicial de registro:', err.message);
      // Tratamento de erros específicos que podem vir do 'signup' refatorado
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail já está em uso.');
          break;
        case 'auth/username-already-in-use': // Erro que pode vir da checagem de nome de usuário
          setError('Este nome de usuário já está em uso. Por favor, escolha outro.');
          break;
        // Erros de EmailJS ou outros erros da função 'signup'
        default:
          setError('Ocorreu um erro ao enviar o código. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ESTA NOVA FUNÇÃO SERÁ CHAMADA NO SEGUNDO PASSO (enviar o código digitado)
  const handleVerifyCodeAndFinalizeSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Chama a função 'finalizeSignup' do AuthContext para validar o código e criar a conta no Firebase
      await finalizeSignup(verificationCodeInput);

      // Se a conta foi criada com sucesso, você pode tentar fazer o login automático
      // ou redirecionar o usuário para a página de login para que ele faça o login manualmente.
      await login(email, password); // Tenta fazer login automático

      alert('Cadastro realizado e login automático feito com sucesso!');
      navigate('/'); // Redireciona para a página principal ou dashboard
    } catch (err) {
      console.error('Erro ao verificar código ou finalizar cadastro:', err.message);
      // Tratamento de erros específicos que podem vir do 'finalizeSignup'
      switch (err.code) {
        case 'auth/invalid-verification-code':
          setError('Código de verificação inválido. Verifique o código e tente novamente.');
          break;
        case 'auth/weak-password':
          setError('A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.');
          break;
        case 'auth/email-already-in-use':
            setError('Este e-mail já está registrado no Firebase. Tente fazer login.');
            break;
        default:
          setError('Ocorreu um erro ao finalizar o cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='totalContainer signup'>
      <h2>Registrar Nova Conta</h2>

      {/* Exibe o formulário inicial para coletar email, nome e senha */}
      {currentStep === 'initial' && (
        <form onSubmit={handleInitialSignUpSubmit}> {/* Chama a função do primeiro passo */}
          <label htmlFor="regName">Nome:</label>
          <input
            type="text"
            id="regName"
            value={name}
            onChange={handleNameChange}
            required
            disabled={loading} // Desabilita enquanto verifica nome
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
            disabled={loading}
          />

          <label htmlFor="regPassword">Senha:</label>
          <input
            type="password"
            id="regPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
          <button
            type="submit"
            // Desabilita se estiver carregando ou se o nome de usuário não estiver disponível
            disabled={loading || nameAvailabilityMessage.includes('já está em uso') || !nameAvailabilityMessage.includes('disponível')}
          >
            {loading ? 'Enviando...' : 'Registrar e Enviar Código'}
          </button>
        </form>
      )}

      {/* Exibe o formulário para inserir o código de verificação */}
      {currentStep === 'verifyCode' && (
        <form onSubmit={handleVerifyCodeAndFinalizeSignUp}> {/* Chama a função do segundo passo */}
          <label htmlFor="verificationCode">Código de Verificação:</label>
          <input
            type="text"
            id="verificationCode"
            value={verificationCodeInput}
            onChange={(e) => setVerificationCodeInput(e.target.value)}
            maxLength="6"
            required
            disabled={loading}
          />
          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || verificationCodeInput.length !== 6} // Habilita apenas com 6 dígitos
          >
            {loading ? 'Verificando...' : 'Confirmar Cadastro'}
          </button>
          <button
            type="button"
            onClick={async () => {
              // Permite reenviar o código (chama signup novamente com os mesmos dados)
              setError(null);
              setLoading(true);
              try {
                await signup(email, password, name); // Reenvia o código com os dados já preenchidos
                alert('Novo código enviado! Verifique seu e-mail.');
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            Reenviar Código
          </button>
          <button
            type="button"
            onClick={() => {
              // Volta para o formulário inicial se o usuário quiser corrigir o e-mail, etc.
              setCurrentStep('initial');
              setError(null); // Limpa o erro
              // IMPORTANTE: Limpar localStorage aqui para segurança se o usuário desistir/voltar
              localStorage.removeItem('tempRegistrationData');
              localStorage.removeItem('verificationCode');
              localStorage.removeItem('verificationCodeExpiry');
            }}
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            Voltar e Editar Dados
          </button>
        </form>
      )}

      <div className='accountAlready Register'>
        <h2>Já tem uma conta?</h2>
        <button className="ButtonAccountConfig Register">
          <Link to="/login">Login</Link>
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