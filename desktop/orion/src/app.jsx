import * as React from 'react';
// import { createRoot } from 'react-dom/client';
import * as ReactDOM from "react-dom/client";
import Auth from './Auth.jsx';
import ChatInterface from './ChatInterface.jsx'
import { AuthProvider } from './context/AuthContext.jsx';
import {
  createBrowserRouter,
  RouterProvider,
  HashRouter,
  Routes,
  Route
} from "react-router-dom";
import { reportBug } from './services/SupportService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Automatic Crash Reporting
    reportBug({
      user: 'Desktop User (Auto)',
      description: 'Desktop Application Crash',
      isCrash: true,
      stackTrace: error.stack + '\n' + errorInfo.componentStack
    }).catch(err => console.error('Failed to report crash:', err));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong.</h2>
          <p>The application has crashed. A report has been sent to support.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', backgroundColor: '#fb923c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Restart Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// const root = createRoot(document.body);
// root.render(<h2>Hello from React!</h2>);


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path='/chat' element={<ChatInterface />} />
            {/* <Route path='/forgotPassword' element={<ForgotPassword />} />
            <Route path='/resetPassword' element={<ResetPassword />} /> */}
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);