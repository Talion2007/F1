import { useState } from "react";
import emailjs from "emailjs-com";
import "../styles/Email.css";

function EmailForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState(true);

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.send(
      "service_vasotur",     // from EmailJS dashboard
      "template_b164ekm",    // from EmailJS dashboard
      { email, name },             // data to send
      "AEf0rLomnd13Rvmw6"      // from EmailJS account
    ).then(() => {
      setStatus(false)
      setEmail("");
      alert("Email enviado com Sucesso!")
    }).catch((err) => {
      console.error(err);
      setStatus(true)
      alert("Erro ao enviar o email. Tente novamente mais tarde.");
    });
  };

  return (
    <>
    {status ? 
      <>
    <form onSubmit={sendEmail} className="email-form">
    <input
        type="text"
        placeholder="Enter your name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Enter your email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Send Email</button>
    </form> 
    </>
    : 
    <>
      <h3>Email enviado com sucesso!</h3>
    </>
    }
    </>
  );
}

export default EmailForm;
