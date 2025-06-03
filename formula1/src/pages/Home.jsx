import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import carrouselFront from "../assets/carrouselFront.jpg";
import carrouselOne from "../assets/carrouselOne.jpg";
import carrouselTwo from "../assets/carrouselTwo.jpg";
import carrouselTri from "../assets/carrouselTri.webp";
import "../styles/Page.css";

function Home() {
  const [carrousel, setCarrousel] = useState(0);
  const [userName, setUserName] = useState('');
  const { currentUser, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();

  // Efeito para o carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarrousel(prevCarrousel => (prevCarrousel + 1) % 4);
    }, 7500);
    return () => clearInterval(interval);
  }, []);

  // Efeito para o nome do usuário logado
  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email);
    } else {
      setUserName('');
    }
  }, [currentUser]);

  // --- SEO: Gerenciamento do Título da Página e Meta Descrição (sem 'year') ---
  useEffect(() => {
    // Define o título da página
    document.title = "Início | Formula 1 - Statistics";

    // Gerencia a meta description: Cria se não existir, atualiza se existir
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    // Conteúdo estático para a meta description da Home
    metaDescription.content = "Acompanhe notícias, resultados, estatísticas e muito mais sobre a Fórmula 1. Seu portal completo para fãs da F1!";

    // Função de limpeza: Remove a meta tag quando o componente é desmontado
    return () => {
        if (metaDescription && metaDescription.parentNode) {
            metaDescription.parentNode.removeChild(metaDescription);
        }
    };
  }, []); // Array de dependências vazio, pois não depende de 'year' ou outros estados dinâmicos

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logout realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
      alert('Erro ao fazer logout: ' + error.message);
    }
  };

  const handleAccountDeletion = async () => {
    if (!currentUser) {
      alert("Nenhum usuário está logado.");
      return;
    }

    const confirmDeletion = window.confirm(
      "Tem certeza que deseja excluir sua conta? Esta ação é irreversível e removerá todos os seus dados."
    );

    if (confirmDeletion) {
      try {
        await deleteAccount();
        alert('Conta excluída com sucesso!');
        navigate('/');
      } catch (error) {
        console.error('Erro ao excluir conta:', error.message);
        if (error.message.includes('re-authenticate')) {
          alert('Falha ao excluir conta: ' + error.message + '\nPor favor, faça logout e login novamente, então tente excluir sua conta.');
          navigate('/login');
        } else {
          alert('Erro ao excluir conta: ' + error.message);
        }
      }
    }
  };

  const carrouselImages = [carrouselFront, carrouselOne, carrouselTwo, carrouselTri];

  return (
    <>
      <Header />

      <section className="Main">
        <div className="Carrousel">
          <img
            src={carrouselImages[carrousel]}
            alt={
              carrousel === 0
                ? "Carro de Fórmula 1 na pista de corrida"
                : carrousel === 1
                ? "Paddock de Fórmula 1, boxes das equipes"
                : carrousel === 2
                ? "Piloto de Fórmula 1 celebrando vitória no pódio"
                : "Grid de largada da Fórmula 1 com carros em posição"
            }
            title="Imagens dinâmicas do universo da Fórmula 1"
          />
        </div>

        <h1 className="title">Formula 1 Statistics: Seu Portal Completo</h1>

        <main>
          <p>
            A Fórmula 1 (F1) é o ápice da velocidade, precisão e estratégia, onde os melhores pilotos, engenheiros e equipes do mundo se reúnem para competir no mais alto nível do automobilismo. Com uma história de mais de 70 anos, a F1 evoluiu para um espetáculo global assistido por milhões em todo o mundo, cativando o público com sua velocidade impressionante, tecnologia de ponta e rivalidades intensas. As corridas acontecem em uma ampla variedade de pistas, cada uma oferecendo desafios únicos para pilotos e equipes. Dos circuitos famosos e históricos como Mônaco, Silverstone e Spa-Francorchamps, a adições mais recentes como o Circuito da Cidade de Baku e o Circuito das Américas, a Fórmula 1 oferece uma combinação de ruas estreitas e sinuosas na cidade e circuitos de alta velocidade e abertos. A diversidade dessas pistas adiciona uma rica camada de complexidade ao esporte, tornando-o um dos esportes a motor mais desafiadores e emocionantes do mundo. No cerne da F1 está a batalha por dois títulos prestigiados: o Campeonato Mundial de Pilotos e o Campeonato Mundial de Construtores, ambos representando as maiores conquistas do esporte, com cada equipe e piloto buscando a glória em cada um dos 22 a 24 fins de semana de corrida da temporada.
          </p>
          <p>
            Os carros de Fórmula 1 são maravilhas tecnológicas, construídos para ultrapassar os limites da engenharia. Alimentados por unidades de potência híbridas que combinam a força de motores de combustão interna (ICE) e sistemas de recuperação de energia (ERS), esses veículos produzem mais de 1.000 cavalos de potência e podem atingir velocidades superiores a 370 km/h. A aerodinâmica de ponta, a tecnologia de pneus e as estratégias de corrida baseadas em dados tornam os carros de F1 algumas das máquinas mais avançadas do mundo. As equipes estão constantemente inovando para aumentar a eficiência e o desempenho de seus carros, com pequenos detalhes muitas vezes fazendo a diferença entre a vitória e a derrota. Esse alto nível de complexidade tecnológica se estende além dos próprios carros, afetando todos os aspectos do esporte, desde as estratégias de pneus ao gerenciamento de combustível e à telemetria ao vivo que permite que as equipes ajustem suas estratégias de corrida em tempo real. O desempenho dos carros e sua configuração em cada circuito é crucial para o sucesso, tornando a colaboração entre o piloto, o engenheiro e a equipe em geral a chave para a vitória.
          </p>
          <p>
            Na Fórmula 1, os pilotos são frequentemente considerados os maiores atletas, com sua combinação de aptidão física, acuidade mental e habilidade na pista, o que os diferencia de todos os outros esportes a motor. Os pilotos de F1 devem ter reflexos excepcionais, a capacidade de tomar decisões em frações de segundo e a resistência para manter o desempenho máximo durante toda a corrida. Esses atletas suportam forças de até 5G durante curvas e frenagens em alta velocidade, comparáveis às que os pilotos de caça experimentam. Os pilotos de F1 também precisam lidar constantemente com as condições climáticas, temperaturas da pista e degradação dos pneus. Sua capacidade de se adaptar a essas variáveis e atuar sob imensa pressão é o que os faz se destacar como alguns dos melhores pilotos do mundo. Ao longo da história do esporte, certos pilotos se tornaram ícones, lendas que não apenas dominaram nas pistas, mas também construíram enormes bases de fãs em todo o mundo. Michael Schumacher, com seus sete Campeonatos Mundiais e 91 vitórias em Grand Prix, permanece um símbolo de domínio no esporte. O legado de Ayrton Senna vive não apenas através de seus três títulos, mas através de seu estilo de pilotagem inesquecível e rivalidades ferozes, mais notavelmente com Alain Prost, um dos pilotos mais bem-sucedidos do esporte. Em anos mais recentes, Lewis Hamilton se tornou um dos maiores pilotos de todos os tempos, vencendo sete Campeonatos Mundiais e quebrando vários recordes, incluindo o de mais pole positions e vitórias em Grand Prix. Mas não são apenas essas lendas que moldam o esporte; superestrelas atuais como Max Verstappen, Charles Leclerc e Lando Norris representam a nova geração de pilotos de F1 que trazem energia e emoção renovadas para o grid.
          </p>
          <p>
            Além dos pilotos, as equipes de Fórmula 1 e seus engenheiros são vitais para o sucesso de uma campanha na F1. O esporte viu várias equipes ascenderem e caírem ao longo dos anos, mas algumas consistentemente definiram o padrão de excelência. A Ferrari, com seus icônicos carros vermelhos e paixão por corridas, é uma das equipes mais bem-sucedidas e conhecidas da Fórmula 1. Com um legado de 16 Campeonatos de Construtores e 15 Campeonatos de Pilotos, a Ferrari é sinônimo do esporte. Sua dedicação ao desenvolvimento de carros de corrida inovadores os levou a triunfos e contratempos, e sua rivalidade com equipes como Mercedes e Red Bull Racing impulsionou algumas das temporadas mais emocionantes da história recente. A Mercedes, particularmente durante a era híbrida, dominou a F1, vencendo sete Campeonatos de Construtores consecutivos de 2014 a 2020 e se tornando a equipe mais bem-sucedida da década de 2010. Seu sucesso incomparável é impulsionado por engenharia meticulosa, brilhantismo estratégico e um compromisso inabalável com a perfeição. Enquanto isso, a Red Bull Racing, liderada por seu piloto dominante Sebastian Vettel no início dos anos 2010, se recuperou nos últimos anos com Max Verstappen, garantindo vários títulos e continuando a inovar com estratégias agressivas. Equipes como McLaren e Alpine também continuam a lutar por pódios, contribuindo para a competitividade feroz que torna a F1 tão emocionante.
          </p>
          <p>
            O esporte é conhecido por suas incríveis rivalidades e momentos dramáticos que mantêm os fãs à beira de seus assentos. Algumas das rivalidades mais emocionantes da história incluem Senna vs. Prost, Schumacher vs. Hakkinen e, mais recentemente, Hamilton vs. Verstappen. Essas rivalidades alimentam a tensão na pista, com os pilotos muitas vezes levando os limites de suas habilidades e carros ao extremo, levando a intensas batalhas na pista. A Fórmula 1 não é apenas sobre os carros ou os pilotos, mas sobre a estratégia e execução durante as corridas. As equipes analisam constantemente os dados em tempo real para ajustar suas estratégias em tempo real, desde trocas de pneus a pit stops e gerenciamento de combustível. O desempenho das equipes de pit stop também desempenha um papel fundamental, com os pit stops mais rápidos muitas vezes decidindo quem obtém a vantagem durante uma corrida. Os pit stops, que podem levar apenas 2,2 segundos, são uma parte crítica da ação, e as equipes investem pesadamente em treinamento para garantir que cada membro da equipe esteja em perfeita sintonia.
          </p>
          <p>
            Além dos aspectos técnicos e estratégicos, a Fórmula 1 também tem uma rica história, repleta de momentos históricos, marcos e recordes de desempenho. Michael Schumacher estabeleceu o padrão de domínio com sete Campeonatos Mundiais, enquanto os quatro títulos consecutivos de Sebastian Vettel (2010-2013) foram um período de consistência incomparável. No entanto, o esporte está em constante evolução, e novos recordes são estabelecidos a cada temporada. Lewis Hamilton se tornou o piloto mais bem-sucedido da era moderna, com 104 vitórias em Grand Prix até 2025. Ele também compartilha o recorde de mais Campeonatos Mundiais com Schumacher. Além disso, o esporte está vendo jovens estrelas como Max Verstappen e Charles Leclerc desafiarem a ordem estabelecida, sinalizando um futuro brilhante para a F1. Verstappen, em particular, tem sido dominante nas últimas temporadas, vencendo múltiplos Campeonatos Mundiais e se tornando um dos pilotos mais talentosos e competitivos de sua geração. Com o advento da tecnologia híbrida e a busca do esporte pela sustentabilidade, o futuro da Fórmula 1 promete ser tão emocionante quanto seu passado, com novas inovações no horizonte e desafios empolgantes pela frente para as principais equipes e pilotos do esporte.
          </p>
          <p>
            A Fórmula 1 continua sendo um dos esportes mais assistidos e celebrados do mundo, uma combinação perfeita de velocidade, tecnologia e habilidade humana. Ela continua a evoluir, atraindo novos fãs e desenvolvimentos emocionantes, ao mesmo tempo em que honra sua rica história e tradições. À medida que o esporte olha para o futuro, com esforços de sustentabilidade como a neutralidade de carbono até 2030 e avanços tecnológicos contínuos, a F1, sem dúvida, continuará a capturar a imaginação de milhões e a entregar a ação emocionante que a tornou a joia da coroa do automobilismo.
          </p>
        </main>

        {!currentUser ? (
          <div className="LoginMessage">
            <h3>Faça Login ou Registre-se!</h3>
            <div className="buttons">
              <button className="LoginButton">
                <Link to="/login" title="Acesse sua conta do portal Formula 1 - Statistics">Login</Link>
              </button>
              <button className="LoginButton Register">
                <Link to="/register" title="Crie sua nova conta no portal Formula 1 - Statistics">Registrar</Link>
              </button>
            </div>
          </div>
        ) : (
          <div className="LoginMessage">
            <h3>Bem-vindo(a), {userName}</h3>

            <div className="buttons">
              <button onClick={handleLogout} className="LoginButton">
                Sair
              </button>
              <button onClick={handleAccountDeletion} className="LoginButton Delete">
                Excluir Conta
              </button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
export default Home;