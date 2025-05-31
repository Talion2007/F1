import Header from "../components/Header";
import Footer from "../components/Footer";
import Loading from "../components/Loading";
import { useState, useEffect } from "react";
import "../styles/Page.css";

function Pratices() {
    // SEU CÓDIGO ORIGINAL DE ESTADO - MOVIDO PARA O TOPO
    const [users, setUsers] = useState(() => {
        const saveUsers = localStorage.getItem('Pratice Key');
        return saveUsers ? JSON.parse(saveUsers) : [];
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [year, setYear] = useState(() => { // <--- A declaração de 'year' está AGORA aqui
        const saveYear = localStorage.getItem('Year Key');
        return saveYear ? JSON.parse(saveYear) : "2025";
    })

    // --- SEO: Gerenciamento do Título da Página e Meta Descrição ---
    useEffect(() => {
        // Define o título da página, incluindo o ano para melhor SEO
        document.title = `Sprints e Treinos Livres - Calendário ${year} | Fórmula 1 - Statistics`;

        // Gerencia a meta description: Cria se não existir, atualiza se existir
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        // Conteúdo dinâmico para a meta description, incluindo o ano
        metaDescription.content = `Confira o calendário completo e resultados de todas as corridas Sprint e Treinos Livres (Practice) da Fórmula 1 para o ano de ${year}. Encontre informações sobre circuitos, datas e horários de cada sessão.`;

        // Função de limpeza: Remove a meta tag quando o componente é desmontado
        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, [year]); // Dependência do 'year' para que o título e a descrição se atualizem com o ano


    // Seu código original de fetch de dados
    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true)
                const response = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`)
                if (!response.ok) {
                    throw new Error("Fudeu")
                }
                const rocamboles = await response.json()
                setUsers(rocamboles);
                localStorage.setItem('Pratice Key', JSON.stringify(rocamboles));

            }
            catch (error) {
                setError(error.message)
            }
            finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [year]);

    console.log(error)

    // Seu código original de filtro
    const sprintSession = users.filter((user) => user.session_name === 'Sprint');
    const praticeOne = users.filter((user) => user.session_name === 'Practice 1');
    const praticeTwo = users.filter((user) => user.session_name === 'Practice 2');
    const praticeTri = users.filter((user) => user.session_name === 'Practice 3');

    // Seu código original de salvamento no localStorage
    useEffect(() => {
        localStorage.setItem('Year Key', JSON.stringify(year));
    }, [year])

    // Seu código original de renderização (HTML e JSX)
    return (
        <>
            <Header />
            <section>
                <div className="container">
                    <h1 className="title">Sprints - F1 {year}</h1>

                    <select value={year} onChange={(e) => setYear(e.target.value)} title="Selecione o ano para ver os eventos de F1">
                        <option>2025</option>
                        <option>2024</option>
                        <option>2023</option>
                    </select>
                </div>
                {error && <p className="error">Error: {error}</p>}
                <article>
                    {loading ?
                        <Loading /> :
                        <>{sprintSession.map((user) => (
                            <div key={user.circuit_key} className="divRaces">
                                <p>Cidade: {user.location} - Circuito: {user.circuit_short_name} - <strong>{user.session_name}</strong></p>
                                <p>País: {user.country_name}({user.country_code}) </p>
                                <p>
                                    {new Date(user.date_start).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false,
                                    })} - {new Date(user.date_end).toLocaleString('pt-BR', {
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

                <h1 className="title">Treinos Livres 1 - F1 {year}</h1>

                {error && <p className="error">Error: {error}</p>}
                <article>

                    {loading ?
                        <Loading /> :
                        <>{praticeOne.map((user) => (
                            <div key={user.session_key} className="divRaces">
                                <p>Cidade: {user.location} - Circuito: {user.circuit_short_name} - <strong>{user.session_name}</strong></p>
                                <p>País: {user.country_name}({user.country_code}) </p>
                                <p>
                                    {new Date(user.date_start).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false,
                                    })} - {new Date(user.date_end).toLocaleString('pt-BR', {
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

                <h1 className="title">Treinos Livres 2 - F1 {year}</h1>

                <article>

                    {loading ?
                        <Loading /> :
                        <>{praticeTwo.map((user) => (
                            <div key={user.session_key} className="divRaces">
                                <p>Cidade: {user.location} - Circuito: {user.circuit_short_name} - <strong>{user.session_name}</strong></p>
                                <p>País: {user.country_name}({user.country_code}) </p>
                                <p>
                                    {new Date(user.date_start).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false,
                                    })} - {new Date(user.date_end).toLocaleString('pt-BR', {
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

                <h1 className="title">Treinos Livres 3 - F1 {year}</h1>

                <article>

                    {loading ?
                        <Loading /> :
                        <>{praticeTri.map((user) => (
                            <div key={user.session_key} className="divRaces">
                                <p>Cidade: {user.location} - Circuito: {user.circuit_short_name} - <strong>{user.session_name}</strong></p>
                                <p>País: {user.country_name}({user.country_code}) </p>
                                <p>
                                    {new Date(user.date_start).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false,
                                    })} - {new Date(user.date_end).toLocaleString('pt-BR', {
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
            </section>


            <Footer />
        </>
    )
}
export default Pratices;