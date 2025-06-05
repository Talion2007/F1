import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import SessionCard from "../components/SessionCard.jsx";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from "react-router-dom";
import "../styles/Page.css";
import "../styles/FlipCard.css";

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
    return null;
}

function Qualifying() {
    const [year, setYear] = useState(() => {
        const saveYear = localStorage.getItem('f1SelectedYear');
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
        const savedSessions = localStorage.getItem('f1QualifyingSessions');
        return savedSessions ? JSON.parse(savedSessions) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    const [qualifyingFastestLapsData, setQualifyingFastestLapsData] = useState({});
    const [raceFastestLapsData, setRaceFastestLapsData] = useState({});

    const fetchBestLapData = useCallback(async (session, type) => {
        try {
            // Removendo o delay interno aqui, pois o atraso será gerido no loop principal do useEffect
            const laps = await fetchWithRetry(`https://api.openf1.org/v1/laps?session_key=${session.session_key}&lap_duration>=0`);
            if (!laps || laps.length === 0) return null;
            let fastestLap = null;
            for (const lap of laps) {
                if (lap.lap_duration && (fastestLap === null || lap.lap_duration < fastestLap.lap_duration)) {
                    fastestLap = lap;
                }
            }
            if (!fastestLap) return null;

            // Removendo o delay interno aqui, pois o atraso será gerido no loop principal do useEffect
            const driverData = await fetchWithRetry(`https://api.openf1.org/v1/drivers?driver_number=${fastestLap.driver_number}&session_key=${session.session_key}`);
            const driverName = driverData && driverData.length > 0 ? driverData[0].broadcast_name : 'Desconhecido';
            const teamColour = driverData && driverData.length > 0 ? driverData[0].team_colour : '666666';

            return { session_key: session.session_key, driverName: driverName, lapTime: fastestLap.lap_duration, teamColour: teamColour };
        } catch (innerError) {
            console.error(`Error processing ${type} session ${session.session_key}:`, innerError);
            return null;
        }
    }, []);

    useEffect(() => {
        async function fetchAllSessionData() {
            try {
                setLoading(true);
                setError(null);
                const fetchedSessions = await fetchWithRetry(`https://api.openf1.org/v1/sessions?year=${year}`);
                if (!fetchedSessions || fetchedSessions.length === 0) {
                    throw new Error("No sessions found for the selected year.");
                }

                // Filter only for Race and Qualifying sessions
                const relevantSessions = fetchedSessions.filter(session =>
                    session.session_name === 'Race' ||
                    session.session_type === 'Qualifying'
                );

                setSessions(relevantSessions);
                localStorage.setItem('f1QualifyingSessions', JSON.stringify(relevantSessions));
                setLoading(false); // Display basic cards quickly

                const newRaceFastestLapsData = {};
                const newQualifyingFastestLapsData = {};

                // Process all relevant sessions sequentially with a delay
                // This is the key change to implement the "Practices" good practice
                for (const session of relevantSessions) {
                    const data = await fetchBestLapData(session, session.session_type);
                    if (data) {
                        if (session.session_name === 'Race') {
                            newRaceFastestLapsData[data.session_key] = data;
                        } else if (session.session_type === 'Qualifying') {
                            newQualifyingFastestLapsData[data.session_key] = data;
                        }
                    }
                    // Introduce a delay after each session's fastest lap data fetch
                    await delay(200); // 200ms delay, consistent with Practices component
                }
                setRaceFastestLapsData(newRaceFastestLapsData);
                setQualifyingFastestLapsData(newQualifyingFastestLapsData);

            } catch (err) {
                setError(err.message);
                console.error("Error in fetchAllSessionData:", err);
                setLoading(false);
            }
        }

        // Only fetch data if the user is logged in AND (no sessions loaded OR the year has changed)
        if (currentUser && (sessions.length === 0 || (sessions.length > 0 && sessions[0].year !== parseInt(year)))) {
            fetchAllSessionData();
        } else if (!currentUser) { // If not logged in, ensure loading is false and clear data
            setLoading(false);
            setSessions([]); // Clear sessions if the user logs out
            setQualifyingFastestLapsData({});
            setRaceFastestLapsData({});
        }

    }, [year, fetchBestLapData, sessions, currentUser]);

    useEffect(() => {
        localStorage.setItem('f1SelectedYear', JSON.stringify(year));
    }, [year]);

    const raceSessionsDisplay = sessions.filter((session) => session.session_name === 'Race');
    const qualifySessionsDisplay = sessions.filter((session) => session.session_type === 'Qualifying');

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
                            <h1 className="title">Corridas e Qualifying</h1>
                            <select value={year} onChange={(e) => setYear(e.target.value)} title="Selecione o ano para ver os eventos de F1">
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>

                        {loading && <><br /><Loading /></>}
                        {error && <p className="error">Error: {error}</p>}

                        <h1 className="title">Corridas - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {raceSessionsDisplay.length > 0 ? (
                                raceSessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={raceFastestLapsData[session.session_key]}
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))
                            ) : (
                                !loading && <p>Nenhuma Corrida encontrada para {year}.</p>
                            )}
                        </article>

                        <h1 className="title">Qualifying - F1 {year}</h1>
                        <article className="qualifying-cards-container">
                            {qualifySessionsDisplay.length > 0 ? (
                                qualifySessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={qualifyingFastestLapsData[session.session_key]}
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))
                            ) : (
                                !loading && <p>Nenhuma Classificação encontrada para {year}.</p>
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