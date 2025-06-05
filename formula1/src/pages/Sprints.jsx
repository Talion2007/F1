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

function Sprints() {
    const [year, setYear] = useState(() => {
        const savedYear = localStorage.getItem("f1SelectedYear");
        return savedYear ? JSON.parse(savedYear) : "2024";
    });

    useEffect(() => {
        document.title = `Sprints - Calendario ${year} | Fórmula 1 - Statistics`;
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement("meta");
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Confira os resultados das sessões de Sprints da Fórmula 1 para o ano de ${year}. Veja datas, horários, circuitos e locais.`;
        return () => {
            if (metaDescription && metaDescription.parentNode) {
                metaDescription.parentNode.removeChild(metaDescription);
            }
        };
    }, [year]);

    const [sessions, setSessions] = useState(() => {
        const savedSessions = localStorage.getItem("f1SprintSessions"); // Changed local storage key
        return savedSessions ? JSON.parse(savedSessions) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [flippedCardKey, setFlippedCardKey] = useState(null);

    // State for Fastest Laps for sprints
    const [sprintFastestLapsData, setSprintFastestLapsData] = useState({});

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
        async function fetchSprintData() {
            try {
                setLoading(true);
                setError(null);
                const fetchedSessions = await fetchWithRetry(
                    `https://api.openf1.org/v1/sessions?year=${year}`
                );
                if (!fetchedSessions || fetchedSessions.length === 0) {
                    throw new Error("No sessions found for the selected year.");
                }

                // Filter for Sprints
                const relevantSessions = fetchedSessions.filter(
                    (session) =>
                        session.session_type === "Sprint" ||
                        session.session_name.includes("Sprint") // Includes "Sprint Shootout"
                );

                setSessions(relevantSessions);
                localStorage.setItem(
                    "f1SprintSessions", // Changed local storage key
                    JSON.stringify(relevantSessions)
                );
                setLoading(false); // Display basic cards quickly

                // Fetch fastest laps for sprints
                const newSprintFastestLapsData = {};
                for (const sprint of relevantSessions) { // Iterate over relevantSessions directly
                    const data = await fetchBestLapData(sprint, "Sprint");
                    if (data) {
                        newSprintFastestLapsData[data.session_key] = data;
                    }
                    await delay(200); // Introduce a 200ms delay between fetches
                }
                setSprintFastestLapsData(newSprintFastestLapsData);

            } catch (err) {
                setError(err.message);
                console.error("Error in fetchSprintData:", err);
                setLoading(false);
            }
        }
        fetchSprintData();
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

    return (
        <>
            <Header />
            <section>
                <div className="container tags">
                    <h1 className="title">Sprints  - F1 {year}</h1>
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

                {loading && (
                    <>
                        <br />
                        <Loading />
                    </>
                )}

                {error && <p className="error">Error: {error}</p>}

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
            </section>
            <Footer />
        </>
    );
}

export default Sprints;