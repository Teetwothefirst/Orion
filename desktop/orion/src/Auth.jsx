import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AuthContainer = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '20px'
  }}>
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      padding: '40px',
      position: 'relative'
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
      width: '48px',
      height: '48px',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      borderRadius: '12px',
      margin: '0 auto 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      color: 'white',
      fontWeight: 'bold'
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
      padding: '14px 16px',
      border: '2px solid #e1e5e9',
      borderRadius: '12px',
      fontSize: '16px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: '16px',
      background: '#fafbfc'
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#667eea';
      e.target.style.background = 'white';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#e1e5e9';
      e.target.style.background = '#fafbfc';
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
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: 'inherit',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '16px',
      background: variant === 'primary' 
        ? (disabled ? '#ccc' : 'linear-gradient(45deg, #667eea, #764ba2)')
        : 'transparent',
      color: variant === 'primary' ? 'white' : '#667eea',
      opacity: disabled ? 0.6 : 1
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
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
      color: '#667eea',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'inherit',
      textDecoration: 'underline',
      padding: 0
    }}
    onMouseEnter={(e) => e.target.style.color = '#764ba2'}
    onMouseLeave={(e) => e.target.style.color = '#667eea'}
  >
    {children}
  </button>
);

const LoginForm = ({ onSwitchToSignup, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!email || !password) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Login successful!');
    }, 1500);
  };

  return (
    <>
      <Logo />
      <div onSubmit={handleSubmit}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Welcome back
        </h2>
        
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
        
        {/* <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button> */}
        <Link to={`/chat`}
        style={{
            width: '89%',
            padding: '14px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: 'inherit',
            border: 'none',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color:'white',
            display: 'block',
            // cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '16px',
            textAlign: 'center',
            textDecoration: 'none',
            // background: variant === 'primary' 
            //     ? (disabled ? '#ccc' : 'linear-gradient(45deg, #667eea, #764ba2)')
            //     : 'transparent',
            // color: variant === 'primary' ? 'white' : '#667eea',
            // opacity: disabled ? 0.6 : 1
            }}
        >Login</Link>
        
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Account created successfully!');
    }, 1500);
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
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <Input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <>
        <Logo />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(45deg, #10b981, #059669)',
            borderRadius: '50%',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '16px'
          }}>
            Check your email
          </h2>
          <p style={{
            color: '#666',
            fontSize: '16px',
            marginBottom: '32px',
            lineHeight: '1.5'
          }}>
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <Button onClick={onSwitchToLogin}>
            Back to sign in
          </Button>
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
        
        <p style={{
          color: '#666',
          fontSize: '16px',
          marginBottom: '32px',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Button onClick={handleSubmit} disabled={isLoading}>
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
