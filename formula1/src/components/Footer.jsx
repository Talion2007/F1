import "../styles/Footer.css"
function Footer() {
    return (
        <>
            <footer>
                <h4>Cagnin Software Development</h4>
                <p>© 2025 Cagnin Software Development. Todos os direitos reservados.</p> {/* Traduzido */}
                <p>Desenvolvido por Felipe Cagnin | Desenvolvedor Full-Stack em formação</p> {/* Traduzido */}
                <div className="socials">
                    <a href="mailto:radiance.knight.2007@gmail.com">Email</a> 
                    <a href="https://github.com/Talion2007" target="_blank" rel="noopener noreferrer">GitHub</a> {/* Adicionado rel="noopener noreferrer" por boa prática */}
                    <a href="https://www.linkedin.com/in/felipe-cagnin-94a367348/" target="_blank" rel="noopener noreferrer">LinkedIn</a> {/* Adicionado rel="noopener noreferrer" por boa prática */}
                </div>
            </footer>
        </>
    )
}
export default Footer;