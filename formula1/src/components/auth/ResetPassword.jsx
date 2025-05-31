// src/components/auth/ResetPassword.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

function ResetPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await resetPassword(email);
            // Traduzindo a mensagem de sucesso
            setMessage('Verifique seu e-mail para o link de redefinição de senha.');
            setEmail('');
        } catch (err) {
            console.error("Erro ao redefinir a senha:", err.message);
            // Traduzindo a mensagem de erro
            setError('Ocorreu um erro, tente novamente mais tarde!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='totalContainer Forgot'>
            <h2>Redefinir Senha</h2> {/* Traduzido */}
            <form onSubmit={handleSubmit}>
                <label htmlFor="resetEmail">E-mail:</label>
                <input
                    type="email"
                    id="resetEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Insira seu e-mail"
                />
                {message && <p className='success-message'>{message}</p>}
                {error && <p className='error-message'>{error}</p>}       {/* Adicionado classe para styling */}

                <button type="submit" disabled={loading}>
                    {loading ? 'Enviando...' : 'Redefinir'} {/* Traduzido */}
                </button>

                <div className='accountAlready Register'>
                    <h2>Lembrou sua senha?</h2> {/* Traduzido */}
                    <button type="button" className='backLoginPage'>
                        <Link to="/login">Voltar para o Login</Link> {/* Traduzido */}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ResetPassword;