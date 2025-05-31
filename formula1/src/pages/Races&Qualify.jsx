import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from "react-router-dom";
import "../styles/Page.css";

function Qualifying() {
    // === INÍCIO DAS MODIFICAÇÕES ===

    // Mover a declaração de 'year' para o topo do componente
    // para que seja acessível por outros useEffects (como o de SEO).
    const [year, setYear] = useState(() => {
        const saveYear = localStorage.getItem('Year Key');
        return saveYear ? JSON.parse(saveYear) : "2025";
    });

    // --- SEO: Gerenciamento do Título da Página e Meta Descrição ---
    useEffect(() => {
        // Define o título da página, incluindo o ano para melhor SEO
        document.title = `Qualifying e Corridas - Calendario ${year}`;

        // Gerencia a meta description: Cria se não existir, atualiza se existir
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        // Conteúdo dinâmico para a meta description, incluindo o ano
        metaDescription.content = `Confira os resultados das sessões de Classificação (Qualifying) e o calendário das Corridas da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;

        // Função de limpeza: Remove a meta tag quando o componente é desmontado
        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, [year]); // Dependência do 'year' para que o título e a descrição se atualizem com o ano

    // === FIM DAS MODIFICAÇÕES DE SEO ===

    const { currentUser } = useAuth(); // Agora 'user' é 'currentUser' do contexto
    const [users, setUsers] = useState(() => {
        const saveUsers = localStorage.getItem('Qualify Key');
        return saveUsers ? JSON.parse(saveUsers) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true);
                const response = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);
                if (!response.ok) {
                    throw new Error("Fudeu");
                }
                const rocamboles = await response.json();
                setUsers(rocamboles);
                localStorage.setItem('Qualify Key', JSON.stringify(rocamboles));

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, [year]);

    console.log(error);

    const raceSession = users.filter((user) => user.session_name === 'Race');
    // Você tinha 'qualifySession = users.filter((user) => user.session_type === 'Qualifying')'
    // Mas no JSX está iterando sobre 'users' direto no segundo article.
    // Vamos manter a variável qualifySession para clareza, mas a iteração abaixo precisa ser sobre ela se for o caso.
    // Se o objetivo é mostrar *todas* as sessões para o usuário logado no segundo bloco, 'users' está correto.
    // Presumo que o segundo bloco é para 'Qualifying', então vou usar 'qualifySession' lá.
    const qualifySession = users.filter((user) => user.session_type === 'Qualifying');


    useEffect(() => {
        localStorage.setItem('Year Key', JSON.stringify(year));
    }, [year]);

    return (
        <>
            <Header />
            <section>
                {!currentUser ? ( // Se não houver usuário logado
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Corridas e Qualifying - F1</h1>
                            <h3>Este conteúdo é restrito a Membros Registrados. Faça Login ou Registre uma conta para continuar!</h3> {/* Traduzido aqui */}
                        </div>
                        <div className="buttons">
                            <button className="LoginButton">
                                <Link to="/login">Login</Link>
                            </button>
                            <button className="LoginButton Register">
                                <Link to="/register">Registrar</Link> {/* Traduzido aqui */}
                            </button>
                        </div>
                    </div>
                ) : ( // Se houver usuário logado
                    <>
                        <div className="container">
                            <h1 className="title">Corridas - F1 {year}</h1> {/* Traduzido aqui */}

                            <select value={year} onChange={(e) => setYear(e.target.value)} title="Selecione o ano para ver as corridas e qualificações de F1"> {/* Adicionado title para acessibilidade e SEO */}
                                <option>2025</option>
                                <option>2024</option>
                                <option>2023</option>
                            </select>
                        </div>

                        <article>
                            {loading ?
                                <Loading /> :
                                <>{raceSession.map((user) => (
                                    <div key={user.circuit_key} className="divRaces">
                                        <p>Cidade: {user.location} - Circuito: {user.circuit_short_name} - <strong>{user.session_name}</strong></p> {/* Traduzido aqui */}
                                        <p>País: {user.country_name}({user.country_code}) </p> {/* Traduzido aqui */}
                                        <p>
                                            {new Date(user.date_start).toLocaleString('pt-BR', { // <--- Alterado para 'pt-BR'
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            })} - {new Date(user.date_end).toLocaleString('pt-BR', { // <--- Alterado para 'pt-BR'
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            })}
                                        </p>
                                    </div>
                                ))}</>}
                        </article>

                        <h1 className="title">Qualifying - F1 {year}</h1>
                        {error && <p className="error">Error: {error}</p>}
                        <article>
                            {loading ?
                                <Loading /> :
                                <>{qualifySession.map((user) => ( // Alterado de 'users.map' para 'qualifySession.map'
                                    <div key={user.session_key} className="divRaces">
                                        <p>Cidade: {user.location} - Circuito: {user.circuit_short_name} - <strong>{user.session_name}</strong></p> {/* Traduzido aqui */}
                                        <p>País: {user.country_name}({user.country_code}) </p> {/* Traduzido aqui */}
                                        <p>
                                            {new Date(user.date_start).toLocaleString('pt-BR', { // <--- Alterado para 'pt-BR'
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            })} - {new Date(user.date_end).toLocaleString('pt-BR', { // <--- Alterado para 'pt-BR'
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            })}
                                        </p>
                                    </div>
                                ))}</>}
                        </article>
                    </>
                )}
            </section>
            <Footer />
        </>
    );
}

export default Qualifying;