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
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Helper for retries with exponential backoff
async function fetchWithRetry(url, retries = 5, delayMs = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) {
                console.warn(
                    `Rate limit hit for ${url}. Retrying in ${delayMs}ms... (Attempt ${i + 1
                    }/${retries})`
                );
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
                console.error(
                    `Failed to fetch ${url} after ${retries} attempts:`,
                    error
                );
                throw error;
            }
            console.warn(
                `Fetch error for ${url}. Retrying in ${delayMs}ms... (Attempt ${i + 1
                }/${retries})`,
                error
            );
            await delay(delayMs);
            delayMs *= 2; // Exponential backoff
        }
    }
    return null;
}

function Races() {
    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("f1SelectedYear");
        return savedYear ? JSON.parse(savedYear) : "2024";
    });

    useEffect(() => {
        document.title = `Races - Calendario ${year} | Fórmula 1 - Statistics`;
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement("meta");
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira os resultados das sessões de Corridas (Races) da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;
        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, [year]);

    const { currentUser } = useAuth();

    // --- MUDANÇA PRINCIPAL AQUI: Inicialização Inteligente do Estado ---
    const [sessions, setSessions] = useState(() => {
        if (currentUser) {
            const savedSessions = localStorage.getItem("f1RaceSessions");
            const parsedSavedSessions = savedSessions ? JSON.parse(savedSessions) : [];
            const isStoredDataForCurrentYear =
                parsedSavedSessions.length > 0 &&
                parsedSavedSessions[0].year === parseInt(year);

            // Retorna as sessões do cache se forem válidas para o ano atual e usuário logado
            if (isStoredDataForCurrentYear) {
                return parsedSavedSessions;
            }
        }
        return []; // Caso contrário, array vazio
    });

    const [loading, setLoading] = useState(() => {
        if (!currentUser) {
            return false; // Se não logado, não está carregando
        }
        
        // Verifica se já há dados em cache válidos para o ano atual; se sim, não está carregando inicialmente
        const savedSessions = localStorage.getItem("f1RaceSessions");
        if (savedSessions) {
            const parsedSavedSessions = JSON.parse(savedSessions);
            if (parsedSavedSessions.length > 0 && parsedSavedSessions[0].year === parseInt(year)) {
                return false; // Dados válidos em cache para o ano atual, não precisa carregar inicialmente
            }
        }
        return true; // Precisa carregar, ou sem dados ou ano diferente
    });
    // --- FIM DA MUDANÇA PRINCIPAL ---

    const [error, setError] = useState(null);
    const [flippedCardKey, setFlippedCardKey] = useState(null);
    const [raceFastestLapsData, setRaceFastestLapsData] = useState({});

    const fetchBestLapData = useCallback(async (session, type) => {
        try {
            const laps = await fetchWithRetry(
                `https://api.openf1.org/v1/laps?session_key=${session.session_key}&lap_duration>=0`
            );
            if (!laps || laps.length === 0) return null;
            let fastestLap = null;
            for (const lap of laps) {
                if (
                    lap.lap_duration &&
                    (fastestLap === null || lap.lap_duration < fastestLap.lap_duration)
                ) {
                    fastestLap = lap;
                }
            }
            if (!fastestLap) return null;
            const driverData = await fetchWithRetry(
                `https://api.openf1.org/v1/drivers?driver_number=${fastestLap.driver_number}&session_key=${session.session_key}`
            );
            const driverName =
                driverData && driverData.length > 0
                    ? driverData[0].broadcast_name
                    : "Desconhecido";
            const teamColour =
                driverData && driverData.length > 0
                    ? driverData[0].team_colour
                    : "666666";
            return {
                session_key: session.session_key,
                driverName: driverName,
                lapTime: fastestLap.lap_duration,
                teamColour: teamColour,
            };
        } catch (innerError) {
            console.error(
                `Error processing ${type} session ${session.session_key}:`,
                innerError
            );
            return null;
        }
    }, []);

    useEffect(() => {
        async function fetchRaceData() {
            setLoading(true); // Inicia o loading ao começar a busca
            setError(null);
            try {
                const fetchedSessions = await fetchWithRetry(
                    `https://api.openf1.org/v1/sessions?year=${year}`
                );
                if (!fetchedSessions || fetchedSessions.length === 0) {
                    throw new Error("No sessions found for the selected year.");
                }

                const relevantSessions = fetchedSessions.filter(
                    (session) => session.session_type === "Race"
                );

                setSessions(relevantSessions); // Atualiza sessões aqui
                localStorage.setItem(
                    "f1RaceSessions",
                    JSON.stringify(relevantSessions)
                );

                const newRaceFastestLapsData = {};
                for (const session of relevantSessions) {
                    const data = await fetchBestLapData(session, "Race");
                    if (data) {
                        newRaceFastestLapsData[data.session_key] = data;
                    }
                    await delay(200);
                }
                setRaceFastestLapsData(newRaceFastestLapsData);

            } catch (err) {
                setError(err.message);
                console.error("Error in fetchRaceData:", err);
            } finally {
                setLoading(false); // Sempre para o loading quando a busca termina (sucesso ou erro)
            }
        }

        // Lógica de autenticação e carregamento de dados DENTRO do useEffect
        if (!currentUser) {
            // Se deslogado, limpa os dados e define loading como false
            setLoading(false);
            setSessions([]);
            setRaceFastestLapsData({});
            return; // Sai do useEffect para não tentar buscar dados
        }

        const storedSessions = localStorage.getItem("f1RaceSessions");
        const parsedStoredSessions = storedSessions ? JSON.parse(storedSessions) : [];
        const isStoredDataForCurrentYear =
            parsedStoredSessions.length > 0 &&
            parsedStoredSessions[0].year === parseInt(year);

        // Dispara a busca de dados da API SE:
        // 1. Não há dados válidos em cache para o ano atual, OU
        // 2. O estado 'sessions' está vazio (isso pode acontecer na montagem inicial se não houver cache válido), OU
        // 3. O 'year' mudou no seletor e os dados no estado atual não correspondem.
        if (!isStoredDataForCurrentYear || sessions.length === 0 || (sessions.length > 0 && sessions[0].year !== parseInt(year))) {
            fetchRaceData();
        }
        // Se a condição acima for falsa, significa que os dados já estão no estado
        // (carregados pela inicialização do useState ou já presentes de uma busca anterior),
        // e o `loading` já foi definido como `false` pela inicialização do useState.
        // Não precisamos fazer `setSessions` ou `setLoading(false)` novamente aqui,
        // pois isso causaria o loop.

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, fetchBestLapData, currentUser]); // As dependências são importantes!

    useEffect(() => {
        localStorage.setItem("f1SelectedYear", JSON.stringify(year));
    }, [year]);

    const raceSessionsDisplay = sessions.filter(
        (session) => session.session_type === "Race"
    );

    return (
        <>
            <Header />
            <section>
                {!currentUser ? (
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Races - F1</h1>
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
                            <h1 className="title">Races - F1 {year}</h1>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                title="Selecione o ano para ver as Corridas de F1"
                            >
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>

                        {/* Loading aparece aqui, abaixo do seletor de ano */}
                        {loading && (
                            <>
                                <br />
                                <Loading />
                            </>
                        )}

                        {error && <p className="error">Error: {error}</p>}

                        <article className="qualifying-cards-container"> {/* Mantive essa classe, mas pode ser "race-cards-container" se houver CSS específico */}
                            {raceSessionsDisplay.length > 0 && !loading
                                ? raceSessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={raceFastestLapsData[session.session_key]}
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))
                                : !loading && !error && <p>Nenhuma Corrida encontrada para {year}.</p>
                            }
                        </article>
                    </>
                )}
            </section>
            <Footer />
        </>
    );
}

export default Races;