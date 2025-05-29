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
            setMessage('Verify your email for password reset link.');
            setEmail(''); // Limpa o campo de e-mail após o envio bem-sucedido
        } catch (err) {
            console.error("Erro ao redefinir a senha:", err.message);
            setError('Ocured an error, try again later!');
        } finally {
            setLoading(false); // Desativa o estado de carregamento
        }
    };

    return (
        <div className='totalContainer Forgot'> {/* Reutilizando classes de estilo */}
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="resetEmail">E-mail:</label>
                <input
                    type="email"
                    id="resetEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Insert your email"
                />
                {message && <p>{message}</p>}
                {error && <p>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Reset'}
                </button>

                <div className='accountAlready Register'>
                    <h2>Remembered your password?</h2>
                    <button type="button" className='backLoginPage'>
                        <Link to="/login">Back to Login</Link>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ResetPassword;