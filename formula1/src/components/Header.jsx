import NavBar from './NavBar.jsx';
import Logo from '../assets/formula1.png';
import { Link } from 'react-router-dom';
import "../styles/Header.css"
function Header() {
    return (
        <>
        <header>
        <title>Formula 1</title>
        <NavBar />
        <Link to="/">
        <img src={Logo}></img>
        </Link>
        </header>
        </>
    )
}
export default Header;