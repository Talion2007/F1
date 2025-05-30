import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext.jsx'; // Certifique-se de usar .jsx
import { Link } from "react-router-dom";
import "../styles/Page.css"

function Qualifying() {
    useEffect(() => {
        document.title = "Qualifying";
    })

    const { currentUser } = useAuth(); // Agora 'user' é 'currentUser' do contexto
    const [users, setUsers] = useState(() => {
        const saveUsers = localStorage.getItem('Qualify Key');
        return saveUsers ? JSON.parse(saveUsers) : [];
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [year, setYear] = useState(() => {
        const saveYear = localStorage.getItem('Year Key');
        return saveYear ? JSON.parse(saveYear) : "2025";
    })

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
                localStorage.setItem('Qualify Key', JSON.stringify(rocamboles));

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

    const raceSession = users.filter((user) => user.session_name === 'Race');
    const qualifySession = users.filter((user) => user.session_type === 'Qualifying')

    useEffect(() => {
        localStorage.setItem('Year Key', JSON.stringify(year));
    }, [year])

    return (
        <>

            <Header />
            <section>
                {!currentUser ? ( // Se não houver usuário logado
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Qualifying - F1</h1>
                            <h3>This content is restric to Registred Members. Sign In or Register an account to Continue!</h3>
                        </div>
                        <div className="buttons">
                            <button className="LoginButton">
                                <Link to="/login">Login</Link>
                            </button>
                            <button className="LoginButton Register">
                                <Link to="/register">Register</Link>
                            </button>
                        </div>
                    </div>
                ) : ( // Se houver usuário logado
                    <>
                        <div className="container">
                        <h1 className="title">Races - F1 {year}</h1>

                        <select value={year} onChange={(e) => setYear(e.target.value)}>
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
                <p>City: {user.location} - Circuit: {user.circuit_short_name} - <strong>{user.session_name}</strong></p>
                <p>Country: {user.country_name}({user.country_code}) </p>
                <p>
                    {new Date(user.date_start).toLocaleString('en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    })} - {new Date(user.date_end).toLocaleString('en-US', {
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
                                <>{users.map((user) => (
                                    <div key={user.session_key} className="divRaces">
                                        <p>City: {user.location} - Circuit: {user.circuit_short_name} - <strong>{user.session_name}</strong></p>
                                        <p>Country: {user.country_name}({user.country_code}) </p>
                                        <p>
                                            {new Date(user.date_start).toLocaleString('en-US', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            })} - {new Date(user.date_end).toLocaleString('en-US', {
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
    )
}
export default Qualifying;