import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/NavBar.css"
function NavBar() {
    const [navbar, setNavbar] = useState(false);
    const [widthSize, setWidthSize] = useState(window.screen.width)

    useEffect(() => {
        // Correção para evitar loop infinito e garantir que o intervalo limpe corretamente.
        // O ideal é usar um event listener para 'resize' e não um setInterval.
        const handleResize = () => {
            const currentWidth = window.innerWidth; // Use innerWidth para a viewport
            setWidthSize(currentWidth);
            if (currentWidth < 1024) {
                setNavbar(true);
            } else {
                setNavbar(false);
            }
        };

        // Adiciona o event listener ao montar o componente
        window.addEventListener('resize', handleResize);
        // Chama uma vez para definir o estado inicial
        handleResize();

        // Limpa o event listener ao desmontar o componente
        return () => window.removeEventListener('resize', handleResize);
    }, [widthSize]); // Array de dependências vazio para rodar apenas uma vez ao montar/desmontar


    return (
        <nav>
            {navbar ? <>
                <input type='checkbox' id="hamburger-trigger" />
                <label htmlFor="hamburger-trigger"> {/* Corrigido 'for' para 'htmlFor' */}
                    <svg className="svg" id="on" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> {/* stroke-width para strokeWidth */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /> {/* stroke-linecap para strokeLinecap, etc. */}
                    </svg>

                    <svg id="off" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>

                </label> <ul id="options">
                    <li>
                        <Link to="/">
                            <h3>Início</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/pratices">
                            <h3>Treinos</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/sprints">
                            <h3>Sprints</h3> {/* Traduzido */}
                        </Link>
                    </li>
                     <li>
                        <Link to="/races">
                            <h3>Corridas</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/qualifying">
                            <h3>Qualificações</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/drivers">
                            <h3>Pilotos</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/chat">
                            <h3>Chat</h3> {/* Mantido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/contact">
                            <h3>Sobre Mim</h3> {/* Traduzido */}
                        </Link>
                    </li>
                </ul></>
                :
                <ul>
                    <li>
                        <Link to="/">
                            <h3>Início</h3> {/* Traduzido */}
                        </Link>
                    </li>
                      <li>
                        <Link to="/pratices">
                            <h3>Treinos</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/sprints">
                            <h3>Sprints</h3> {/* Traduzido */}
                        </Link>
                    </li>
                     <li>
                        <Link to="/races">
                            <h3>Corridas</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/qualifying">
                            <h3>Qualificações</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/drivers">
                            <h3>Pilotos</h3> {/* Traduzido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/chat">
                            <h3>Chat</h3> {/* Mantido */}
                        </Link>
                    </li>
                    <li>
                        <Link to="/contact">
                            <h3>Sobre Mim</h3> {/* Traduzido */}
                        </Link>
                    </li>
                </ul>}

        </nav>
    )
}

export default NavBar;