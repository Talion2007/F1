import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import SessionCard from "../components/SessionCard.jsx";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from "react-router-dom";
import "../styles/Page.css";
import "../styles/FlipCard.css";

// --- Funções Auxiliares de API e Cache ---

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 5, initialDelayMs = 1000) {
    let currentDelay = initialDelayMs;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) {
                console.warn(
                    `[API Warning] Rate limit hit for ${url}. Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`
                );
                await delay(currentDelay);
                currentDelay = Math.min(currentDelay * 2, 8000);
                continue;
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
                throw error;
            }
            await delay(currentDelay);
            currentDelay = Math.min(currentDelay * 2, 8000);
        }
    }
    return null;
}

const DEFAULT_CACHE_TTL_MINUTES = 60; // 1 hora de cache

const getCachedDataWithTTL = (key, ttlMinutes = DEFAULT_CACHE_TTL_MINUTES) => {
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
        const yearFromKey = key.split('_').pop();

        // --- MODIFICAÇÃO AQUI: Apenas valida o ano para sessões usando a data ---
        if (key.startsWith('f1PracticeSessions_') && parsedItem.data && Array.isArray(parsedItem.data) && parsedItem.data.length > 0) {
            // Certifica-se de que a data está presente antes de tentar substring
            const dataYear = parsedItem.data[0]?.date ? parsedItem.data[0].date.substring(0, 4) : null;
            if (dataYear && dataYear !== yearFromKey) {
                console.log(`[Cache] Data for ${key} belongs to a different year (${dataYear} vs ${yearFromKey}). Removing.`);
                localStorage.removeItem(key);
                return null;
            }
        }
        // Não precisamos validar o ano para 'fastestLaps' aqui da mesma forma,
        // pois eles são associados por `session_key` e a validação do ano
        // já ocorreu nas sessões que os contêm.

        console.log(`[Cache] Loaded data for ${key} from cache.`);
        return parsedItem.data;
    } catch (e) {
        console.error(`[Cache Error] Error parsing cached data for ${key}:`, e);
        localStorage.removeItem(key);
        return null;
    }
};

const setCachedDataWithTTL = (key, data, ttlMinutes = DEFAULT_CACHE_TTL_MINUTES) => {
    const itemToStore = {
        timestamp: Date.now(),
        data: data,
    };
    localStorage.setItem(key, JSON.stringify(itemToStore));
    console.log(`[Cache] Data for ${key} saved to cache.`);
};

// --- Componente Practices ---

