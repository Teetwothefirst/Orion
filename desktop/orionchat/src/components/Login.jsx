import React from 'react'

export default function Login() {
  return (
    <>
        {/* <!-- Login Form --> */}
            <div id="loginForm" class="auth-form">
                {/* <!-- <div class="orion_login_head" style="display: flex;justify-content: space-evenly;"> -->   */}
                    <div style="display: flex;justify-content: center;">
                        <img src="./EAL.jpg" alt="" width="50px" height="50px" />
                    </div>
                    <h2>Login to Chat</h2>
                {/* <!-- </div> --> */}
                
                <div id="loginError" class="error-message" style="display: none;"></div>
                <form id="loginFormElement">
                    <div class="form-group">
                        <label for="loginUsername">Username</label>
                        <input type="text" id="loginUsername" name="username" required />
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" name="password" required />
                    </div>
                    <button type="submit" class="btn">Login</button>
                </form>
                <div class="auth-switch">
                    Don't have an account? <a href="#" id="switchToRegister">Register here</a>
                </div>
            </div>
    </>
  )
}
