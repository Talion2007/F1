import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import "../styles/Page.css"
function Drivers() {
  const [users, setUsers] = useState(() => {
    const saveUsers = localStorage.getItem('User Key');
    return saveUsers ? JSON.parse(saveUsers) : [];
  })
  const [races, setRaces] = useState(() => {
    const saveRaces = localStorage.getItem('Races Key');
    return saveRaces ? JSON.parse(saveRaces) : [];
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sessionKey, setSessionKey] = useState("7768")
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`https://api.openf1.org/v1/drivers?&session_key=${sessionKey}`)
        const responseQualy = await fetch('https://api.openf1.org/v1/sessions?session_type=Qualifying')
        if (!response.ok) {
          throw new Error("Fudeu")
        }
        const rocamboles = await response.json()
        const atuns = await responseQualy.json()
        setUsers(rocamboles);
        localStorage.setItem('User Key', JSON.stringify(rocamboles));
        setRaces(atuns);
        localStorage.setItem('Races Key', JSON.stringify(atuns));
      }
      catch (error) {
        setError(error.message)
      }
      finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [sessionKey]);
  return (
    <>
      <Header />
      <section>
        <div className="container">
          <h1 className="title">Drivers - F1 </h1>
          <select onChange={(e) => setSessionKey(e.target.value)}>
            {races.map((race) => (
              <option value={race.session_key}>{race.circuit_short_name} - {race.year}</option>
            ))}
          </select>
        </div>
        <article>
          {loading ?
            <h1>Carregando...</h1> :
            <>{users.map((user) => (
              <div key={user.driver_number} className='CardDriver' style={{ backgroundColor: '#' + user.team_colour }}>
                <div className="BlockOne">
                  <h1 style={{ color: '#' + user.team_colour }}>{user.driver_number.toLocaleString(`en-US`, {
                    minimumIntegerDigits: 2
                  })}</h1>
                  <img src={user.headshot_url}></img>
                </div>
                <div className='BlockTwo'>
                  <h3>{user.full_name} ({user.name_acronym})</h3>
                  <h4>{user.country_code} - {user.team_name}</h4>
                </div>
              </div>
            ))}</>}
        </article>
        {error ? <p>Error</p> : ""}
      </section>
      <Footer />
    </>
  )
}
export default Drivers;