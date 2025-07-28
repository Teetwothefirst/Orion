import React from 'react'
import {Link} from 'react-router-dom'
// import EAL from '../assets/EAL.jpg'

export default function Login() {
  
  
    return (
    <>
         {/* <!-- Authentication Forms --> */}
        <div id="authContainer" class="auth-container">
            {/* <!-- Login Form --> */}
            <div id="loginForm" className="auth-form">
                {/* <!-- <div className="orion_login_head" style="display: flex;justify-content: space-evenly;"> -->   */}
                    <div className='auth-form-img'>
                        {/* <img src={EAL} alt="" width="50px" height="50px" /> */}
                    </div>
                    <h2>Login to Chat</h2>
                {/* <!-- </div> --> */}
                
                <div id="loginError" className="error-message">
                    {/* style="display: none;" */}
                </div>
                <form id="loginFormElement">
                    <div className="form-group">
                        <label for="loginUsername">Username</label>
                        <input type="text" id="loginUsername" name="username" required />
                    </div>
                    <div className="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" name="password" required />
                    </div>
                    <button type="submit" className="btn">Login</button>
                    <Link to={`/chat`} className='btn'>Next</Link>
                </form>
                <div className="auth-switch">
                    Don't have an account? <a href="#" id="switchToRegister">Register here</a>
                </div>
            </div>
        </div>
        
    </>
  )
}
