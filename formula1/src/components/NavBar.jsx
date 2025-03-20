import { Link } from "react-router-dom";
import "../styles/NavBar.css"
function NavBar() {
    return (
        <nav>
            <ul>
                <li>
                    <Link to="/">
                        <h3>Home</h3>
                    </Link>
                </li>
                <li>
                    <Link to="/drivers">
                        <h3>Drivers</h3>
                    </Link>
                </li>
                <li>
                    <Link to="/sprints">
                        <h3>Sprints & Races</h3>
                    </Link>
                </li>
                <li>
                    <Link to="/pratices">
                        <h3>Pratices</h3>
                    </Link>
                </li>
            </ul>
        </nav>
    )
}

export default NavBar;