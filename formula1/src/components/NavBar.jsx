import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/NavBar.css"
function NavBar() {
    const [navbar, setNavbar] = useState(false);
    const [widthSize, setWidthSize] = useState(window.screen.width)

    useEffect(() => {
        const Interval = setInterval(() => {
            setWidthSize(window.screen.width)
            if (widthSize < 1024) {
                setNavbar(true)
            } else {
                setNavbar(false)
            }
        })

        return () => clearInterval(Interval)
    }, [widthSize])


    return (
        <nav>
            {navbar ? <>
                <input type='checkbox' id="hamburger-trigger" />
                <label for="hamburger-trigger">
                    <svg className="svg" id="on" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>

                    <svg id="off" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>

                </label> <ul id="options">
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
                    <li>
                        <Link to="/qualifying">
                            <h3>Qualifying</h3>
                        </Link>
                    </li>
                    <li>
                        <Link to="/contact">
                            <h3>About Me</h3>
                        </Link>
                    </li>
                </ul></> 
                :
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
                <li>
                    <Link to="/qualifying">
                        <h3>Qualifying</h3>
                    </Link>
                </li>
                <li>
                        <Link to="/contact">
                            <h3>About Me</h3>
                        </Link>
                    </li>
            </ul>}

        </nav>
    )
}

export default NavBar;