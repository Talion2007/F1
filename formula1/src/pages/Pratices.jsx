/* eslint-disable no-unused-vars */
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import SessionCard from "../components/SessionCard.jsx";
import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/Page.css";
import "../styles/FlipCard.css";

// --- Funções Auxiliares de API e Cache (MANTENHA AS MESMAS) ---
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 5, initialDelayMs = 1000) {
    let currentDelay = initialDelayMs;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await await fetch(url); // Remove one 'await' here, it's a typo
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

// --- Componente Practices ---

function Practices() {
    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("f1SelectedPracticeYear");
        return savedYear ? JSON.parse(savedYear) : "2025";
    });

    const [allSessions, setAllSessions] = useState({});
    const [allPracticeFastestLapsData, setAllPracticeFastestLapsData] = useState({});

    // Usando isLoadingCurrentYear para consistência com o que você já tinha no return
    const [isLoadingCurrentYear, setIsLoadingCurrentYear] = useState(true);
    const [isPreloadingAllYears, setIsPreloadingAllYears] = useState(true);

    const [currentYearError, setCurrentYearError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    const isPreloadingRef = useRef(false);

    // --- Helper para buscar sessões para um ano específico ---
    const fetchAndCacheSessionsForYear = useCallback(async (targetYear) => {
        try {
            const cachedSessions = getCachedDataWithTTL(`f1PracticeSessions_${targetYear}`);
            if (cachedSessions && cachedSessions.length > 0) {
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

                // Filtrando APENAS as sessões de treino para cache e estado inicial
                const relevantSessions = fetchedSessions.filter(
                    (session) => session.session_type.includes("Practice")
                );
                setAllSessions(prev => ({ ...prev, [targetYear]: relevantSessions }));
                setCachedDataWithTTL(`f1PracticeSessions_${targetYear}`, relevantSessions);
                return relevantSessions;
            }
        } catch (err) {
            console.error(`[Error] Error loading sessions for ${targetYear}:`, err);
            if (targetYear === year) {
                setCurrentYearError(`Não foi possível carregar as sessões de treino para ${targetYear}. Por favor, tente novamente.`);
            }
            return [];
        }
    }, [year]);

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
                `[Fetch Error] Error processing fastest lap for practice session ${session.session_key}:`,
                innerError
            );
            return null;
        }
    }, []);

    // --- Helper para buscar e cachear resultados de voltas rápidas para um ano ---
    const fetchAndCacheFastestLapsForYear = useCallback(async (targetYear, sessionsForYear) => {
        if (!sessionsForYear || sessionsForYear.length === 0) {
            console.log(`No practice sessions to fetch fastest laps for year ${targetYear}.`);
            return;
        }

        console.log(`[Processing] Fetching fastest laps for year ${targetYear}...`);

        let currentFastestLaps = getCachedDataWithTTL(`f1PracticeFastestLaps_${targetYear}`) || {};
        let updatedAny = false;

        for (const session of sessionsForYear) {
            if (!currentFastestLaps[session.session_key]) {
                try {
                    const data = await fetchBestLapData(session);
                    if (data) {
                        currentFastestLaps[data.session_key] = data;
                        setAllPracticeFastestLapsData(prev => ({
                            ...prev,
                            [targetYear]: {
                                ...(prev[targetYear] || {}),
                                [data.session_key]: data
                            }
                        }));
                        updatedAny = true;
                    }
                    await delay(1500);
                } catch (err) {
                    console.error(`[Error] Failed to fetch fastest lap for practice session ${session.session_key} in year ${targetYear}:`, err);
                }
            } else {
                setAllPracticeFastestLapsData(prev => ({
                    ...prev,
                    [targetYear]: {
                        ...(prev[targetYear] || {}),
                        [session.session_key]: currentFastestLaps[session.session_key]
                    }
                }));
            }
        }

        if (updatedAny || Object.keys(currentFastestLaps).length > 0) {
            setCachedDataWithTTL(`f1PracticeFastestLaps_${targetYear}`, currentFastestLaps);
            console.log(`[Cache] Fastest laps for ${targetYear} saved to cache.`);
        }
    }, [fetchBestLapData]);

    // --- Efeito para pré-carregar os dados de sessões e resultados para 2025, 2024, 2023 ---
    useEffect(() => {
        if (isPreloadingRef.current) {
            return;
        }

        isPreloadingRef.current = true;
        setIsPreloadingAllYears(true);

        const preloadAllYearsData = async () => {
            const yearsToLoad = ["2025", "2024", "2023"];
            let sessionsAcrossYears = {};

            setCurrentYearError(null);
            setIsLoadingCurrentYear(true); // Usando isLoadingCurrentYear aqui

            console.log("[Preload] Starting Phase 1: Fetching all practice sessions...");
            for (const targetYear of yearsToLoad) {
                const sessions = await fetchAndCacheSessionsForYear(targetYear);
                if (sessions && sessions.length > 0) {
                    sessionsAcrossYears[targetYear] = sessions;
                } else {
                    console.log(`[Preload] No practice sessions found for ${targetYear} in Phase 1.`);
                    if (targetYear === year) {
                        setCurrentYearError(`Nenhum Treino encontrado para ${year}.`);
                        setIsLoadingCurrentYear(false);
                    }
                }
                if (targetYear !== yearsToLoad[yearsToLoad.length - 1]) {
                    await delay(500);
                }
            }
            console.log("[Preload] Phase 1: All practice sessions fetched and cached.");

            console.log("[Preload] Starting Phase 2: Fetching fastest laps for practices...");
            for (const targetYear of yearsToLoad) {
                const sessionsForYear = sessionsAcrossYears[targetYear];
                if (sessionsForYear && sessionsForYear.length > 0) {
                    await fetchAndCacheFastestLapsForYear(targetYear, sessionsForYear);
                }
            }
            console.log("[Preload] Phase 2: All fastest practice laps fetched and cached.");

            const hasSessions = allSessions[year] && allSessions[year].length > 0;
            const hasFastestLaps = allPracticeFastestLapsData[year] && Object.keys(allPracticeFastestLapsData[year]).length >= (allSessions[year] ? allSessions[year].length : 0);

            if (hasSessions || year === "2025") {
                 setIsLoadingCurrentYear(false);
            } else if (!hasSessions && !currentYearError) {
                setCurrentYearError(`Nenhum Treino encontrado para ${year}.`);
                setIsLoadingCurrentYear(false);
            }

            setIsPreloadingAllYears(false);
            isPreloadingRef.current = false;
            console.log("[Preload] All years pre-loaded for Practices.");
        };

        preloadAllYearsData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchAndCacheSessionsForYear, fetchAndCacheFastestLapsForYear, year, allSessions, allPracticeFastestLapsData]);

    // --- Efeito para gerenciar o loading do ANO ATUAL quando o 'year' muda ---
    useEffect(() => {
        const sessionsLoaded = allSessions[year] && allSessions[year].length > 0;
        const fastestLapsLoaded = allPracticeFastestLapsData[year] && Object.keys(allPracticeFastestLapsData[year]).length >= (sessionsLoaded ? allSessions[year].length : 0);

        if (!sessionsLoaded || (sessionsLoaded && !fastestLapsLoaded && year !== "2025")) {
             setIsLoadingCurrentYear(true); // Usando isLoadingCurrentYear aqui
             setCurrentYearError(null);
        } else {
             setIsLoadingCurrentYear(false); // Usando isLoadingCurrentYear aqui
        }

        if (year === "2025" && sessionsLoaded) {
            setIsLoadingCurrentYear(false); // Usando isLoadingCurrentYear aqui
            setCurrentYearError(null);
        } else if (year === "2025" && !sessionsLoaded) {
            setIsLoadingCurrentYear(true); // Usando isLoadingCurrentYear aqui
            setCurrentYearError(null);
        }

    }, [year, allSessions, allPracticeFastestLapsData]);

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
        localStorage.setItem("f1SelectedPracticeYear", JSON.stringify(year));
    }, [year]);

    // --- Lógica de exibição baseada no ano selecionado ---
    const currentYearSessions = allSessions[year] || [];
    const currentYearFastestLaps = allPracticeFastestLapsData[year] || {};

    // O MACETE AQUI: Filtrar as sessões por tipo de treino livre
    const fp1SessionsDisplay = currentYearSessions.filter(
        (session) => session.session_name === "Practice 1"
    );
    const fp2SessionsDisplay = currentYearSessions.filter(
        (session) => session.session_name === "Practice 2"
    );
    const fp3SessionsDisplay = currentYearSessions.filter(
        (session) => session.session_name === "Practice 3"
    );

    // O loading principal agora é ativado se o ano atual está carregando
    // Você tinha 'showOverallLoading', mudei para 'isLoadingCurrentYear' para consistência
    const showOverallLoading = isLoadingCurrentYear; // Renomeando para o que você já usava no return

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

                {/* Display loading only when the current year's data is being loaded */}
                {showOverallLoading && !currentYearError && ( // Usando showOverallLoading
                    <>
                        <br />
                        <Loading />
                        <p className="loading-message">
                            Carregando dados para o ano {year}...
                        </p>
                    </>
                )}

                {currentYearError && <p className="error">Erro: {currentYearError}</p>} {/* Corrigido 'Error' para 'Erro' */}

                {/* Display content only when not loading the current year and no error */}
                {!showOverallLoading && !currentYearError && ( // Usando showOverallLoading
                    <article className="qualifying-cards-container">
                        {/* Seção para Treino Livre 1 */}
                        {fp1SessionsDisplay.length > 0 ? (
                            <>
                                {fp1SessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={currentYearFastestLaps[session.session_key]}
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))}
                            </>
                        ) : (
                            <p>Nenhum Treino Livre 1 encontrado para {year}.</p>
                        )}

                        {/* Seção para Treino Livre 2 */}
                        {fp2SessionsDisplay.length > 0 ? (
                            <>
                                {fp2SessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={currentYearFastestLaps[session.session_key]}
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))}
                            </>
                        ) : (
                            <p>Nenhum Treino Livre 2 encontrado para {year}.</p>
                        )}

                        {/* Seção para Treino Livre 3 */}
                        {fp3SessionsDisplay.length > 0 ? (
                            <>
                                {fp3SessionsDisplay.map((session) => (
                                    <SessionCard
                                        key={session.session_key}
                                        session={session}
                                        fastestLapData={currentYearFastestLaps[session.session_key]}
                                        flippedCardKey={flippedCardKey}
                                        setFlippedCardKey={setFlippedCardKey}
                                    />
                                ))}
                            </>
                        ) : (
                            <p>Nenhum Treino Livre 3 encontrado para {year}.</p>
                        )}
                        {/* Mensagem geral se não houver treinos para o ano selecionado */}
                        {fp1SessionsDisplay.length === 0 &&
                         fp2SessionsDisplay.length === 0 &&
                         fp3SessionsDisplay.length === 0 &&
                         !showOverallLoading && !currentYearError && (
                            <p>Nenhum Treino Livre encontrado para {year}.</p>
                        )}
                    </article>
                )}
            </section>
            <Footer />
        </>
    );
}

export default Practices;