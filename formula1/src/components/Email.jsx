import { useState } from "react";
import emailjs from "emailjs-com";
import "../styles/Email.css";

function EmailForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.send(
      "service_vasotur",     // from EmailJS dashboard
      "template_b164ekm",    // from EmailJS dashboard
      { email },             // data to send
      "AEf0rLomnd13Rvmw6"      // from EmailJS account
    ).then(() => {
      setStatus("✅ Email sent!");
      setEmail("");
    }).catch((err) => {
      console.error(err);
      setStatus("❌ Failed to send email.");
    });
  };

  return (
    <form onSubmit={sendEmail} className="email-form">
      <input
        type="email"
        placeholder="Enter your email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Send Email</button>
      {status && <p>{status}</p>}
    </form>
  );
}

export default EmailForm;
