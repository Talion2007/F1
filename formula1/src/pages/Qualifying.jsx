import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import SessionCard from "../components/SessionCard.jsx";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from "react-router-dom";
import "../styles/Page.css";
import "../styles/FlipCard.css";

// --- Funções Auxiliares de API e Cache ---

// Função para introduzir um atraso
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Função para buscar dados da API com retries e backoff exponencial
async function fetchWithRetry(url, retries = 5, initialDelayMs = 1000) { // Aumentado o delay inicial para 1 segundo
    let currentDelay = initialDelayMs;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) {
                console.warn(
                    `[API Warning] Rate limit hit for ${url}. Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`
                );
                await delay(currentDelay);
                currentDelay = Math.min(currentDelay * 2, 8000); // Aumenta o delay exponencialmente, até um máximo de 8 segundos
                continue; // Tenta novamente
            }
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} for ${url}`);
            }
            return response.json();
        } catch (error) {
            console.error(
                `[API Error] Failed to fetch ${url} (Attempt ${i + 1}/${retries}):`,
                error
            );
            if (i === retries - 1) {
                throw error; // Lança o erro após todas as tentativas falharem
            }
            await delay(currentDelay);
            currentDelay = Math.min(currentDelay * 2, 8000);
        }
    }
    return null; // Caso todas as retries falhem e não lancem erro (ex: em caso de um continue final)
}

// Helper para obter dados cacheados com TTL (Time-To-Live)
const getCachedDataWithTTL = (key, ttlMinutes = 24 * 60) => { // TTL padrão: 24 horas
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) {
        return null;
    }
    try {
        const parsedItem = JSON.parse(cachedItem);
        const now = Date.now();
        if (now - parsedItem.timestamp > ttlMinutes * 60 * 1000) {
            console.log(`[Cache] Cache for ${key} expired. Removing.`);
            localStorage.removeItem(key);
            return null;
        }
        console.log(`[Cache] Loaded data for ${key} from cache.`);
        return parsedItem.data;
    } catch (e) {
        console.error(`[Cache Error] Error parsing cached data for ${key}:`, e);
        localStorage.removeItem(key); // Remove cache corrompido
        return null;
    }
};

// Helper para salvar dados no cache com TTL
const setCachedDataWithTTL = (key, data) => {
    const itemToStore = {
        timestamp: Date.now(),
        data: data,
    };
    localStorage.setItem(key, JSON.stringify(itemToStore));
    console.log(`[Cache] Data for ${key} saved to cache.`);
};

// --- Componente Qualifying ---

function Qualifying() {
    const { currentUser } = useAuth();
    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("f1SelectedYear");
        return savedYear ? JSON.parse(savedYear) : "2025";
    });

    // Estados para os dados das sessões e dos melhores tempos
    const [sessions, setSessions] = useState([]);
    const [qualifyingFastestLapsData, setQualifyingFastestLapsData] = useState({});

    // Estados de carregamento e erro
    const [loadingSessions, setLoadingSessions] = useState(true); // Começa como true, já que sempre tentará carregar
    const [loadingFastestLaps, setLoadingFastestLaps] = useState(true); // Começa como true
    const [error, setError] = useState(null);

    // Estado para controlar qual card está virado
    const [flippedCardKey, setFlippedCardKey] = useState(null);

    // Efeito para atualizar o título e a meta descrição da página
    useEffect(() => {
        document.title = `Qualifying - Calendário ${year} | Fórmula 1 - Statistics`;
        const metaDescription = document.querySelector('meta[name="description"]') || document.createElement("meta");
        if (!metaDescription.parentNode) {
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira os resultados das sessões de Classificação (Qualifying) da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;
    }, [year]);

    // Efeito para lidar com a autenticação e carregamento inicial de dados (sessões e laps do cache)
    useEffect(() => {
        if (!currentUser) {
            setSessions([]);
            setQualifyingFastestLapsData({});
            setLoadingSessions(false);
            setLoadingFastestLaps(false);
            return;
        }

        // Tenta carregar do cache ao iniciar ou mudar o ano
        const cachedSessions = getCachedDataWithTTL(`f1QualifyingSessions_${year}`);
        if (cachedSessions) {
            setSessions(cachedSessions);
            setLoadingSessions(false); // Já temos as sessões
        } else {
            setLoadingSessions(true); // Precisamos buscar as sessões
        }

        const cachedFastestLaps = getCachedDataWithTTL(`f1QualifyingFastestLaps_${year}`);
        if (cachedFastestLaps) {
            setQualifyingFastestLapsData(cachedFastestLaps);
        } else {
            setQualifyingFastestLapsData({}); // Limpa se não tiver cache para o ano
        }
        setLoadingFastestLaps(true); // Sempre consideramos que vamos verificar ou buscar laps
        setError(null);
    }, [year, currentUser]); // Roda quando o ano ou o usuário muda

    // Função useCallback para buscar dados da melhor volta de uma sessão
    const fetchBestLapData = useCallback(async (session) => {
        // Tenta pegar do cache local do estado primeiro para evitar chamadas duplicadas
        if (qualifyingFastestLapsData[session.session_key]) {
            return qualifyingFastestLapsData[session.session_key];
        }

        try {
            // Busca os laps
            const laps = await fetchWithRetry(
                `https://api.openf1.org/v1/laps?session_key=${session.session_key}&lap_duration>=0`
            );
            if (!laps || laps.length === 0) return null;

            let fastestLap = null;
            for (const lap of laps) {
                if (lap.lap_duration && (fastestLap === null || lap.lap_duration < fastestLap.lap_duration)) {
                    fastestLap = lap;
                }
            }
            if (!fastestLap) return null;

            // Adiciona um delay entre a busca de laps e drivers para mitigar rate limit
            await delay(500); // Aumentado para 500ms para ser mais seguro

            // Busca os dados do piloto
            const driverData = await fetchWithRetry(
                `https://api.openf1.org/v1/drivers?driver_number=${fastestLap.driver_number}&session_key=${session.session_key}`
            );
            const driverName = driverData && driverData.length > 0 ? driverData[0].broadcast_name : "Desconhecido";
            const teamColour = driverData && driverData.length > 0 ? driverData[0].team_colour : "666666";

            return {
                session_key: session.session_key,
                driverName: driverName,
                lapTime: fastestLap.lap_duration,
                teamColour: teamColour,
            };
        } catch (innerError) {
            console.error(
                `[Fetch Error] Error processing fastest lap for session ${session.session_key}:`,
                innerError
            );
            return null;
        }
    }, [qualifyingFastestLapsData]); // Adicionado qualifyingFastestLapsData como dependência para acessar o estado atual

    // Efeito para carregar as sessões de qualificação da API
    useEffect(() => {
        const loadQualifyingSessions = async () => {
            if (!currentUser) return; // Não faz nada se não houver usuário autenticado

            setLoadingSessions(true);
            setError(null);

            try {
                // Só busca se não houver sessões já carregadas OU se o cache estiver vazio/expirado
                if (sessions.length === 0 || !getCachedDataWithTTL(`f1QualifyingSessions_${year}`)) {
                    console.log(`[Fetch] Fetching sessions for ${year} from API...`);
                    const fetchedSessions = await fetchWithRetry(
                        `https://api.openf1.org/v1/sessions?year=${year}`
                    );
                    if (!fetchedSessions || fetchedSessions.length === 0) {
                        throw new Error("No sessions found for the selected year.");
                    }
                    const qualifyingSessions = fetchedSessions.filter(
                        (session) => session.session_type === "Qualifying"
                    );
                    setSessions(qualifyingSessions);
                    setCachedDataWithTTL(`f1QualifyingSessions_${year}`, qualifyingSessions);
                }
            } catch (err) {
                setError(err.message);
                console.error("[Error] Error loading sessions:", err);
                setSessions([]); // Limpa as sessões em caso de erro
            } finally {
                setLoadingSessions(false);
            }
        };

        // Garante que o efeito só rode se as sessões ainda não foram carregadas para o ano atual
        // ou se o currentUser mudou e o cache está vazio.
        if (currentUser && (sessions.length === 0 || sessions[0]?.date?.substring(0,4) !== year)) {
             loadQualifyingSessions();
        } else if (currentUser && sessions.length > 0) {
             setLoadingSessions(false); // Já temos as sessões carregadas
        }

    }, [year, currentUser, sessions]); // `sessions` é uma dependência para garantir que o efeito rode se o estado `sessions` estiver vazio

    // Efeito para carregar os melhores tempos de volta APÓS as sessões estarem carregadas
    useEffect(() => {
        const loadFastestLaps = async () => {
            if (!currentUser || sessions.length === 0) {
                setLoadingFastestLaps(false);
                return;
            }

            // Verifica se há alguma volta faltando para buscar, ignorando as que já estão no cache do estado
            const missingLaps = sessions.filter(
                session => !qualifyingFastestLapsData[session.session_key]
            );

            if (missingLaps.length === 0) {
                setLoadingFastestLaps(false); // Todas as voltas já estão no cache/estado
                return;
            }

            setLoadingFastestLaps(true);
            let tempFastestLapsData = { ...qualifyingFastestLapsData }; // Cria uma cópia para acumular os resultados

            for (const session of missingLaps) { // Itera apenas sobre as sessões que faltam dados
                console.log(`[Fetch] Fetching fastest lap for session ${session.session_key}...`);
                const data = await fetchBestLapData(session);
                if (data) {
                    tempFastestLapsData = {
                        ...tempFastestLapsData,
                        [data.session_key]: data
                    };
                    // Atualiza o estado para que os cards mostrem o tempo assim que ele chega
                    setQualifyingFastestLapsData(current => ({
                        ...current,
                        [data.session_key]: data
                    }));
                }
                await delay(1200); // Aumentado o delay entre cada sessão para 1.2 segundos
            }

            // Salva o objeto completo de fastestLapsData no cache do localStorage
            setCachedDataWithTTL(`f1QualifyingFastestLaps_${year}`, tempFastestLapsData);
            setLoadingFastestLaps(false);
        };

        // Garante que a busca de laps só comece depois que as sessões estiverem carregadas
        // e se ainda houver laps para buscar (não tudo em cache)
        if (currentUser && !loadingSessions && sessions.length > 0) {
            loadFastestLaps();
        } else if (currentUser && !loadingSessions && sessions.length === 0 && !error) {
            // Se as sessões carregaram e estão vazias (e não há erro), não há laps para buscar
            setLoadingFastestLaps(false);
        }

    }, [year, sessions, currentUser, loadingSessions, fetchBestLapData, qualifyingFastestLapsData, error]); // Adicionado dependências

    // Renderização do componente
    const qualifySessionsDisplay = sessions.filter(
        (session) => session.session_type === "Qualifying"
    );

    return (
        <>
            <Header />
            <section>
                {!currentUser ? (
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Qualificações - F1</h1>
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
                            <h1 className="title">Qualificações - F1 {year}</h1>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                title="Selecione o ano para ver os Qualifyings de F1"
                            >
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>

                        {loadingSessions && !error && (
                            <>
                                <br />
                                <Loading />
                                <p className="loading-message">Carregando sessões de qualificação...</p>
                            </>
                        )}

                        {error && <p className="error">Error: {error}</p>}

                        <article className="qualifying-cards-container">
                            {!loadingSessions && qualifySessionsDisplay.length > 0
                                ? qualifySessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={qualifyingFastestLapsData[session.session_key]}
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))
                                : !loadingSessions && !error && <p>Nenhuma Classificação encontrada para {year}.</p>
                            }
                            {/* Mensagem de carregamento dos tempos de volta, visível apenas se sessões já carregaram */}
                            {!loadingSessions && loadingFastestLaps && sessions.length > 0 && (
                                <p className="loading-message-small">Carregando tempos de volta mais rápidos...</p>
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