import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Loading from "../components/Loading.jsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext.jsx';
import "../styles/Page.css";
import "../styles/Drivers.css"

function Drivers() {
  // === INÍCIO DAS DECLARAÇÕES DE ESTADO (TODAS NO TOPO) ===

  const { currentUser } = useAuth();

  const [users, setUsers] = useState(() => {
    const saveUsers = localStorage.getItem("User Key");
    return saveUsers ? JSON.parse(saveUsers) : [];
  });

  const [races, setRaces] = useState(() => {
    const saveRaces = localStorage.getItem("Races Key");
    // Ensure races is always an array
    try {
        return saveRaces ? JSON.parse(saveRaces) : [];
    } catch (e) {
        console.error("Error parsing saved races from localStorage:", e);
        return []; // Fallback to empty array on parse error
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sessionKey, setSessionKey] = useState(() => {
    const saveYearPilots = localStorage.getItem("Pilots Year Key");
    // Initial sessionKey can be null, it will be set by the useEffect
    return saveYearPilots ? JSON.parse(saveYearPilots) : null;
  });

  const [flippedCard, setFlippedCard] = useState(null);

  // === FIM DAS DECLARAÇÕES DE ESTADO ===


  // --- SEO: Gerenciamento do Título da Página e Meta Descrição ---
  useEffect(() => {
    // Only proceed if races is an array and not empty
    if (!Array.isArray(races) || races.length === 0) {
      document.title = `Pilotos F1 | Fórmula 1 - Statistics`;
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = `Descubra todos os pilotos da Fórmula 1, incluindo informações de equipe, nacionalidade e estatísticas. Acompanhe seus pilotos favoritos.`;
      return; // Exit early if no race data
    }

    const selectedRace = races.find(race => race.session_key === sessionKey);
    const year = selectedRace ? selectedRace.year : 'Atual';
    const circuitName = selectedRace ? selectedRace.circuit_short_name : '';

    document.title = `Pilotos F1 - ${circuitName} ${year} | Fórmula 1 - Statistics`;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = `Descubra todos os pilotos da Fórmula 1 para a temporada de ${year}, incluindo informações de equipe, nacionalidade e estatísticas. Acompanhe seus pilotos favoritos.`;

    return () => {
      if (metaDescription && metaDescription.parentNode) {
        metaDescription.parentNode.removeChild(metaDescription);
      }
    };
  }, [sessionKey, races]);


  useEffect(() => {
    async function fetchUsersAndRaces() {
      try {
        setLoading(true);
        setError(null); // Clear previous errors

        const responseQualy = await fetch(
          "https://api.openf1.org/v1/sessions?session_name=Qualifying"
        );
        if (!responseQualy.ok) {
          throw new Error(`Failed to fetch qualifying session data: ${responseQualy.statusText}`);
        }
        const qualifyingRaces = await responseQualy.json();

        // IMPORTANT: Ensure qualifyingRaces is an array before setting state
        if (!Array.isArray(qualifyingRaces)) {
            console.error("API response for qualifying sessions was not an array:", qualifyingRaces);
            setRaces([]); // Set to empty array if response is not an array
            throw new Error("Invalid API response format for qualifying sessions.");
        }

        setRaces(qualifyingRaces);
        localStorage.setItem("Races Key", JSON.stringify(qualifyingRaces));

        let currentSessionToFetch = sessionKey;

        // If sessionKey is null (initial load or no saved key),
        // determine the most recent session and set it as the current one.
        if (sessionKey === null) {
          const sortedRaces = [...qualifyingRaces].sort((a, b) => {
            if (a.year !== b.year) {
              return b.year - a.year; // Sort by year descending
            }
            return new Date(b.date_start) - new Date(a.date_start); // Then by date descending
          });

          const latestSessionKey = sortedRaces.length > 0 ? sortedRaces[0].session_key : null; // Changed fallback to null
          if (latestSessionKey) {
            setSessionKey(latestSessionKey);
            currentSessionToFetch = latestSessionKey; // Use this for the current fetch
          } else {
            setError("No qualifying sessions found.");
            setLoading(false);
            return; // Exit if no sessions are found
          }
        }

        // Only fetch drivers if a sessionKey is available
        if (currentSessionToFetch) {
            const responseDrivers = await fetch(
              `https://api.openf1.org/v1/drivers?session_key=${currentSessionToFetch}`
            );
            if (!responseDrivers.ok) {
              throw new Error(`Failed to fetch driver data: ${responseDrivers.statusText}`);
            }
            const drivers = await responseDrivers.json();

            // IMPORTANT: Ensure drivers is an array before setting state
            if (!Array.isArray(drivers)) {
                console.error("API response for drivers was not an array:", drivers);
                setUsers([]); // Set to empty array if response is not an array
                throw new Error("Invalid API response format for drivers.");
            }

            setUsers(drivers);
            localStorage.setItem("User Key", JSON.stringify(drivers));
        } else {
            setUsers([]); // Clear drivers if no session to fetch
        }

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setUsers([]); // Clear users on error
        setRaces([]); // Clear races on error
      } finally {
        setLoading(false);
      }
    }
    fetchUsersAndRaces();
  }, [sessionKey]); // sessionKey is a dependency to re-fetch when it changes

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Application Error:", error);
    }
  }, [error]);


  // Effect to save sessionKey to localStorage when it changes
  useEffect(() => {
    if (sessionKey !== null) { // Only save if a valid sessionKey is set
      localStorage.setItem("Pilots Year Key", JSON.stringify(sessionKey));
    }
  }, [sessionKey]);

  return (
    <>
      <Header />
      <section>
        {!currentUser ? (
          <div className="LoginMessage Block">
            <div>
              <h1 className="title">Pilotos - F1 </h1>
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
              <h1 className="title">Pilotos</h1>
              {/* Conditionally render the select only if races is an array and not empty */}
                <select
                  value={sessionKey || ''} // Handle null sessionKey initially
                  onChange={(e) => setSessionKey(e.target.value)}
                  title="Selecione a sessão de qualificação para ver os pilotos."
                >
                  {races.map((race) => (
                    <option key={race.session_key} value={race.session_key}>
                      {race.circuit_short_name} - {race.year}
                    </option>
                  ))}
                </select>
                 {Array.isArray(races) && races.length > 0 ? ( ""
              ) : (
                console.log(`Erro: ${error}`)
              )}
            </div>
            {error && <p className="error">Error: {error}</p>}
            <article>
              {loading ? (
                <Loading />
              ) : (
                <>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((user) => (
                      <div
                        className="Card"
                        key={user.driver_number}
                        onClick={() =>
                          setFlippedCard(
                            flippedCard === user.driver_number ? null : user.driver_number
                          )
                        }
                      >
                        <div
                          className={`CardInner ${flippedCard === user.driver_number ? "is-flipped" : ""}`}
                        >
                          <div
                            className="CardDriverFront"
                            style={{ backgroundColor: "#" + user.team_colour }}
                          >
                            <div className="BlockOne">
                              <h1 style={{ color: "#" + user.team_colour }}>
                                {user.driver_number.toLocaleString(`en-US`, {
                                  minimumIntegerDigits: 2,
                                })}
                              </h1>
                              <img src={user.headshot_url} alt={`Retrato de ${user.full_name}`} />
                            </div>
                            <div className="BlockTwo">
                              <h3>
                                {user.full_name} ({user.name_acronym})
                              </h3>
                              <h4>
                                {user.country_code || "Desconhecido"} - {user.team_name}
                              </h4>
                            </div>
                          </div>

                          <div
                            className="CardDriverBack"
                            style={{ backgroundColor: "#" + user.team_colour }}
                          >
                            <h3>Número do Piloto: {user.driver_number}</h3>
                            <h3>Nome Completo: {user.full_name}</h3>
                            <h3>Nome de Transmissão: {user.broadcast_name}</h3>
                            <h3>Acrônimo do Nome: {user.name_acronym}</h3>
                            <h3>Código do País: {user.country_code || "Desconhecido"}</h3>
                            <h3>Nome da Equipe: {user.team_name}</h3>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    !loading && <p>Nenhum piloto disponível para a sessão selecionada.</p>
                  )}
                </>
              )}
            </article>
          </>
        )}
      </section>
      <Footer />
    </>
  );
}
export default Drivers;