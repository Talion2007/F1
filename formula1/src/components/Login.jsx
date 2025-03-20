import { Link } from "react-router-dom";
import { useState } from "react";
function Login() {
    const [active, setActive] = useState(false);

    return (
        <>
        < li >
            {active ? 
            <Link to="/secret">
                < h3 >🏃‍♂️</h3 >
                <h6>Logged</h6>
            </Link >
                :
                <button onClick={() => setActive(true)}>
                    <h3>👨‍🦽</h3>
                    <h6>Sign In</h6>
                </button>
            }
        </li >
                </>
    )
}
export default Login;