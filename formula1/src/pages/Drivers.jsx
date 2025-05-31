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

  const [races, setRaces] = useState(() => { // <--- AGORA 'races' ESTÁ DECLARADA AQUI
    const saveRaces = localStorage.getItem("Races Key");
    return saveRaces ? JSON.parse(saveRaces) : [];
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sessionKey, setSessionKey] = useState(() => {
    const saveYearPilots = localStorage.getItem("Pilots Year Key");
    return saveYearPilots ? JSON.parse(saveYearPilots) : "7768";
  });

  const [flippedCard, setFlippedCard] = useState(null);

  // === FIM DAS DECLARAÇÕES DE ESTADO ===


  // --- SEO: Gerenciamento do Título da Página e Meta Descrição ---
  useEffect(() => {
    // Obter o ano da sessão selecionada para o título dinâmico
    // 'races' AGORA já está disponível aqui.
    const selectedRace = races.find(race => race.session_key === sessionKey);
    const year = selectedRace ? selectedRace.year : 'Atual'; // Pega o ano da sessão selecionada
    const circuitName = selectedRace ? selectedRace.circuit_short_name : '';

    document.title = `Pilotos F1 - ${circuitName} ${year} | Estatísticas e Perfis`;

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
    async function fetchUsers() {
      try {
        setLoading(true)
        const response = await fetch(
          `https://api.openf1.org/v1/drivers?&session_key=${sessionKey}`
        );
        const responseQualy = await fetch(
          "https://api.openf1.org/v1/sessions?session_name=Qualifying"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch driver data.");
        }
        const rocamboles = await response.json();
        const atuns = await responseQualy.json();
        setUsers(rocamboles);
        localStorage.setItem("User Key", JSON.stringify(rocamboles));
        setRaces(atuns);
        localStorage.setItem("Races Key", JSON.stringify(atuns));
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [sessionKey]);

  console.log(error)

  useEffect(() => {
    localStorage.setItem("Pilots Year Key", JSON.stringify(sessionKey));
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
              <h1 className="title">Pilotos de F1</h1>
              <select
                value={sessionKey}
                onChange={(e) => setSessionKey(e.target.value)}
                title="Selecione a sessão de qualificação para ver os pilotos."
              >
                {races.map((race) => (
                  <option key={race.session_key} value={race.session_key}>
                    {race.circuit_short_name} - {race.year}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="error">Error: {error}</p>}
            <article>
              {loading ? (
                <Loading />
              ) : (
                <>
                  {users.map((user) => (
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
                  ))}
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