function Practices() {
    const { currentUser } = useAuth();

    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("f1SelectedYear");
        return savedYear ? JSON.parse(savedYear) : "2025";
    });

    const [allSessions, setAllSessions] = useState({});
    const [allPracticesFastestLapsData, setAllPracticesFastestLapsData] = useState({});

    // Use isCurrentYearLoading para o loading do ano selecionado
    const [isCurrentYearLoading, setIsCurrentYearLoading] = useState(true);
    // Use isPreloadingBackground para indicar que a pré-carga de outros anos está acontecendo
    const [isPreloadingBackground, setIsPreloadingBackground] = useState(true);

    const [currentYearError, setCurrentYearError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    // Use um ref para controlar se o processo de pré-carga já está em andamento
    const isPreloadingRef = useRef(false);

    // --- Helper para buscar sessões de treinos para um ano específico ---
    const fetchAndCacheSessionsForYear = useCallback(async (targetYear) => {
        try {
            const cachedSessions = getCachedDataWithTTL(`f1PracticeSessions_${targetYear}`);
            if (cachedSessions && cachedSessions.length > 0) {
                setAllSessions(prev => ({ ...prev, [targetYear]: cachedSessions }));
                console.log(`[Cache] Practice sessions for ${targetYear} loaded from cache.`);
                return cachedSessions;
            } else {
                console.log(`[Fetch] Fetching practice sessions for ${targetYear} from API...`);
                const fetchedSessions = await fetchWithRetry(
                    `https://api.openf1.org/v1/sessions?year=${targetYear}`
                );
                // Filtrar para sessões de treino relevantes
                const relevantSessions = fetchedSessions.filter(
                    (session) =>
                        session.session_type === "Practice" &&
                        (session.session_name === "Practice 1" ||
                            session.session_name === "Practice 2" ||
                            session.session_name === "Practice 3")
                ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Opcional: ordenar por data

                if (relevantSessions.length === 0) {
                    console.warn(`[No Data] No relevant practice sessions found for year ${targetYear}.`);
                }

                setAllSessions(prev => ({ ...prev, [targetYear]: relevantSessions }));
                setCachedDataWithTTL(`f1PracticeSessions_${targetYear}`, relevantSessions);
                return relevantSessions;
            }
        } catch (err) {
            console.error(`[Error] Error loading practice sessions for ${targetYear}:`, err);
            // Se o erro for para o ano atualmente selecionado, mostra uma mensagem específica
            if (targetYear === year) {
                setCurrentYearError(`Não foi possível carregar as sessões de treino para ${targetYear}. Por favor, tente novamente.`);
            }
            return [];
        }
    }, [year]);

    // --- Helper para buscar dados de melhor volta para uma sessão (adaptado para treinos) ---
    const fetchBestLapData = useCallback(async (session) => {
        try {
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

            // Adiciona um pequeno delay para evitar sobrecarga na API se muitas requisições forem feitas em sequência
            await delay(500);

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
    }, []);

    // --- Helper para buscar e cachear resultados de voltas rápidas para um ano ---
    const fetchAndCacheFastestLapsForYear = useCallback(async (targetYear, sessionsForYear) => {
        if (!sessionsForYear || sessionsForYear.length === 0) {
            console.log(`[Fastest Laps] No practice sessions to fetch fastest laps for year ${targetYear}.`);
            return;
        }

        console.log(`[Processing] Fetching fastest laps for year ${targetYear}...`);

        let currentFastestLaps = getCachedDataWithTTL(`f1PracticesFastestLaps_${targetYear}`) || {};
        let updatedAny = false;

        for (const session of sessionsForYear) {
            if (!currentFastestLaps[session.session_key]) {
                try {
                    const data = await fetchBestLapData(session);
                    if (data) {
                        currentFastestLaps[data.session_key] = data;
                        setAllPracticesFastestLapsData(prev => ({
                            ...prev,
                            [targetYear]: {
                                ...(prev[targetYear] || {}),
                                [data.session_key]: data
                            }
                        }));
                        updatedAny = true;
                    }
                    await delay(500); // Atraso entre chamadas da API para voltas rápidas
                } catch (err) {
                    console.error(`[Error] Failed to fetch fastest lap for session ${session.session_key} in year ${targetYear}:`, err);
                }
            } else {
                // Se já cacheado, garante que o estado do React reflita isso
                setAllPracticesFastestLapsData(prev => ({
                    ...prev,
                    [targetYear]: {
                        ...(prev[targetYear] || {}),
                        [session.session_key]: currentFastestLaps[session.session_key]
                    }
                }));
            }
        }

        if (updatedAny || Object.keys(currentFastestLaps).length > 0) {
            setCachedDataWithTTL(`f1PracticesFastestLaps_${targetYear}`, currentFastestLaps);
            console.log(`[Cache] Fastest laps for ${targetYear} saved to cache.`);
        }
    }, [fetchBestLapData]);

    // --- Efeito principal para pré-carregar dados e gerenciar o estado de carregamento ---
    useEffect(() => {
        if (!currentUser) {
            setIsCurrentYearLoading(false);
            setIsPreloadingBackground(false);
            setCurrentYearError("Por favor, faça login para visualizar os dados.");
            setAllSessions({});
            setAllPracticesFastestLapsData({});
            return;
        }

        // Evita que o useEffect seja executado múltiplas vezes devido a re-renders
        if (isPreloadingRef.current) {
            return;
        }

        isPreloadingRef.current = true;
        setIsPreloadingBackground(true); // Indica que o processo de pré-carga está ativo em segundo plano

        const preloadAllYearsData = async () => {
            const yearsToLoad = ["2025", "2024", "2023"];
            let sessionsForCurrentYearLoaded = false;

            setCurrentYearError(null);
            setIsCurrentYearLoading(true); // Assume que o ano atual está carregando

            // --- FASE 1: Buscar e cachear TODAS AS SESSÕES para cada ano ---
            for (const targetYear of yearsToLoad) {
                console.log(`[Preload] Starting data load for year: ${targetYear}`);
                const sessions = await fetchAndCacheSessionsForYear(targetYear);

                // Se o ano que estamos processando é o ano selecionado pelo usuário
                // e as sessões para ele foram carregadas com sucesso.
                if (targetYear === year && sessions && sessions.length > 0 && !sessionsForCurrentYearLoaded) {
                    setIsCurrentYearLoading(false); // **DESLIGA O LOADING AQUI!**
                    sessionsForCurrentYearLoaded = true;
                    console.log(`[Loading] Loading for year ${year} sessions turned off.`);
                } else if (targetYear === year && (!sessions || sessions.length === 0) && !sessionsForCurrentYearLoaded) {
                    // Se não há sessões para o ano atual, desliga o loading e mostra erro.
                    setCurrentYearError(`Nenhum Treino Livre encontrado para ${year}.`);
                    setIsCurrentYearLoading(false);
                    sessionsForCurrentYearLoaded = true;
                }

                if (targetYear !== yearsToLoad[yearsToLoad.length - 1]) {
                    await delay(500); // Pequeno atraso entre o carregamento das SESSÕES de cada ano
                }
            }
            console.log("[Preload] Fase 1: Todas as sessões buscadas e cacheadas.");

            // --- FASE 2: Buscar MELHORES TEMPOS (pode ser em segundo plano) ---
            for (const targetYear of yearsToLoad) {
                const sessionsForYear = allSessions[targetYear]; // Obtém as sessões do estado
                if (sessionsForYear && sessionsForYear.length > 0) {
                    await fetchAndCacheFastestLapsForYear(targetYear, sessionsForYear);
                } else {
                    console.log(`[Preload] No sessions found for ${targetYear}, skipping fastest lap fetch.`);
                    // Se o ano atual não teve sessões na Fase 1 e é o ano selecionado, garante a mensagem de erro
                    if (targetYear === year && !currentYearError && !sessionsForCurrentYearLoaded) {
                        setCurrentYearError(`Nenhum Treino Livre encontrado para ${year}.`);
                        setIsCurrentYearLoading(false);
                    }
                }
            }
            console.log("[Preload] Fase 2: Todas as voltas rápidas buscadas e cacheadas.");

            setIsPreloadingBackground(false); // Sinaliza que a pré-carga completa terminou
            isPreloadingRef.current = false;
            console.log("[Preload] Todos os anos pré-carregados.");

            // Apenas para garantir que o loading seja desligado no final, se algo deu errado antes.
            if (isCurrentYearLoading && !sessionsForCurrentYearLoaded) {
                setIsCurrentYearLoading(false);
            }
        };

        preloadAllYearsData();

    }, [currentUser, year, fetchAndCacheSessionsForYear, fetchAndCacheFastestLapsForYear]);
    // Removendo allSessions e allPracticesFastestLapsData das dependências 
    // para evitar loop, pois essas são as states que estão sendo ATUALIZADAS.

    // --- Efeito para gerenciar o loading do ANO ATUAL quando o 'year' muda ---
    // Este useEffect agora simplesmente redefine o loading para 'true' 
    // e permite que o useEffect principal o desligue.
    useEffect(() => {
        if (!currentUser) return;

        // Ativa o loading sempre que o ano muda, permitindo que o useEffect principal o desative.
        setIsCurrentYearLoading(true);
        setCurrentYearError(null); // Limpa erros quando o ano muda

    }, [year, currentUser]); // Apenas 'year' e 'currentUser' são as dependências.

    // --- Efeito para atualizar o título da página ---
    useEffect(() => {
        document.title = `Treinos Livres - Calendário ${year} | Fórmula 1 - Statistics`;
        const metaDescription = document.querySelector('meta[name="description"]') || document.createElement("meta");
        if (!metaDescription.parentNode) {
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira os resultados das sessões de Treinos Livres da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;
    }, [year]);

    // --- Efeito para salvar o ano selecionado no localStorage ---
    useEffect(() => {
        localStorage.setItem("f1SelectedYear", JSON.stringify(year));
    }, [year]);

    // --- Lógica de exibição baseada no ano selecionado ---
    const currentYearSessions = allSessions[year] || [];
    const currentYearFastestLaps = allPracticesFastestLapsData[year] || {};

    const fp1SessionsDisplay = currentYearSessions.filter(
        (session) => session.session_name === "Practice 1"
    );
    const fp2SessionsDisplay = currentYearSessions.filter(
        (session) => session.session_name === "Practice 2"
    );
    const fp3SessionsDisplay = currentYearSessions.filter(
        (session) => session.session_name === "Practice 3"
    );

    const showOverallLoading = isCurrentYearLoading;

    // Mensagem a ser exibida se não houver usuário logado
    if (!currentUser) {
        return (
            <>
                <Header />
                <section>
                    <div className="LoginMessage Block">
                        <div>
                            <h1 className="title">Treinos Livres - F1 </h1>
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
                </section>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <section>
                <div className="container tags">
                    <h1 className="title">Treinos Livres - F1 {year}</h1>
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        title="Selecione o ano para ver os treinos livres de F1"
                    >
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                    </select>
                </div>

                {showOverallLoading && !currentYearError && (
                    <>
                        <br />
                        <Loading />
                        <p className="loading-message">
                            Carregando dados para o ano {year}...
                        </p>
                    </>
                )}

                {currentYearError && <p className="error">Error: {currentYearError}</p>}

                {!showOverallLoading && !currentYearError && (
                    <article className="qualifying-cards-container">
                        {fp1SessionsDisplay.length > 0
                            ? fp1SessionsDisplay.map((session) => (
                                <SessionCard
                                    key={session.session_key}
                                    session={session}
                                    fastestLapData={currentYearFastestLaps[session.session_key]}
                                    flippedCardKey={flippedCardKey}
                                    setFlippedCardKey={setFlippedCardKey}
                                />
                            ))
                            : <p>Nenhum Treino Livre 1 encontrado para {year}.</p>}

                        {fp2SessionsDisplay.length > 0
                            ? fp2SessionsDisplay.map((session) => (
                                <SessionCard
                                    key={session.session_key}
                                    session={session}
                                    fastestLapData={currentYearFastestLaps[session.session_key]}
                                    flippedCardKey={flippedCardKey}
                                    setFlippedCardKey={setFlippedCardKey}
                                />
                            ))
                            : <p>Nenhum Treino Livre 2 encontrado para {year}.</p>}

                        {fp3SessionsDisplay.length > 0
                            ? fp3SessionsDisplay.map((session) => (
                                <SessionCard
                                    key={session.session_key}
                                    session={session}
                                    fastestLapData={currentYearFastestLaps[session.session_key]}
                                    flippedCardKey={flippedCardKey}
                                    setFlippedCardKey={setFlippedCardKey}
                                />
                            ))
                            : <p>Nenhum Treino Livre 3 encontrado para {year}.</p>}
                    </article>
                )}
            </section>
            <Footer />
        </>
    );
}

export default Practices;