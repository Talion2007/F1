import{useState}from"react";
import emailjs from"emailjs-com";
import"../styles/Email.css";

function EmailForm(){
  const[email,setEmail]=useState("");
  const[name,setName]=useState("");
  const[status,setStatus]=useState(true)

  const sendEmail=(e)=>{
    e.preventDefault();
    emailjs.send(
      "service_vasotur",
      "template_b164ekm",
      { email,name },
      "AEf0rLomnd13Rvmw6"
    ).then(()=>{
      setStatus(false)
      setEmail("");
      setName("");
      alert("Email enviado com sucesso!")
    }).catch((err)=>{
      console.error(err);
      setStatus(true)
      alert("Erro ao enviar o email. Tente novamente mais tarde.");
    });
  };

  return(
    <>
      {status?
        <>
          <form onSubmit={sendEmail}className="email-form">
            <input
              type="text"
              placeholder="Insira seu nome"
              required
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Insira seu e-mail"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
            <button type="submit">Enviar E-mail</button>
          </form>
        </>
        :
        <>
          <h3>E-mail enviado com sucesso!</h3>
        </>
      }
    </>
  );
}

export default EmailForm;