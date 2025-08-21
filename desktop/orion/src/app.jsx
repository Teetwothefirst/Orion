import * as React from 'react';
// import { createRoot } from 'react-dom/client';
import * as ReactDOM from "react-dom/client";
import Auth from './Auth.jsx';
import ChatInterface from './ChatInterface.jsx'
import {
  createBrowserRouter,
  RouterProvider,
  HashRouter,
  Routes,
  Route
} from "react-router-dom";

// const root = createRoot(document.body);
// root.render(<h2>Hello from React!</h2>);


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path='/chat' element={<ChatInterface />} />
          {/* <Route path='/forgotPassword' element={<ForgotPassword />} />
          <Route path='/resetPassword' element={<ResetPassword />} /> */}
        </Routes>
      </HashRouter>
  </React.StrictMode>
);