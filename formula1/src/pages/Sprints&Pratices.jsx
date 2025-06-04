import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // Assuming you might use Link for login/register
import { useAuth } from '../context/AuthContext.jsx'; // Assuming you have an AuthContext

import "../styles/Page.css";
import "../styles/FlipCard.css"; // Ensure this CSS file is available and contains the flip card styles

// Helper function to format seconds into MM:SS.mmm
const formatLapTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
        return "N/A";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.round((remainingSeconds - Math.floor(remainingSeconds)) * 1000);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(Math.floor(remainingSeconds)).padStart(2, '0');
    const formattedMilliseconds = String(milliseconds).padStart(3, '0');

    return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
};

// Helper to introduce a delay for API requests
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Helper for retries with exponential backoff
async function fetchWithRetry(url, retries = 5, delayMs = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) {
                console.warn(`Rate limit hit for ${url}. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
                await delay(delayMs);
                delayMs *= 2; // Exponential backoff
                continue;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            }
            return response.json();
        } catch (error) {
            if (i === retries - 1) {
                console.error(`Failed to fetch ${url} after ${retries} attempts:`, error);
                throw error;
            }
            console.warn(`Fetch error for ${url}. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`, error);
            await delay(delayMs);
            delayMs *= 2; // Exponential backoff
        }
    }
    return null; // Should not reach here if successful or error after retries
}

function Pratices() {
    const [sessions, setSessions] = useState(() => {
        const savedSessions = localStorage.getItem('Pratice Key'); // Renamed from 'users' to 'sessions' for clarity
        return savedSessions ? JSON.parse(savedSessions) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [year, setYear] = useState(() => {
        const saveYear = localStorage.getItem('Year Key');
        // Set default to current year for more up-to-date data if not found
        const currentYear = new Date().getFullYear().toString();
        return saveYear ? JSON.parse(saveYear) : currentYear;
    });

    const { currentUser } = useAuth(); // Assuming useAuth context is available

    // State for managing flipped cards
    const [flippedCardKey, setFlippedCardKey] = useState(null);

    // States for fastest lap data for each session type
    const [sprintFastestLapsData, setSprintFastestLapsData] = useState({});
    const [praticeOneFastestLapsData, setPraticeOneFastestLapsData] = useState({});
    const [praticeTwoFastestLapsData, setPraticeTwoFastestLapsData] = useState({});
    const [praticeTriFastestLapsData, setPraticeTriFastestLapsData] = useState({});

    // Helper function to fetch best lap data for a given session
    const fetchBestLapData = useCallback(async (session, type) => {
        try {
            const laps = await fetchWithRetry(`https://api.openf1.org/v1/laps?session_key=${session.session_key}&lap_duration>=0`);

            if (!laps || laps.length === 0) {
                console.warn(`No laps found for session ${session.session_key} (${type})`);
                return null;
            }

            let fastestLap = null;
            for (const lap of laps) {
                if (lap.lap_duration && (fastestLap === null || lap.lap_duration < fastestLap.lap_duration)) {
                    fastestLap = lap;
                }
            }

            if (!fastestLap) {
                console.warn(`No fastest lap found for session ${session.session_key} (${type})`);
                return null;
            }

            const driverData = await fetchWithRetry(`https://api.openf1.org/v1/drivers?driver_number=${fastestLap.driver_number}&session_key=${session.session_key}`);
            const driverName = driverData && driverData.length > 0 ? driverData[0].broadcast_name : 'Desconhecido';
            const teamColour = driverData && driverData.length > 0 ? driverData[0].team_colour : '666666';

            return {
                session_key: session.session_key,
                driverName: driverName,
                lapTime: fastestLap.lap_duration,
                teamColour: teamColour
            };
        } catch (innerError) {
            console.error(`Error processing ${type} session ${session.session_key}:`, innerError);
            return null;
        }
    }, []); // Empty dependency array means this function is created once

    // SEO: Page Title and Meta Description Management
    useEffect(() => {
        document.title = `Sprints e Treinos Livres - Calendário ${year} | Fórmula 1 - Statistics`;

        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira o calendário completo e resultados de todas as corridas Sprint e Treinos Livres (Practice) da Fórmula 1 para o ano de ${year}. Encontre informações sobre circuitos, datas e horários de cada sessão.`;

        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, [year]);

    // Main data fetching effect
    useEffect(() => {
        async function fetchAllSessionData() {
            try {
                setLoading(true);
                setError(null);

                // Fetch all sessions for the year first
                const fetchedSessions = await fetchWithRetry(`https://api.openf1.org/v1/sessions?year=${year}`);
                if (!fetchedSessions || fetchedSessions.length === 0) {
                    throw new Error("No sessions found for the selected year.");
                }
                setSessions(fetchedSessions);
                localStorage.setItem('Pratice Key', JSON.stringify(fetchedSessions));

                // Filter sessions
                const sprintSessions = fetchedSessions.filter(session => session.session_name === 'Sprint');
                const practice1Sessions = fetchedSessions.filter(session => session.session_name === 'Practice 1');
                const practice2Sessions = fetchedSessions.filter(session => session.session_name === 'Practice 2');
                const practice3Sessions = fetchedSessions.filter(session => session.session_name === 'Practice 3');

                // Process Sprint sessions
                for (let i = 0; i < sprintSessions.length; i++) {
                    const session = sprintSessions[i];
                    await delay(100);
                    const result = await fetchBestLapData(session, 'Sprint');
                    if (result) {
                        setSprintFastestLapsData(prev => ({ ...prev, [result.session_key]: result }));
                    }
                }

                // Process Practice 1 sessions
                for (let i = 0; i < practice1Sessions.length; i++) {
                    const session = practice1Sessions[i];
                    await delay(100);
                    const result = await fetchBestLapData(session, 'Practice 1');
                    if (result) {
                        setPraticeOneFastestLapsData(prev => ({ ...prev, [result.session_key]: result }));
                    }
                }

                // Process Practice 2 sessions
                for (let i = 0; i < practice2Sessions.length; i++) {
                    const session = practice2Sessions[i];
                    await delay(100);
                    const result = await fetchBestLapData(session, 'Practice 2');
                    if (result) {
                        setPraticeTwoFastestLapsData(prev => ({ ...prev, [result.session_key]: result }));
                    }
                }

                // Process Practice 3 sessions
                for (let i = 0; i < practice3Sessions.length; i++) {
                    const session = practice3Sessions[i];
                    await delay(100);
                    const result = await fetchBestLapData(session, 'Practice 3');
                    if (result) {
                        setPraticeTriFastestLapsData(prev => ({ ...prev, [result.session_key]: result }));
                    }
                }

            } catch (err) {
                setError(err.message);
                console.error("Error in fetchAllSessionData (Pratices component):", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAllSessionData();
    }, [year, fetchBestLapData]); // Add fetchBestLapData to dependencies

    // Save selected year to localStorage
    useEffect(() => {
        localStorage.setItem('Year Key', JSON.stringify(year));
    }, [year]);

    // Filtered sessions (still useful for rendering lists, though the fastest lap data is in separate states)
    const sprintSessionsFiltered = sessions.filter((session) => session.session_name === 'Sprint');
    const praticeOneFiltered = sessions.filter((session) => session.session_name === 'Practice 1');
    const praticeTwoFiltered = sessions.filter((session) => session.session_name === 'Practice 2');
    const praticeTriFiltered = sessions.filter((session) => session.session_name === 'Practice 3');


    return (
        <>
            <Header />
            <section>
                {!currentUser ? (
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Sprints e Treinos Livres - F1</h1>
                            <h3>Este conteúdo é restrito a Membros Registrados. Faça Login ou Registre uma conta para continuar!</h3>
                        </div>
                        <div className="buttons">
                            <button className="LoginButton">
                                <Link to="/login">Login</Link>
                            </button>
                            <button className="LoginButton Register">
                                <Link to="/register">Registrar</Link>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="container">
                            <h1 className="title">Sprints e Treinos Livres - F1 {year}
                                 <br/>
                            <select value={year} onChange={(e) => setYear(e.target.value)} title="Selecione o ano para ver os eventos de F1">
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                            </h1>
                        </div>

                        {error && <p className="error">Error: {error}</p>}

                        {/* --- Sprint Session Cards --- */}
                        <h1 className="title">Sprints - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {loading && sprintSessionsFiltered.length === 0 ? (
                                <Loading />
                            ) : (
                                sprintSessionsFiltered.map((session) => (
                                    <div
                                        className="qualifying-card" // Reusing qualifying-card class
                                        key={session.session_key}
                                        onClick={() =>
                                            setFlippedCardKey(
                                                flippedCardKey === session.session_key ? null : session.session_key
                                            )
                                        }
                                    >
                                        <div
                                            className={`qualifying-card-inner ${flippedCardKey === session.session_key ? "is-flipped" : ""}`}
                                        >
                                            {/* --- Front of the Card (Session Info) --- */}
                                            <div className="qualifying-card-front">
                                                <p>Cidade: {session.location} - Circuito: {session.circuit_short_name} - <strong>{session.session_name}</strong></p>
                                                <p>País: {session.country_name}({session.country_code}) </p>
                                                <p>
                                                    Data: {new Date(session.date_start).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', hour12: false,
                                                    })}
                                                </p>
                                            </div>

                                            {/* --- Back of the Card (Best Lap Time) --- */}
                                            <div
                                                className="qualifying-card-back"
                                                style={{ backgroundColor: `#${sprintFastestLapsData[session.session_key]?.teamColour || '21212c'}` }}
                                            >
                                                {sprintFastestLapsData[session.session_key] ? (
                                                    <>
                                                        <div className="qualifying-best-lap-background"
                                                            style={{ color: `#${sprintFastestLapsData[session.session_key]?.teamColour}28` }}>
                                                        </div>
                                                        <p>Melhor Volta: </p>
                                                        <p>{sprintFastestLapsData[session.session_key]?.driverName} - {formatLapTime(sprintFastestLapsData[session.session_key]?.lapTime)}</p>
                                                    </>
                                                ) : (
                                                    <p>Melhor Volta: Carregando...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </article>

                        {/* --- Practice 1 Session Cards --- */}
                        <h1 className="title">Treinos Livres 1 - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {loading && praticeOneFiltered.length === 0 ? (
                                <Loading />
                            ) : (
                                praticeOneFiltered.map((session) => (
                                    <div
                                        className="qualifying-card"
                                        key={session.session_key}
                                        onClick={() =>
                                            setFlippedCardKey(
                                                flippedCardKey === session.session_key ? null : session.session_key
                                            )
                                        }
                                    >
                                        <div
                                            className={`qualifying-card-inner ${flippedCardKey === session.session_key ? "is-flipped" : ""}`}
                                        >
                                            <div className="qualifying-card-front">
                                                <p>Cidade: {session.location} - Circuito: {session.circuit_short_name} - <strong>{session.session_name}</strong></p>
                                                <p>País: {session.country_name}({session.country_code}) </p>
                                                <p>
                                                    Data: {new Date(session.date_start).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', hour12: false,
                                                    })}
                                                </p>
                                            </div>
                                            <div
                                                className="qualifying-card-back"
                                                style={{ backgroundColor: `#${praticeOneFastestLapsData[session.session_key]?.teamColour || '21212c'}` }}
                                            >
                                                {praticeOneFastestLapsData[session.session_key] ? (
                                                    <>
                                                        <div className="qualifying-best-lap-background"
                                                            style={{ color: `#${praticeOneFastestLapsData[session.session_key]?.teamColour}28` }}>
                                                        </div>
                                                        <p>Melhor Volta: </p>
                                                        <p>{praticeOneFastestLapsData[session.session_key]?.driverName} - {formatLapTime(praticeOneFastestLapsData[session.session_key]?.lapTime)}</p>
                                                    </>
                                                ) : (
                                                    <p>Melhor Volta: Carregando...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </article>

                        {/* --- Practice 2 Session Cards --- */}
                        <h1 className="title">Treinos Livres 2 - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {loading && praticeTwoFiltered.length === 0 ? (
                                <Loading />
                            ) : (
                                praticeTwoFiltered.map((session) => (
                                    <div
                                        className="qualifying-card"
                                        key={session.session_key}
                                        onClick={() =>
                                            setFlippedCardKey(
                                                flippedCardKey === session.session_key ? null : session.session_key
                                            )
                                        }
                                    >
                                        <div
                                            className={`qualifying-card-inner ${flippedCardKey === session.session_key ? "is-flipped" : ""}`}
                                        >
                                            <div className="qualifying-card-front">
                                                <p>Cidade: {session.location} - Circuito: {session.circuit_short_name} - <strong>{session.session_name}</strong></p>
                                                <p>País: {session.country_name}({session.country_code}) </p>
                                                <p>
                                                    Data: {new Date(session.date_start).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', hour12: false,
                                                    })}
                                                </p>
                                            </div>
                                            <div
                                                className="qualifying-card-back"
                                                style={{ backgroundColor: `#${praticeTwoFastestLapsData[session.session_key]?.teamColour || '21212c'}` }}
                                            >
                                                {praticeTwoFastestLapsData[session.session_key] ? (
                                                    <>
                                                        <div className="qualifying-best-lap-background"
                                                            style={{ color: `#${praticeTwoFastestLapsData[session.session_key]?.teamColour}28` }}>
                                                        </div>
                                                        <p>Melhor Volta: </p>
                                                        <p>{praticeTwoFastestLapsData[session.session_key]?.driverName} - {formatLapTime(praticeTwoFastestLapsData[session.session_key]?.lapTime)}</p>
                                                    </>
                                                ) : (
                                                    <p>Melhor Volta: Carregando...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </article>

                        {/* --- Practice 3 Session Cards --- */}
                        <h1 className="title">Treinos Livres 3 - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {loading && praticeTriFiltered.length === 0 ? (
                                <Loading />
                            ) : (
                                praticeTriFiltered.map((session) => (
                                    <div
                                        className="qualifying-card"
                                        key={session.session_key}
                                        onClick={() =>
                                            setFlippedCardKey(
                                                flippedCardKey === session.session_key ? null : session.session_key
                                            )
                                        }
                                    >
                                        <div
                                            className={`qualifying-card-inner ${flippedCardKey === session.session_key ? "is-flipped" : ""}`}
                                        >
                                            <div className="qualifying-card-front">
                                                <p>Cidade: {session.location} - Circuito: {session.circuit_short_name} - <strong>{session.session_name}</strong></p>
                                                <p>País: {session.country_name}({session.country_code}) </p>
                                                <p>
                                                    Data: {new Date(session.date_start).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', hour12: false,
                                                    })}
                                                </p>
                                            </div>
                                            <div
                                                className="qualifying-card-back"
                                                style={{ backgroundColor: `#${praticeTriFastestLapsData[session.session_key]?.teamColour || '21212c'}` }}
                                            >
                                                {praticeTriFastestLapsData[session.session_key] ? (
                                                    <>
                                                        <div className="qualifying-best-lap-background"
                                                            style={{ color: `#${praticeTriFastestLapsData[session.session_key]?.teamColour}28` }}>
                                                        </div>
                                                        <p>Melhor Volta: </p>
                                                        <p>{praticeTriFastestLapsData[session.session_key]?.driverName} - {formatLapTime(praticeTriFastestLapsData[session.session_key]?.lapTime)}</p>
                                                    </>
                                                ) : (
                                                    <p>Melhor Volta: Carregando...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </article>
                    </>
                )}
            </section>
            <Footer />
        </>
    );
}

export default Pratices;