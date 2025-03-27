import Header from "../components/Header";
import Footer from "../components/Footer";
import Loading from "../components/Loading";
import { useState, useEffect } from "react";
import "../styles/Page.css";
import "../styles/Drivers.css"

function Drivers() {
  const [users, setUsers] = useState(() => {
    const saveUsers = localStorage.getItem("User Key");
    return saveUsers ? JSON.parse(saveUsers) : [];
  });
  const [races, setRaces] = useState(() => {
    const saveRaces = localStorage.getItem("Races Key");
    return saveRaces ? JSON.parse(saveRaces) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionKey, setSessionKey] = useState(() => {
    const saveYearPilots = localStorage.getItem("Pilots Year Key");
    return saveYearPilots ? JSON.parse(saveYearPilots) : "7768";
  });

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
          throw new Error("Fudeu");
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

  useEffect(() => {
    localStorage.setItem("Pilots Year Key", JSON.stringify(sessionKey));
  }, [sessionKey]);
  return (
    <>
      <Header />
      <section>
        <div className="container">
          <h1 className="title">Drivers - F1 </h1>
          <select
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
          >
            {races.map((race) => (
              <option value={race.session_key}>
                {race.circuit_short_name} - {race.year}
              </option>
            ))}
          </select>
        </div>
        <article>
          {loading ? (
            <Loading />
          ) : (
            <>
              {users.map((user) => (
                <div className="Card"
                  key={user.driver_number}>
                  <div className="CardInner">
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
                        <img src={user.headshot_url}></img>
                      </div>
                      <div className="BlockTwo">
                        <h3>
                          {user.full_name} ({user.name_acronym})
                        </h3>
                        <h4>
                          {user.country_code ? user.country_code : "UNK"} - {user.team_name}
                        </h4>
                      </div>
                    </div>

                    <div
                      className="CardDriverBack"
                      style={{ backgroundColor: "#" + user.team_colour }}
                    >
                      <h3>
                        Driver Number: {user.driver_number.toLocaleString(`en-US`, {
                          minimumIntegerDigits: 2,
                        })}
                      </h3>
                      <h3>
                        Full Name: {user.full_name}
                      </h3>
                      <h3>
                        Broadcast Name: {user.broadcast_name}
                      </h3>
                      <h3>
                        Name Acronym: {user.name_acronym}
                      </h3>
                      <h3>
                        Country Code: {user.country_code ? user.country_code : "Unknoun"}
                      </h3>
                      <h3>
                        Team Name: {user.team_name}
                      </h3>

                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </article>
      </section>
      <Footer />
    </>
  );
}
export default Drivers;
