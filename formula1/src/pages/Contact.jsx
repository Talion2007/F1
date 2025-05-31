import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Email from "../components/Email"
import Me from "../assets/profile.jpeg" // Assumindo que profile.jpeg existe e é a imagem do Felipe
import { useAuth } from "../context/AuthContext";
import "../styles/Page.css"

function Contact() {
  const { currentUser } = useAuth();

  // --- SEO: Gerenciamento do Título da Página e Meta Descrição ---
  useEffect(() => {
    document.title = "Sobre Mim - Felipe Cagnin - Desenvolvedor Full-stack | Fórmula 1 - Statistics";

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Conheça Felipe Cagnin, um desenvolvedor full-stack de 17 anos especializado em soluções digitais eficientes e criativas. Saiba mais sobre sua jornada na tecnologia, paixões e experiência.";

    return () => {
      if (metaDescription && metaDescription.parentNode) {
        metaDescription.parentNode.removeChild(metaDescription);
      }
    };
  }, []); // Não há dependências, pois o conteúdo é estático

  return (
    <>
      <Header />

      <section className="Main">
        <h1 className="title">Sobre Mim</h1> {/* Traduzido */}

        <div className="profile">
          <img src={Me} alt="Felipe Cagnin" className="profile-image" />
          <p>Olá! Meu nome é Felipe Cagnin, tenho 17 anos e sou brasileiro, atualmente estudando Desenvolvimento de Sistemas no SENAI. Desde muito jovem, sou apaixonado por tecnologia e resolução de problemas, o que naturalmente me levou a seguir o caminho do desenvolvimento de software. Meu principal objetivo é me tornar um desenvolvedor full-stack capaz de construir soluções digitais eficientes, criativas e centradas no usuário.

            Para colocar minhas habilidades em prática e crescer profissionalmente, criei a Cagnin Software Development — minha marca pessoal e o ponto de partida da minha jornada na indústria de tecnologia. Por meio desta iniciativa, busco desenvolver projetos que reflitam minha dedicação a um código limpo, aprendizado contínuo e trabalho digital impactante.

            Fora do mundo da tecnologia, sou alguém que valoriza o conhecimento, a criatividade e a espiritualidade. Gosto de ler e jogar em meu tempo livre, e sou membro ativo da Congregação Cristã no Brasil, onde aprendi a importância da humildade, disciplina e propósito. A música também é uma grande parte de quem eu sou — toco flauta, saxofone soprano e violão, o que me ajuda a expressar de maneiras diferentes e significativas.

            Acredito que o crescimento vem da curiosidade, consistência e colaboração. Estou sempre buscando expandir meus horizontes, enfrentar novos desafios e contribuir para projetos que inspirem, conectem e transformem.</p> {/* Traduzido todo o texto */}
        </div>
        <div className="ContactUs">
        {!currentUser ? (
          <>
          <h2 className="title">Entre em Contato</h2> {/* Traduzido */}
          <Email />
          </>
        ) : (
          <>
          <h2 className="title">Logado</h2> {/* Traduzido */}
          <h3>E-mail enviado com sucesso no seu cadastro!</h3> {/* Traduzido */}
          </>
        )}
        </div>
      </section>

      <Footer />
    </>
  )
}
export default Contact;