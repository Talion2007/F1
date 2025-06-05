import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import SessionCard from "../components/SessionCard.jsx";
import { useState, useEffect, useCallback } from "react";
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

function Practices() {
    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("f1SelectedYear");
        return savedYear ? JSON.parse(savedYear) : "2024";
    });

    useEffect(() => {
        document.title = `Treinos Livres e Sprints - Calendario ${year} | Fórmula 1 - Statistics`;
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement("meta");
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira os resultados das sessões de Treinos Livres e Sprints da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;
        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, [year]);

    const [sessions, setSessions] = useState(() => {
        const savedSessions = localStorage.getItem("f1PracticeAndSprintSessions");
        return savedSessions ? JSON.parse(savedSessions) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    // States for Fastest Laps for each practice type and sprints
    const [sprintFastestLapsData, setSprintFastestLapsData] = useState({});
    const [fp1FastestLapsData, setFp1FastestLapsData] = useState({});
    const [fp2FastestLapsData, setFp2FastestLapsData] = useState({});
    const [fp3FastestLapsData, setFp3FastestLapsData] = useState({});

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
        async function fetchAllPracticeAndSprintData() {
            try {
                setLoading(true);
                setError(null);
                const fetchedSessions = await fetchWithRetry(
                    `https://api.openf1.org/v1/sessions?year=${year}`
                );
                if (!fetchedSessions || fetchedSessions.length === 0) {
                    throw new Error("No sessions found for the selected year.");
                }

                // Filter for all Free Practices and Sprints
                const relevantSessions = fetchedSessions.filter(
                    (session) =>
                        session.session_type === "Sprint" ||
                        session.session_name.includes("Sprint") ||
                        (session.session_type === "Practice" &&
                            (session.session_name === "Practice 1" ||
                                session.session_name === "Practice 2" ||
                                session.session_name === "Practice 3"))
                );

                setSessions(relevantSessions);
                localStorage.setItem(
                    "f1PracticeAndSprintSessions",
                    JSON.stringify(relevantSessions)
                );
                setLoading(false); // Display basic cards quickly

                // Separate sessions into their specific types
                const sprintSessions = relevantSessions.filter(
                    (session) =>
                        session.session_type === "Sprint" ||
                        session.session_name.includes("Sprint")
                );
                const fp1Sessions = relevantSessions.filter(
                    (session) =>
                        session.session_name === "Practice 1"
                );
                const fp2Sessions = relevantSessions.filter(
                    (session) =>
                        session.session_name === "Practice 2"
                );
                const fp3Sessions = relevantSessions.filter(
                    (session) =>
                        session.session_name === "Practice 3"
                );

                // Fetch fastest laps for each session type sequentially with a delay
                const newSprintFastestLapsData = {};
                for (const sprint of sprintSessions) {
                    const data = await fetchBestLapData(sprint, "Sprint");
                    if (data) {
                        newSprintFastestLapsData[data.session_key] = data;
                    }
                    await delay(200); // Introduce a 200ms delay between fetches
                }
                setSprintFastestLapsData(newSprintFastestLapsData);

                const newFp1FastestLapsData = {};
                for (const fp1 of fp1Sessions) {
                    const data = await fetchBestLapData(fp1, "FP1");
                    if (data) {
                        newFp1FastestLapsData[data.session_key] = data;
                    }
                    await delay(200); // Introduce a 200ms delay between fetches
                }
                setFp1FastestLapsData(newFp1FastestLapsData);

                const newFp2FastestLapsData = {};
                for (const fp2 of fp2Sessions) {
                    const data = await fetchBestLapData(fp2, "FP2");
                    if (data) {
                        newFp2FastestLapsData[data.session_key] = data;
                    }
                    await delay(200); // Introduce a 200ms delay between fetches
                }
                setFp2FastestLapsData(newFp2FastestLapsData);

                const newFp3FastestLapsData = {};
                for (const fp3 of fp3Sessions) {
                    const data = await fetchBestLapData(fp3, "FP3");
                    if (data) {
                        newFp3FastestLapsData[data.session_key] = data;
                    }
                    await delay(200); // Introduce a 200ms delay between fetches
                }
                setFp3FastestLapsData(newFp3FastestLapsData);

            } catch (err) {
                setError(err.message);
                console.error("Error in fetchAllPracticeAndSprintData:", err);
                setLoading(false);
            }
        }
        fetchAllPracticeAndSprintData();
    }, [year, fetchBestLapData]);

    useEffect(() => {
        localStorage.setItem("f1SelectedYear", JSON.stringify(year));
    }, [year]);

    // Filter sessions for display in each category
    const sprintSessionsDisplay = sessions.filter(
        (session) =>
            session.session_type === "Sprint" ||
            session.session_name.includes("Sprint")
    );
    const fp1SessionsDisplay = sessions.filter(
        (session) =>
            session.session_name === "Practice 1"
    );
    const fp2SessionsDisplay = sessions.filter(
        (session) =>
            session.session_name === "Practice 2"
    );
    const fp3SessionsDisplay = sessions.filter(
        (session) =>
            session.session_name === "Practice 3"
    );

    return (
        <>
            <Header />
            <section>
                <div className="container tags">
                    <h1 className="title">Treinos Livres e Sprints</h1>
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        title="Selecione o ano para ver os treinos livres e Sprints de F1"
                    >
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                    </select>
                </div>

                {loading && (
                    <>
                        <br />
                        <Loading />
                    </>
                )}

                {error && <p className="error">Error: {error}</p>}

                ---

                <h1 className="title">Sprints - F1 {year}</h1>
                <article className="qualifying-cards-container">
                    {sprintSessionsDisplay.length > 0
                        ? sprintSessionsDisplay.map((session) => (
                            <SessionCard
                                key={session.session_key}
                                session={session}
                                fastestLapData={sprintFastestLapsData[session.session_key]}
                                flippedCardKey={flippedCardKey}
                                setFlippedCardKey={setFlippedCardKey}
                            />
                        ))
                        : !loading && <p>Nenhuma Sprint encontrada para {year}.</p>}
                </article>

                ---

                {/* Seção para Treino Livre 1 */}
                <h1 className="title">Treino Livre 1 - F1 {year}</h1>
                <article className="qualifying-cards-container">
                    {fp1SessionsDisplay.length > 0
                        ? fp1SessionsDisplay.map((session) => (
                            <SessionCard
                                key={session.session_key}
                                session={session}
                                fastestLapData={fp1FastestLapsData[session.session_key]}
                                flippedCardKey={flippedCardKey}
                                setFlippedCardKey={setFlippedCardKey}
                            />
                        ))
                        : !loading && <p>Nenhum Treino Livre 1 encontrado para {year}.</p>}
                </article>

                ---

                {/* Seção para Treino Livre 2 */}
                <h1 className="title">Treino Livre 2 - F1 {year}</h1>
                <article className="qualifying-cards-container">
                    {fp2SessionsDisplay.length > 0
                        ? fp2SessionsDisplay.map((session) => (
                            <SessionCard
                                key={session.session_key}
                                session={session}
                                fastestLapData={fp2FastestLapsData[session.session_key]}
                                flippedCardKey={flippedCardKey}
                                setFlippedCardKey={setFlippedCardKey}
                            />
                        ))
                        : !loading && <p>Nenhum Treino Livre 2 encontrado para {year}.</p>}
                </article>

                ---

                {/* Seção para Treino Livre 3 */}
                <h1 className="title">Treino Livre 3 - F1 {year}</h1>
                <article className="qualifying-cards-container">
                    {fp3SessionsDisplay.length > 0
                        ? fp3SessionsDisplay.map((session) => (
                            <SessionCard
                                key={session.session_key}
                                session={session}
                                fastestLapData={fp3FastestLapsData[session.session_key]}
                                flippedCardKey={flippedCardKey}
                                setFlippedCardKey={setFlippedCardKey}
                            />
                        ))
                        : !loading && <p>Nenhum Treino Livre 3 encontrado para {year}.</p>}
                </article>
            </section>
            <Footer />
        </>
    );
}

export default Practices;