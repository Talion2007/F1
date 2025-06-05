/* eslint-disable no-unused-vars */
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import SessionCard from "../components/SessionCard.jsx";
import { useState, useEffect, useCallback, useRef } from "react";
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
        if (parsedItem.data && Array.isArray(parsedItem.data) && parsedItem.data.length > 0 &&
            parsedItem.data[0]?.date?.substring(0, 4) !== yearFromKey &&
            parsedItem.data[0]?.session_key?.toString().substring(0, 4) !== yearFromKey) {
            console.log(`[Cache] Data for ${key} belongs to a different year (${parsedItem.data[0]?.date?.substring(0, 4) || parsedItem.data[0]?.session_key?.toString().substring(0, 4)} vs ${yearFromKey}). Removing.`);
            localStorage.removeItem(key);
            return null;
        }
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

// --- Componente Sprints ---

function Sprints() {
    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("f1SelectedYear");
        return savedYear ? JSON.parse(savedYear) : "2025";
    });

    const [allSessions, setAllSessions] = useState({});
    const [allSprintFastestLapsData, setAllSprintFastestLapsData] = useState({});

    // Este estado indica se os dados *básicos* para o ano atualmente selecionado foram carregados
    const [isLoadingCurrentYearData, setIsLoadingCurrentYearData] = useState(true);
    // Este estado indica se o processo de pré-carregamento para *todos* os anos está ativo
    const [isPreloadingAllYears, setIsPreloadingAllYears] = useState(true); // Manter este para debug/visibilidade

    const [currentYearError, setCurrentYearError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    const isPreloadingRef = useRef(false);

    // --- Helper para buscar sessões para um ano específico ---
    const fetchAndCacheSessionsForYear = useCallback(async (targetYear) => {
        try {
            const cachedSessions = getCachedDataWithTTL(`f1SprintSessions_${targetYear}`);
            if (cachedSessions && cachedSessions.length > 0) {
                // Atualiza o estado global com os dados em cache IMEDIATAMENTE
                setAllSessions(prev => ({ ...prev, [targetYear]: cachedSessions }));
                console.log(`[Cache] Sessions for ${targetYear} loaded from cache.`);
                return cachedSessions;
            } else {
                console.log(`[Fetch] Fetching sessions for ${targetYear} from API...`);
                const fetchedSessions = await fetchWithRetry(
                    `https://api.openf1.org/v1/sessions?year=${targetYear}`
                );
                if (!fetchedSessions || fetchedSessions.length === 0) {
                    throw new Error(`No sessions found for year ${targetYear}.`);
                }

                const relevantSessions = fetchedSessions.filter(
                    (session) =>
                        session.session_type === "Sprint" ||
                        session.session_name.includes("Sprint")
                );
                // Atualiza o estado global com os dados da API
                setAllSessions(prev => ({ ...prev, [targetYear]: relevantSessions }));
                setCachedDataWithTTL(`f1SprintSessions_${targetYear}`, relevantSessions);
                return relevantSessions;
            }
        } catch (err) {
            console.error(`[Error] Error loading sessions for ${targetYear}:`, err);
            // Se o erro for no ano atualmente selecionado, mostre uma mensagem específica
            if (targetYear === year) {
                setCurrentYearError(`Não foi possível carregar as sessões para ${targetYear}. Por favor, tente novamente.`);
            }
            return [];
        }
    }, [year]); // 'year' é uma dependência aqui para a mensagem de erro específica

    // --- Helper para buscar dados de melhor volta para uma sessão ---
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
            console.log(`No sessions to fetch fastest laps for year ${targetYear}.`);
            return;
        }

        console.log(`[Processing] Fetching fastest laps for year ${targetYear}...`);

        let currentFastestLaps = getCachedDataWithTTL(`f1SprintFastestLaps_${targetYear}`) || {};
        let updatedAny = false;

        for (const session of sessionsForYear) {
            // Verifica se o tempo de volta já está em cache para esta sessão
            if (!currentFastestLaps[session.session_key]) {
                try {
                    const data = await fetchBestLapData(session);
                    if (data) {
                        currentFastestLaps[data.session_key] = data;
                        setAllSprintFastestLapsData(prev => ({
                            ...prev,
                            [targetYear]: {
                                ...(prev[targetYear] || {}),
                                [data.session_key]: data
                            }
                        }));
                        updatedAny = true;
                    }
                    await delay(1500); // Aumentado o delay para 1.5s
                } catch (err) {
                    console.error(`[Error] Failed to fetch fastest lap for session ${session.session_key} in year ${targetYear}:`, err);
                }
            } else {
                // Se já estiver em cache, garanta que o estado React reflita isso
                setAllSprintFastestLapsData(prev => ({
                    ...prev,
                    [targetYear]: {
                        ...(prev[targetYear] || {}),
                        [session.session_key]: currentFastestLaps[session.session_key]
                    }
                }));
            }
        }

        if (updatedAny || Object.keys(currentFastestLaps).length > 0) {
            setCachedDataWithTTL(`f1SprintFastestLaps_${targetYear}`, currentFastestLaps);
            console.log(`[Cache] Fastest laps for ${targetYear} saved to cache.`);
        }
    }, [fetchBestLapData]);

    // --- Efeito para pré-carregar os dados de sessões e resultados para 2025, 2024, 2023 ---
    useEffect(() => {
        if (isPreloadingRef.current) {
            return;
        }

        isPreloadingRef.current = true;
        setIsPreloadingAllYears(true); // Indica que o processo de pré-carga de todos os anos começou

        const preloadAllYearsData = async () => {
            const yearsToLoad = ["2025", "2024", "2023"];
            let sessionsAcrossYears = {}; // Objeto para armazenar as sessões buscadas localmente

            setCurrentYearError(null); // Limpa qualquer erro anterior ao iniciar o preload
            setIsLoadingCurrentYearData(true); // Assume que o ano atual está carregando no início do processo

            // --- Fase 1: Buscar e cachear todas as sessões para todos os anos ---
            console.log("[Preload] Starting Phase 1: Fetching all sessions...");
            for (const targetYear of yearsToLoad) {
                const sessions = await fetchAndCacheSessionsForYear(targetYear);
                if (sessions && sessions.length > 0) {
                    sessionsAcrossYears[targetYear] = sessions;
                } else {
                    console.log(`[Preload] No sessions found for ${targetYear} in Phase 1.`);
                    // Se o ano atual não tiver sessões, mostre o erro e desative o loading
                    if (targetYear === year) {
                        setCurrentYearError(`Nenhuma Sprint encontrada para ${year}.`);
                        setIsLoadingCurrentYearData(false);
                    }
                }
                // Pequeno delay entre as buscas de sessões de anos diferentes
                if (targetYear !== yearsToLoad[yearsToLoad.length - 1]) {
                    await delay(500);
                }
            }
            console.log("[Preload] Phase 1: All sessions fetched and cached.");

            // Após a Fase 1, se não houver erro para o ano atual,
            // podemos potencialmente mostrar os cards SÓ com os dados de sessão
            // se preferir um carregamento progressivo, mas o requisito é carregar TUDO.

            // --- Fase 2: Buscar e cachear os melhores tempos de volta para todas as sessões em todos os anos ---
            console.log("[Preload] Starting Phase 2: Fetching fastest laps...");
            for (const targetYear of yearsToLoad) {
                const sessionsForYear = sessionsAcrossYears[targetYear];
                if (sessionsForYear && sessionsForYear.length > 0) {
                    await fetchAndCacheFastestLapsForYear(targetYear, sessionsForYear);
                }
            }
            console.log("[Preload] Phase 2: All fastest laps fetched and cached.");

            // ***************************************************************
            // AQUI É O PONTO CHAVE: Desativar o loading APENAS quando TUDO
            // para o ano selecionado estiver carregado (sessões E fastest laps).
            // ***************************************************************
            // Verifica se as sessões do ano atual estão no estado E se os fastest laps do ano atual estão no estado
            // Se o year for '2025' e não houver sessões (futuro), ainda queremos que o loading desligue.
            const hasSessions = allSessions[year] && allSessions[year].length > 0;
            const hasFastestLaps = allSprintFastestLapsData[year] && Object.keys(allSprintFastestLapsData[year]).length >= (allSessions[year] ? allSessions[year].length : 0);

            if (hasSessions || year === "2025") { // Para 2025, assumimos que não há fastest laps ainda, então só precisamos das sessões
                 setIsLoadingCurrentYearData(false);
            } else if (!hasSessions && !currentYearError) { // Se não tem sessões e não tem erro, pode ser que o ano seja muito antigo ou não tenha sprints
                setCurrentYearError(`Nenhuma Sprint encontrada para ${year}.`);
                setIsLoadingCurrentYearData(false);
            }


            setIsPreloadingAllYears(false); // Desliga o indicador de pré-carga total
            isPreloadingRef.current = false;
            console.log("[Preload] All years pre-loaded.");
        };

        preloadAllYearsData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchAndCacheSessionsForYear, fetchAndCacheFastestLapsForYear, year, allSessions, allSprintFastestLapsData]); // Adicionado allSessions e allSprintFastestLapsData como dependências para reavaliar o loading

    // --- Efeito para gerenciar o loading do ANO ATUAL quando o 'year' muda ---
    // Este useEffect agora será simplificado, pois o controle principal está no preloadAllYearsData
    useEffect(() => {
        // Se o ano selecionado não tiver dados completos, ative o loading
        const sessionsLoaded = allSessions[year] && allSessions[year].length > 0;
        const fastestLapsLoaded = allSprintFastestLapsData[year] && Object.keys(allSprintFastestLapsData[year]).length >= (sessionsLoaded ? allSessions[year].length : 0);

        if (!sessionsLoaded || (sessionsLoaded && !fastestLapsLoaded && year !== "2025")) {
             setIsLoadingCurrentYearData(true);
             setCurrentYearError(null); // Limpa erros anteriores ao iniciar novo carregamento
        } else {
             setIsLoadingCurrentYearData(false);
        }

        // Lidar com o caso de 2025 onde não há fastest laps ainda
        if (year === "2025" && sessionsLoaded) {
            setIsLoadingCurrentYearData(false);
            setCurrentYearError(null);
        } else if (year === "2025" && !sessionsLoaded) {
            setIsLoadingCurrentYearData(true); // Ainda esperando as sessões de 2025
            setCurrentYearError(null);
        }


    }, [year, allSessions, allSprintFastestLapsData]); // Dependências cruciais

    // --- Efeito para atualizar o título da página ---
    useEffect(() => {
        document.title = `Sprints - Calendário ${year} | Fórmula 1 - Statistics`;
        const metaDescription = document.querySelector('meta[name="description"]') || document.createElement("meta");
        if (!metaDescription.parentNode) {
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira os resultados das sessões de Sprints da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;
    }, [year]);

    // --- Efeito para salvar o ano selecionado no localStorage ---
    useEffect(() => {
        localStorage.setItem("f1SelectedYear", JSON.stringify(year));
    }, [year]);

    // --- Lógica de exibição baseada no ano selecionado ---
    const currentYearSessions = allSessions[year] || [];
    const currentYearFastestLaps = allSprintFastestLapsData[year] || {};

    const sprintSessionsDisplay = currentYearSessions.filter(
        (session) =>
            session.session_type === "Sprint" ||
            session.session_name.includes("Sprint")
    );

    // O loading principal agora é ativado se o ano atual está carregando
    const showOverallLoading = isLoadingCurrentYearData;

    return (
        <>
            <Header />
            <section>
                <div className="container tags">
                    <h1 className="title">Sprints - F1 {year}</h1>
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        title="Selecione o ano para ver os Sprints de F1"
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

                {currentYearError && <p className="error">Erro: {currentYearError}</p>}

                {/* Renderiza os cards SOMENTE quando o loading do ano atual estiver FALSE e não houver erro */}
                {!showOverallLoading && !currentYearError && (
                    <article className="qualifying-cards-container">
                        {sprintSessionsDisplay.length > 0
                            ? sprintSessionsDisplay.map((session) => (
                                <SessionCard
                                    key={session.session_key}
                                    session={session}
                                    fastestLapData={currentYearFastestLaps[session.session_key]}
                                    flippedCardKey={flippedCardKey}
                                    setFlippedCardKey={setFlippedCardKey}
                                />
                            ))
                            : (!showOverallLoading && !currentYearError && <p>Nenhuma Sprint encontrada para {year}.</p>)
                        }
                    </article>
                )}
            </section>
            <Footer />
        </>
    );
}

export default Sprints;