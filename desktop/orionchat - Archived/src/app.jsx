import * as React from 'react';
import Chat from './components/Chat.jsx';
import Signup from './components/Signup.jsx';
import * as ReactDOM from "react-dom/client";
// import { createRoot } from 'react-dom/client';
import ChatInterface from './components/ChatInterface.jsx';
import {
  createBrowserRouter,
  RouterProvider,
  HashRouter,
  Routes,
  Route
} from "react-router-dom";
import Login from './components/Login.jsx'
import Auth from './components/Auth.jsx';



// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <div>Hello world!</div>,
//   },
// ]);

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <RouterProvider router={router} />
//   </React.StrictMode>
// // );
// const root = createRoot(document.body);
// root.render(<div className='container'><Signup /></div>);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/chat' element={<ChatInterface />} />
          {/* <Route path='/forgotPassword' element={<ForgotPassword />} />
          <Route path='/resetPassword' element={<ResetPassword />} /> */}
        </Routes>
      </HashRouter>
  </React.StrictMode>
);