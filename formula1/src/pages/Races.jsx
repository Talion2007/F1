import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import SessionCard from "../components/SessionCard.jsx";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from '../context/AuthContext.jsx'; // Reintroduzindo useAuth
import { Link } from "react-router-dom"; // Reintroduzindo Link
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

    const { currentUser } = useAuth(); // Reintroduzindo o hook de autenticação

    const [sessions, setSessions] = useState(() => {
        // Inicializa sessions a partir do localStorage APENAS se o usuário estiver logado
        // Caso contrário, retorna um array vazio.
        const savedSessions = localStorage.getItem("f1RaceSessions"); // Chave específica para Races
        return currentUser && savedSessions ? JSON.parse(savedSessions) : [];
    });

    const [loading, setLoading] = useState(() => {
        // Inicializa loading de forma inteligente:
        // - Se não há currentUser, não está carregando (o conteúdo restrito será exibido).
        // - Se há currentUser, verifica o localStorage para o ano atual.
        //   Se encontrar dados válidos, inicia como false.
        //   Caso contrário, inicia como true para iniciar a busca.
        if (!currentUser) {
            return false;
        }

        const savedSessions = localStorage.getItem("f1RaceSessions"); // Chave específica para Races
        if (savedSessions) {
            const parsedSavedSessions = JSON.parse(savedSessions);
            if (parsedSavedSessions.length > 0 && parsedSavedSessions[0].year === parseInt(year)) {
                return false; // Dados válidos em cache para o ano atual, não precisa carregar inicialmente
            }
        }
        return true; // Precisa carregar, ou sem dados ou ano diferente
    });

    const [error, setError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    const [raceFastestLapsData, setRaceFastestLapsData] = useState({}); // Renomeado para raceFastestLapsData

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
        async function fetchRaceData() { // Renomeado para fetchRaceData
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

                setSessions(relevantSessions);
                localStorage.setItem(
                    "f1RaceSessions", // Chave específica para Races
                    JSON.stringify(relevantSessions)
                );
                // Não setamos loading para false aqui, esperamos pelos fastest laps.

                const newRaceFastestLapsData = {}; // Renomeado
                for (const session of relevantSessions) {
                    const data = await fetchBestLapData(session, "Race"); // Tipo "Race"
                    if (data) {
                        newRaceFastestLapsData[data.session_key] = data;
                    }
                    await delay(200);
                }
                setRaceFastestLapsData(newRaceFastestLapsData); // Renomeado

            } catch (err) {
                setError(err.message);
                console.error("Error in fetchRaceData:", err); // Renomeado
            } finally {
                setLoading(false); // Sempre para o loading quando a busca termina (sucesso ou erro)
            }
        }

        // Lógica de autenticação e carregamento de dados
        if (!currentUser) {
            setLoading(false); // Se não logado, não há carregamento de dados e limpa os estados
            setSessions([]);
            setRaceFastestLapsData({}); // Limpa dados de fastest laps
        } else {
            const storedSessions = localStorage.getItem("f1RaceSessions"); // Chave específica para Races
            const parsedStoredSessions = storedSessions ? JSON.parse(storedSessions) : [];
            const isStoredDataForCurrentYear =
                parsedStoredSessions.length > 0 &&
                parsedStoredSessions[0].year === parseInt(year);

            // Busca dados se:
            // 1. Não há dados armazenados para o ano atual.
            // 2. O estado de sessões está vazio (primeiro carregamento, ou localStorage vazio).
            // 3. O ano mudou no seletor e os dados em estado não correspondem.
            if (!isStoredDataForCurrentYear || sessions.length === 0 || (sessions.length > 0 && sessions[0].year !== parseInt(year))) {
                fetchRaceData();
            } else {
                // Se o usuário está logado e já temos dados válidos em cache para o ano atual,
                // apenas garantimos que o loading seja false e os dados sejam carregados no estado.
                setSessions(parsedStoredSessions);
                // Se fastestLapsData também fosse cacheado, carregaria aqui.
                setLoading(false);
            }
        }

    }, [year, fetchBestLapData, currentUser, sessions]); // Adicionado currentUser nas dependências

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
                {!currentUser ? ( // Lógica de autenticação reintroduzida
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
                            {raceSessionsDisplay.length > 0 && !loading // Renderiza cards APENAS se não estiver carregando
                                ? raceSessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={raceFastestLapsData[session.session_key]} // Usando raceFastestLapsData
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))
                                : !loading && !error && <p>Nenhuma Corrida encontrada para {year}.</p> // Mostra mensagem se não estiver carregando E não houver cards
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