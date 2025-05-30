import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Email from "../components/Email"
import Me from "../assets/profile.jpeg"
import { useAuth } from "../context/AuthContext"; // Importe useAuth
import "../styles/Page.css"

function Contact() {
  const { currentUser } = useAuth(); // Obtenha o usuário logado
  
  useEffect(() => {
    document.title = "About Me";
  })
  return (
    <>
      <Header />

      <section className="Main">
        <h1 className="title">About Me</h1>

        <div className="profile">
          <img src={Me} alt="Felipe Cagnin" className="profile-image" />
          <p>Hello! My name is Felipe Cagnin, I’m a 17-year-old Brazilian currently studying Systems Development at SENAI. Since a young age, I’ve been passionate about technology and problem-solving, which naturally led me to pursue a path in software development. My main goal is to become a full-stack developer capable of building efficient, creative, and user-centered digital solutions.

            To put my skills into practice and grow professionally, I created Cagnin Software Development — my personal brand and the starting point of my journey in the tech industry. Through this initiative, I aim to develop projects that reflect my dedication to clean code, continuous learning, and impactful digital work.

            Outside of the tech world, I’m someone who values knowledge, creativity, and spirituality. I enjoy reading and gaming in my free time, and I’m an active member of the Congregação Cristã no Brasil, where I’ve learned the importance of humility, discipline, and purpose. Music is also a big part of who I am — I play the flute, soprano saxophone, and guitar, which helps me express myself in different and meaningful ways.

            I believe that growth comes from curiosity, consistency, and collaboration. I’m always looking to expand my horizons, take on new challenges, and contribute to projects that inspire, connect, and transform.</p>
        </div>
        <div className="ContactUs">
        {!currentUser ? (
          <>
          <h2 className="title">Contact Us</h2>
          <Email /> 
          </>
        ) : (
          <>
          <h2 className="title">Logged</h2>
          <h3>Email sent successfully on your register!</h3>
          </>
        )}
        </div>
      </section>

      <Footer />
    </>
  )
}
export default Contact;