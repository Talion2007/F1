import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import "../styles/Page.css"

function Pratices() {
    const [users, setUsers] = useState(() => {
        const saveUsers = localStorage.getItem('Pratice Key');
        return saveUsers ? JSON.parse(saveUsers) : [];
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [year, setYear] = useState("2025")

    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch(`https://api.openf1.org/v1/sessions?session_type=Practice&year=${year}`)
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

    const praticeOne = users.filter((user) => user.session_name === 'Practice 1');
    const praticeTwo = users.filter((user) => user.session_name === 'Practice 2');
    const praticeTri = users.filter((user) => user.session_name === 'Practice 3');


    return (
        <>

            <Header />
            <section>

<div className="container">
                <h1 className="title">Pratices 1 - F1 {year}</h1>

                                    <select onChange={(e) => setYear(e.target.value)}>
                            <option>2025</option>
                            <option>2024</option>
                            <option>2023</option>
                          </select>
                    </div>
                <article>

                    {loading ?
                        <h1>Carregando...</h1> :
                        <>{praticeOne.map((user) => (
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

                    {error ? <p>Error</p> : ""}

                </article>

                <h1 className="title">Pratices 2 - F1 {year}</h1>

                <article>

                    {loading ?
                        <h1>Carregando...</h1> :
                        <>{praticeTwo.map((user) => (
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

                    {error ? <p>Error</p> : ""}

                </article>

                <h1 className="title">Pratices 3 - F1 {year}</h1>

                <article>

                    {loading ?
                        <h1>Carregando...</h1> :
                        <>{praticeTri.map((user) => (
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

                    {error ? <p>Error</p> : ""}

                </article>
            </section>


            <Footer />
        </>
    )
}
export default Pratices;