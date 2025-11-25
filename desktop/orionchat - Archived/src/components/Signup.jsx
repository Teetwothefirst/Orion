import React from 'react'

export default function Signup() {
  return (
    <>
         {/* <!-- Authentication Forms --> */}
        <div id="authContainer" class="auth-container">
            {/* <!-- Register Form --> */}
            <div id="registerForm" className="auth-form">
                {/* style="display: none;" */}
                <div>
                        {/* style="display: flex;justify-content: center;"
                         <img src="./EAL.jpg" alt="" width="50px" height="50px" /> */}
                </div>
                <h2>Register Account</h2>
                <div id="registerError" className="error-message" >
                    {/* style="display: none;" */}
                </div>
                <div id="registerSuccess" className="success-message" >
                {/* style="display: none;" */}
                </div>
                <form id="registerFormElement">
                    <div className="form-group">
                        <label for="registerUsername">Username</label>
                        <input type="text" id="registerUsername" name="username" required />
                    </div>
                    <div className="form-group">
                        <label for="registerEmail">Email</label>
                        <input type="email" id="registerEmail" name="email" required />
                    </div>
                    <div className="form-group">
                        <label for="registerPassword">Password</label>
                        <input type="password" id="registerPassword" name="password" required />
                    </div>
                    <button type="submit" className="btn">Register</button>
                </form>
                <div className="auth-switch">
                    Already have an account? <a href="#" id="switchToLogin">Login here</a>
                </div>
            </div>

        </div>
    </>
  )
}
