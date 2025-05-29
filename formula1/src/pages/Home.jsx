import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import Header from "../components/Header";
import Footer from "../components/Footer";
import carrouselFront from "../assets/carrouselFront.jpg";
import carrouselOne from "../assets/carrouselOne.jpg";
import carrouselTwo from "../assets/carrouselTwo.jpg";
import carrouselTri from "../assets/carrouselTri.webp";
import "../styles/Page.css";

function Home() {
  const [carrousel, setCarrousel] = useState(0);
  const [userName, setUserName] = useState(''); // State for user's name
  const { currentUser, logout, deleteAccount } = useAuth(); // <-- Get deleteAccount
  const navigate = useNavigate(); // For redirection after deletion

  // Effect for the carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarrousel(prevCarrousel => (prevCarrousel + 1) % 4);
    }, 7500);
    return () => clearInterval(interval);
  }, []);

  // Effect to set user's display name
  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email);
    } else {
      setUserName('');
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logout realizado com sucesso!');
      navigate('/'); // Redirect to home or login after logout
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
      alert('Erro ao fazer logout: ' + error.message);
    }
  };

  // --- NEW: handleAccountDeletion function ---
  const handleAccountDeletion = async () => {
    if (!currentUser) {
      alert("No user is logged in.");
      return;
    }

    const confirmDeletion = window.confirm(
      "Are you sure you want to delete your account? This action is irreversible and will remove all your data."
    );

    if (confirmDeletion) {
      try {
        await deleteAccount(); // Call the deleteAccount function from context
        alert('Account deleted successfully!');
        navigate('/'); // Redirect to home or login after deletion
      } catch (error) {
        console.error('Error deleting account:', error.message);
        // Provide specific feedback for re-authentication
        if (error.message.includes('re-authenticate')) {
          alert('Failed to delete account: ' + error.message + '\nPlease log out and log back in, then try again to delete your account.');
          navigate('/auth'); // Redirect to login page to re-authenticate
        } else {
          alert('Error deleting account: ' + error.message);
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
          <img src={carrouselImages[carrousel]} alt="Carrossel F1" />
        </div>

        <h1 className="title">Fórmula 1</h1>

        <main>
          <p>Formula 1 (F1) is the epitome of speed, precision, and strategy, where the world’s best drivers, engineers, and teams come together to compete at the highest level of motorsport. With a history spanning more than 70 years, F1 has evolved into a global spectacle watched by millions around the world, captivating audiences with its breathtaking speed, cutting-edge technology, and intense rivalries. The races take place on a wide variety of tracks, each offering unique challenges for both drivers and teams. From the famous and historical circuits like Monaco, Silverstone, and Spa-Francorchamps to newer additions like the Baku City Circuit and the Circuit of the Americas, Formula 1 offers a combination of tight, twisty city streets and high-speed, open circuits. The diversity of these tracks adds a rich layer of complexity to the sport, making it one of the most challenging and exciting motorsports in the world. At the core of F1 is the battle for two prestigious titles: the World Drivers' Championship and the Constructors' Championship, both of which represent the highest achievements in the sport, with every team and driver striving for glory in each of the 22–24 race weekends of the season.</p>
          <p>The cars themselves are technological marvels, built to push the limits of engineering. Powered by hybrid power units that combine the power of internal combustion engines (ICE) and energy recovery systems (ERS), these vehicles produce over 1,000 horsepower and can reach speeds of over 230 mph (370 km/h). The cutting-edge aerodynamics, tire technology, and data-driven race strategies make F1 cars some of the most advanced machines in the world. Teams are constantly innovating to enhance the efficiency and performance of their cars, with tiny details often making the difference between winning and losing. This high level of technological complexity extends beyond the cars themselves, affecting every aspect of the sport, from tire strategies to fuel management to live telemetry that allows teams to adjust their race strategies in real-time. The performance of the cars and their setup on each circuit is crucial to achieving success, making the collaboration between the driver, engineer, and the broader team the key to victory.</p>
          <p>In Formula 1, the drivers are often considered the ultimate athletes, with their combination of physical fitness, mental acuity, and skill on the track setting them apart from all other motorsports. F1 drivers must have exceptional reflexes, the ability to make split-second decisions, and the endurance to maintain peak performance for the duration of a race. These athletes endure forces of up to 5G during high-speed corners and braking, which is comparable to what fighter pilots experience. F1 drivers also have to battle constantly changing weather conditions, track temperatures, and tire degradation. Their ability to adapt to these variables and perform under immense pressure is what makes them stand out as some of the best drivers in the world. Throughout the history of the sport, certain drivers have become icons, legends who not only dominated on the track but also built massive fan bases worldwide. Michael Schumacher, with his seven World Championships and 91 Grand Prix wins, remains a symbol of dominance in the sport. Ayrton Senna's legacy lives on not just through his three titles, but through his unforgettable driving style and fierce rivalries, most notably with Alain Prost, one of the sport’s most accomplished drivers. In more recent years, Lewis Hamilton has become one of the greatest drivers of all time, winning seven World Championships and breaking numerous records, including the most pole positions and Grand Prix victories. But it’s not just these legends who shape the sport; current superstars like Max Verstappen, Charles Leclerc, and Lando Norris represent the new generation of F1 drivers who bring fresh energy and excitement to the grid.</p>
          <p>Beyond the drivers, the teams and their engineers are vital to the success of an F1 campaign. The sport has seen several teams rise and fall over the years, but a few have consistently set the standard for excellence. Ferrari, with its iconic red cars and passion for racing, is one of the most successful and well-known teams in Formula 1. With a legacy of 16 Constructors’ Championships and 15 Drivers' Championships, Ferrari is synonymous with the sport. Their dedication to developing innovative race cars has seen them through both triumphs and setbacks, and their rivalry with teams like Mercedes and Red Bull Racing has fueled some of the most exciting seasons in recent history. Mercedes, particularly during the hybrid era, has dominated F1, winning seven consecutive Constructors' Championships from 2014 to 2020 and becoming the most successful team of the 2010s. Their unparalleled success is driven by meticulous engineering, strategic brilliance, and an unwavering commitment to perfection. Meanwhile, Red Bull Racing, led by their dominant driver Sebastian Vettel in the early 2010s, has rebounded in recent years with Max Verstappen, securing multiple titles and continuing to innovate with aggressive strategies. Teams like McLaren and Alpine also continue to challenge for podiums, contributing to the fierce competitiveness that makes F1 so thrilling.</p>
          <p>The sport has been known for its incredible rivalries and dramatic moments that keep fans on the edge of their seats. Some of the most thrilling rivalries in history include Senna vs. Prost, Schumacher vs. Hakkinen, and more recently, Hamilton vs. Verstappen. These rivalries fuel the tension on the track, with drivers often pushing the limits of their abilities and cars, leading to intense on-track battles. Formula 1 is not only about the cars or the drivers but about the strategy and execution during the races. Teams constantly analyze data in real-time to adjust their strategies on the fly, from tire changes to pit stops to fuel management. The performance of the pit crews also plays a pivotal role, with the fastest pit stops often deciding who gets the advantage during a race. Pit stops, which can take as little as 2.2 seconds, are a critical part of the action, and teams invest heavily in training to ensure that every crew member is in perfect sync.</p>
          <p>In addition to the technical and strategic aspects, Formula 1 also has a rich history, filled with historic moments, milestones, and record-breaking performances. Michael Schumacher set the standard for dominance with seven World Championships, while Sebastian Vettel’s four consecutive titles (2010-2013) were a period of unrivaled consistency. However, the sport is constantly evolving, and new records are set each season. Lewis Hamilton has become the most successful driver of the modern era, with 104 Grand Prix victories to his name as of 2025. He also shares the record for the most World Championships with Schumacher. In addition, the sport is seeing young stars like Max Verstappen and Charles Leclerc challenge the established order, signaling a bright future for F1. Verstappen, in particular, has been dominant in recent seasons, winning multiple World Championships and becoming one of the most talented and competitive drivers of his generation. With the advent of hybrid technology and the sport’s drive for sustainability, the future of Formula 1 is set to be as thrilling as its past, with new innovations on the horizon and exciting challenges ahead for the sport’s top teams and drivers.</p>
          <p>Formula 1 remains one of the most watched and celebrated sports in the world, a perfect blend of speed, technology, and human skill. It continues to evolve, bringing new fans and exciting developments while honoring its rich history and traditions. As the sport looks to the future, with sustainability efforts like carbon neutrality by 2030 and continued technological advancements, F1 will undoubtedly continue to capture the imagination of millions and deliver the thrilling action that has made it the crown jewel of motorsport.</p>
        </main>

        {!currentUser ? (
          <div className="LoginMessage">
            <h3>Login your Account or Register!</h3>
            <div className="buttons">
              <button className="LoginButton">
                <Link to="/login">Login</Link>
              </button>
              <button className="LoginButton Register">
                <Link to="/register">Register</Link>
              </button>
            </div>
          </div>
        ) : (
          <div className="LoginMessage">
            <h3>Welcome, {userName}</h3>

            <div className="buttons">

              <button onClick={handleLogout} className="LoginButton">
                Logout
              </button>
              <button onClick={handleAccountDeletion} className="LoginButton Delete">
                Delete Account
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