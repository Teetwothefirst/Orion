import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

const AuthContainer = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    background: 'radial-gradient(circle at top right, #e0e7ff 0%, #f3e8ff 40%, #ffffff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', // Use Inter if available
    padding: '20px'
  }}>
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      boxShadow: '0 20px 60px -10px rgba(0,0,0,0.1), 0 10px 30px -15px rgba(0,0,0,0.05)',
      width: '100%',
      maxWidth: '420px',
      padding: '48px',
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.8)'
    }}>
      {children}
    </div>
  </div>
);

const Logo = () => (
  <div style={{
    textAlign: 'center',
    marginBottom: '32px'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      borderRadius: '16px',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      color: 'white',
      fontWeight: 'bold',
      boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)'
    }}>
      O
    </div>
    <h1 style={{
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: '0 0 8px 0'
    }}>
      Orion Chat
    </h1>
    <p style={{
      color: '#666',
      fontSize: '16px',
      margin: 0
    }}>
      Connect with your Team & More
    </p>
  </div>
);

const Input = ({ type, placeholder, value, onChange, required }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    style={{
      width: '100%',
      padding: '16px 20px',
      border: '2px solid #f1f5f9', // slate-100
      borderRadius: '16px',
      fontSize: '15px',
      fontFamily: 'inherit',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: '16px',
      background: '#f8fafc', // slate-50
      color: '#1e293b' // slate-800
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#8b5cf6'; // violet-500
      e.target.style.background = 'white';
      e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#f1f5f9';
      e.target.style.background = '#f8fafc';
      e.target.style.boxShadow = 'none';
    }}
  />
);

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '16px 24px',
      borderRadius: '16px',
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: 'inherit',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      marginBottom: '16px',
      background: variant === 'primary'
        ? (disabled ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')
        : 'transparent',
      color: variant === 'primary' ? 'white' : '#6366f1',
      opacity: disabled ? 0.7 : 1,
      boxShadow: variant === 'primary' && !disabled ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
        e.target.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
        e.target.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
      }
    }}
  >
    {children}
  </button>
);

const LinkButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      color: '#6366f1',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'inherit',
      textDecoration: 'none',
      fontWeight: '500',
      padding: 0,
      transition: 'color 0.2s'
    }}
    onMouseEnter={(e) => e.target.style.color = '#7c3aed'}
    onMouseLeave={(e) => e.target.style.color = '#6366f1'}
  >
    {children}
  </button>
);

const LoginForm = ({ onSwitchToSignup, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) return;
    const success = await login(email, password);
    if (success) {
      navigate('/chat');
    }
  };

  return (
    <>
      <Logo />
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Welcome back
        </h2>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <LinkButton onClick={onSwitchToForgotPassword}>
            Forgot password?
          </LinkButton>
        </div>

        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Don't have an account?{' '}
          <LinkButton onClick={onSwitchToSignup}>
            Sign up
          </LinkButton>

        </div>
      </div>
    </>
  );
};

const SignupForm = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    const success = await register(name, email, password);
    if (success) {
      navigate('/chat');
    }
  };

  return (
    <>
      <Logo />
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Create your account
        </h2>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <Input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Already have an account?{' '}
          <LinkButton onClick={onSwitchToLogin}>
            Sign in
          </LinkButton>
        </div>
      </div>
    </>
  );
};

const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Reset
  const { forgotPassword, resetPassword, isLoading, error } = useAuth();

  const handleSendLink = async () => {
    if (!email) return;
    const result = await forgotPassword(email);
    if (result && result.token) {
      setToken(result.token); // Auto-fill for dev
      setStep(2);
    }
  };

  const handleReset = async () => {
    if (!token || !newPassword) return;
    const result = await resetPassword(token, newPassword);
    if (result) {
      alert("Password reset successful. Please login.");
      onSwitchToLogin();
    }
  };

  if (step === 2) {
    return (
      <>
        <Logo />
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Reset Password
          </h2>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #ef4444',
              color: '#b91c1c',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <p style={{ textAlign: 'center', marginBottom: '16px', color: '#666' }}>
            Token generated: <strong>{token}</strong>
          </p>

          <Input
            type="text"
            placeholder="Reset Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Button onClick={handleReset} disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>

          <div style={{ textAlign: 'center' }}>
            <LinkButton onClick={() => setStep(1)}>
              Back
            </LinkButton>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Logo />
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Forgot your password?
        </h2>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <p style={{
          color: '#666',
          fontSize: '16px',
          marginBottom: '32px',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Enter your email address and we'll send you a reset token.
        </p>

        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button onClick={handleSendLink} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send reset instructions'}
        </Button>

        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Remember your password?{' '}
          <LinkButton onClick={onSwitchToLogin}>
            Sign in
          </LinkButton>
        </div>
      </div>
    </>
  );
};

const Auth = () => {
  const [currentView, setCurrentView] = useState('login');

  return (
    <AuthContainer>
      {currentView === 'login' && (
        <LoginForm
          onSwitchToSignup={() => setCurrentView('signup')}
          onSwitchToForgotPassword={() => setCurrentView('forgot')}
        />
      )}
      {currentView === 'signup' && (
        <SignupForm onSwitchToLogin={() => setCurrentView('login')} />
      )}
      {currentView === 'forgot' && (
        <ForgotPasswordForm onSwitchToLogin={() => setCurrentView('login')} />
      )}
    </AuthContainer>
  );
};

export default Auth;
