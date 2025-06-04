import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from "react-router-dom";
import "../styles/Page.css";
import "../styles/FlipCard.css";

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


function Qualifying() {
    const [year, setYear] = useState(() => {
        const saveYear = localStorage.getItem('Year Key');
        return saveYear ? JSON.parse(saveYear) : "2024";
    });

    useEffect(() => {
        document.title = `Qualifying e Corridas - Calendario ${year} | Fórmula 1 - Statistics`;

        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira os resultados das sessões de Classificação (Qualifying) e o calendário das Corridas da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;

        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, [year]);

    const { currentUser } = useAuth();
    const [sessions, setSessions] = useState(() => {
        const savedSessions = localStorage.getItem('Qualify Key');
        return savedSessions ? JSON.parse(savedSessions) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    const [qualifyingFastestLapsData, setQualifyingFastestLapsData] = useState({});
    const [raceFastestLapsData, setRaceFastestLapsData] = useState({});

    // Use useCallback to memoize the fetchBestLapData function
    const fetchBestLapData = useCallback(async (session, type) => {
        try {
            // Fetch laps data
            const laps = await fetchWithRetry(`https://api.openf1.org/v1/laps?session_key=${session.session_key}&lap_duration>=0`);

            if (!laps || laps.length === 0) {
                console.warn(`No laps found for session ${session.session_key}`);
                return null;
            }

            let fastestLap = null;
            for (const lap of laps) {
                if (lap.lap_duration && (fastestLap === null || lap.lap_duration < fastestLap.lap_duration)) {
                    fastestLap = lap;
                }
            }

            if (!fastestLap) {
                console.warn(`No fastest lap found for session ${session.session_key}`);
                return null;
            }

            // Fetch driver data
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
                localStorage.setItem('Qualify Key', JSON.stringify(fetchedSessions));

                const raceSessions = fetchedSessions.filter(session => session.session_name === 'Race');
                const qualifySessions = fetchedSessions.filter(session => session.session_type === 'Qualifying');

                const newRaceFastestLapsData = {};
                const newQualifyingFastestLapsData = {};

                // Process Race sessions sequentially with delays
                for (let i = 0; i < raceSessions.length; i++) {
                    const race = raceSessions[i];
                    await delay(100); // Small delay between each session's processing
                    const result = await fetchBestLapData(race, 'Race');
                    if (result) {
                        newRaceFastestLapsData[result.session_key] = result;
                        setRaceFastestLapsData(prev => ({ ...prev, [result.session_key]: result }));
                    }
                }

                // Process Qualifying sessions sequentially with delays
                for (let i = 0; i < qualifySessions.length; i++) {
                    const qualify = qualifySessions[i];
                    await delay(100); // Small delay between each session's processing
                    const result = await fetchBestLapData(qualify, 'Qualifying');
                    if (result) {
                        newQualifyingFastestLapsData[result.session_key] = result;
                        setQualifyingFastestLapsData(prev => ({ ...prev, [result.session_key]: result }));
                    }
                }

            } catch (err) {
                setError(err.message);
                console.error("Error in fetchAllSessionData:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAllSessionData();
    }, [year, fetchBestLapData]); // Add fetchBestLapData to dependencies

    // Keep this for debugging if needed, but it's better to use a dedicated error display
    // console.log(error);

    const raceSessionsFiltered = sessions.filter((session) => session.session_name === 'Race');
    const qualifySessionsFiltered = sessions.filter((session) => session.session_type === 'Qualifying');

    useEffect(() => {
        localStorage.setItem('Year Key', JSON.stringify(year));
    }, [year]);

    return (
        <>
            <Header />
            <section>
                {!currentUser ? (
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Corridas e Qualifying - F1</h1>
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
                                            <div className="container tags">
                            <h1 className="title">Corridas e Qualifying - F1 {year}
                            </h1>
                            <select value={year} onChange={(e) => setYear(e.target.value)} title="Selecione o ano para ver os eventos de F1">
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                            </div>

                        {error && <p className="error">Error: {error}</p>}

                        {/* --- Race Session Cards --- */}
                            <h1 className="title">Corridas - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {loading && raceSessionsFiltered.length === 0 ? (
                                <Loading />
                            ) : (
                                raceSessionsFiltered.map((session) => (
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
                                            {/* --- Front of the Card (Session Info) --- */}
                                            <div
                                                className="qualifying-card-front"
                                            >
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
                                                style={{ backgroundColor: `#${raceFastestLapsData[session.session_key]?.teamColour || '21212c'}` }}
                                            >
                                                {raceFastestLapsData[session.session_key] ? (
                                                    <>
                                                        <div className="qualifying-best-lap-background"
                                                            style={{ color: `#${raceFastestLapsData[session.session_key]?.teamColour}28` }}>
                                                            {/* This div seems to be for a background effect, keeping it as is */}
                                                        </div>
                                                        <p>Melhor Volta: </p>
                                                        <p>{raceFastestLapsData[session.session_key]?.driverName} - {formatLapTime(raceFastestLapsData[session.session_key]?.lapTime)}</p>
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

                        <h1 className="title">Qualifying - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {loading && qualifySessionsFiltered.length === 0 ? (
                                <Loading />
                            ) : (
                                qualifySessionsFiltered.map((session) => (
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
                                            {/* --- Front of the Card (Session Info) --- */}
                                            <div
                                                className="qualifying-card-front"
                                            >
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
                                                style={{ backgroundColor: `#${qualifyingFastestLapsData[session.session_key]?.teamColour || '21212c'}` }}
                                            >
                                                {qualifyingFastestLapsData[session.session_key] ? (
                                                    <>
                                                        <div className="qualifying-best-lap-background"
                                                            style={{ color: `#${qualifyingFastestLapsData[session.session_key]?.teamColour}28` }}>
                                                            {/* This div seems to be for a background effect, keeping it as is */}
                                                        </div>
                                                        <p>Melhor Volta: </p>
                                                        <p>{qualifyingFastestLapsData[session.session_key]?.driverName} - {formatLapTime(qualifyingFastestLapsData[session.session_key]?.lapTime)}</p>
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

export default Qualifying;