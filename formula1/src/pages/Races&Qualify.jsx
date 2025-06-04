import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from "react-router-dom";
import "../styles/Page.css";
import "../styles/FlipCard.css"; // Import the new CSS file

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

function Qualifying() {
    const [year, setYear] = useState(() => {
        const saveYear = localStorage.getItem('Year Key');
        return saveYear ? JSON.parse(saveYear) : "2024"; // Changed default year to 2024 for more data
    });

    // --- SEO: Page Title and Meta Description Management ---
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
    const [sessions, setSessions] = useState(() => { // Renamed from users to sessions for clarity
        const savedSessions = localStorage.getItem('Qualify Key');
        return savedSessions ? JSON.parse(savedSessions) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    // State to store fastest lap data for Qualifying sessions
    const [qualifyingFastestLapsData, setQualifyingFastestLapsData] = useState({});

    // State to store fastest lap data for Race sessions
    const [raceFastestLapsData, setRaceFastestLapsData] = useState({});


    useEffect(() => {
        async function fetchSessionData() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);
                if (!response.ok) {
                    throw new Error(`Erro ao buscar sessões: ${response.statusText}`);
                }
                const fetchedSessions = await response.json();
                setSessions(fetchedSessions);
                localStorage.setItem('Qualify Key', JSON.stringify(fetchedSessions));

                // --- FETCHING BEST LAPS FOR RACE SESSIONS ---
                const raceSessions = fetchedSessions.filter(session => session.session_name === 'Race');
                const raceFastestLapsPromises = raceSessions.map(async (race) => {
                    try {
                        const lapsResponse = await fetch(`https://api.openf1.org/v1/laps?session_key=${race.session_key}&lap_duration>=0`);
                        if (!lapsResponse.ok) {
                            console.warn(`Erro ao buscar voltas para a sessão de Corrida ${race.session_key}: ${lapsResponse.statusText}`);
                            return null;
                        }
                        const laps = await lapsResponse.json();

                        let fastestLap = null;
                        for (const lap of laps) {
                            if (lap.lap_duration && (fastestLap === null || lap.lap_duration < fastestLap.lap_duration)) {
                                fastestLap = lap;
                            }
                        }

                        if (!fastestLap) return null;

                        const driverResponse = await fetch(`https://api.openf1.org/v1/drivers?driver_number=${fastestLap.driver_number}&session_key=${race.session_key}`);
                        const driverData = await driverResponse.json();
                        const driverName = driverData.length > 0 ? driverData[0].broadcast_name : 'Desconhecido';

                        return {
                            session_key: race.session_key,
                            driverName: driverName,
                            lapTime: fastestLap.lap_duration,
                            teamColour: driverData.length > 0 ? driverData[0].team_colour : '666666' // Default grey color
                        };
                    } catch (innerError) {
                        console.error(`Erro ao processar sessão de Corrida ${race.session_key}:`, innerError);
                        return null;
                    }
                });

                const raceResults = await Promise.all(raceFastestLapsPromises);
                const newRaceFastestLapsData = {};
                raceResults.forEach(result => {
                    if (result) {
                        newRaceFastestLapsData[result.session_key] = result;
                    }
                });
                setRaceFastestLapsData(newRaceFastestLapsData);

                // --- FETCHING BEST LAPS FOR QUALIFYING SESSIONS ---
                const qualifySessions = fetchedSessions.filter(session => session.session_type === 'Qualifying');
                const qualifyFastestLapsPromises = qualifySessions.map(async (qualify) => {
                    try {
                        const lapsResponse = await fetch(`https://api.openf1.org/v1/laps?session_key=${qualify.session_key}&lap_duration>=0`);
                        if (!lapsResponse.ok) {
                            console.warn(`Erro ao buscar voltas para a sessão de Qualifying ${qualify.session_key}: ${lapsResponse.statusText}`);
                            return null;
                        }
                        const laps = await lapsResponse.json();

                        let fastestLap = null;
                        for (const lap of laps) {
                            if (lap.lap_duration && (fastestLap === null || lap.lap_duration < fastestLap.lap_duration)) {
                                fastestLap = lap;
                            }
                        }

                        if (!fastestLap) return null;

                        const driverResponse = await fetch(`https://api.openf1.org/v1/drivers?driver_number=${fastestLap.driver_number}&session_key=${qualify.session_key}`);
                        const driverData = await driverResponse.json();
                        const driverName = driverData.length > 0 ? driverData[0].broadcast_name : 'Desconhecido';

                        return {
                            session_key: qualify.session_key,
                            driverName: driverName,
                            lapTime: fastestLap.lap_duration,
                            teamColour: driverData.length > 0 ? driverData[0].team_colour : '666666' // Default grey color
                        };
                    } catch (innerError) {
                        console.error(`Erro ao processar sessão de Qualifying ${qualify.session_key}:`, innerError);
                        return null;
                    }
                });

                const qualifyResults = await Promise.all(qualifyFastestLapsPromises);
                const newQualifyingFastestLapsData = {};
                qualifyResults.forEach(result => {
                    if (result) {
                        newQualifyingFastestLapsData[result.session_key] = result;
                    }
                });
                setQualifyingFastestLapsData(newQualifyingFastestLapsData);


            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSessionData();
    }, [year]);

    console.log(error); // Keep this for debugging if needed

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
                        <div className="container">
                            <h1 className="title">Corridas - F1 {year}</h1>
                            <select value={year} onChange={(e) => setYear(e.target.value)} title="Selecione o ano para ver as corridas e qualificações de F1">
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>

                        {/* --- Race Session Cards --- */}
                        <article>
                            {loading ?
                                <Loading /> :
                                <>
                                    {raceSessionsFiltered.map((session) => (
                                        <div
                                            className="qualifying-card" // Use new card class
                                            key={session.session_key}
                                            onClick={() =>
                                                setFlippedCardKey(
                                                    flippedCardKey === session.session_key ? null : session.session_key
                                                )
                                            }
                                        >
                                            <div
                                                className={`qualifying-card-inner ${flippedCardKey === session.session_key ? "is-flipped" : ""}`} // Use new inner class
                                            >
                                                <div
                                                    className="qualifying-card-front" // Use new front class
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
                                                    className="qualifying-card-back" // Use new back class
                                                    style={{ backgroundColor: `#${raceFastestLapsData[session.session_key]?.teamColour || '21212c'}` }} // Team color or default
                                                >
                                                    {raceFastestLapsData[session.session_key] ? (
                                                        <>
                                                            <div className="qualifying-best-lap-background"
                                                                 style={{ color: `#${raceFastestLapsData[session.session_key].teamColour}28` }}>
                                                            </div>
                                                            <p>Melhor Volta: </p>
                                                            <p>{raceFastestLapsData[session.session_key].driverName} - {formatLapTime(raceFastestLapsData[session.session_key].lapTime)}</p>
                                                        </>
                                                    ) : (
                                                        <p>Melhor Volta: N/A ou Carregando</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            }
                        </article>

                        <h1 className="title">Qualifying - F1 {year}</h1>
                        {error && <p className="error">Error: {error}</p>}
                        <article className="qualifying-cards-container"> {/* Apply the new container class */}
                            {loading ?
                                <Loading /> :
                                <>
                                    {qualifySessionsFiltered.map((session) => (
                                        <div
                                            className="qualifying-card" // Use new card class
                                            key={session.session_key}
                                            onClick={() =>
                                                setFlippedCardKey(
                                                    flippedCardKey === session.session_key ? null : session.session_key
                                                )
                                            }
                                        >
                                            <div
                                                className={`qualifying-card-inner ${flippedCardKey === session.session_key ? "is-flipped" : ""}`} // Use new inner class
                                            >
                                                {/* --- Front of the Card (Session Info) --- */}
                                                <div
                                                    className="qualifying-card-front" // Use new front class
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
                                                    className="qualifying-card-back" // Use new back class
                                                    style={{ backgroundColor: `#${qualifyingFastestLapsData[session.session_key]?.teamColour || '21212c'}` }} // Team color or default
                                                >
                                                    {qualifyingFastestLapsData[session.session_key] ? (
                                                        <>
                                                            <div className="qualifying-best-lap-background" // Use new background class
                                                                 style={{ color: `#${qualifyingFastestLapsData[session.session_key].teamColour}28` }}>
                                                                {formatLapTime(qualifyingFastestLapsData[session.session_key].lapTime)}
                                                            </div>
                                                            <p>Melhor Volta: </p>
                                                            <p>{raceFastestLapsData[session.session_key].driverName} - {formatLapTime(raceFastestLapsData[session.session_key].lapTime)}</p>
                                                        </>
                                                    ) : (
                                                        <p>Melhor Volta: N/A ou Carregando</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            }
                        </article>
                    </>
                )}
            </section>
            <Footer />
        </>
    );
}

export default Qualifying;