// src/components/auth/ResetPassword.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Ajuste o caminho conforme necessário
import { Link } from 'react-router-dom';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Obtém a função de redefinição de senha do contexto de autenticação
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpa mensagens anteriores de sucesso
    setError('');   // Limpa mensagens anteriores de erro
    setLoading(true); // Ativa o estado de carregamento

    try {
      // Chama a função de redefinição de senha do AuthContext
      await resetPassword(email);
      setMessage('Se o e-mail for válido, um link de redefinição de senha foi enviado para ' + email + '. Por favor, verifique sua caixa de entrada (e spam!).');
      setEmail(''); // Limpa o campo de e-mail após o envio bem-sucedido
    } catch (err) {
      console.error("Erro ao redefinir a senha:", err.message);
      // Firebase, por segurança, não informa se o e-mail não existe.
      // A mensagem abaixo é genérica para evitar enumeração de usuários.
      setError('Ocorreu um erro ao enviar o link de redefinição. Por favor, verifique seu e-mail e tente novamente.');
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <div className='totalContainer signin'> {/* Reutilizando classes de estilo */}
      <h2>Redefinir Senha</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="resetEmail">E-mail:</label>
        <input
          type="email"
          id="resetEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Digite seu e-mail de cadastro"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Redefinir Senha'}
        </button>

                <button>
          <Link to="/login">Voltar para o Login</Link>
        </button>
      </form>

      {/* Exibe mensagens de sucesso ou erro */}
      {message && <p style={{ color: 'green'}}>{message}</p>}
      {error && <p style={{ color: 'red'}}>{error}</p>}
    </div>
  );
}

export default ResetPassword;