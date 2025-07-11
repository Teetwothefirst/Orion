import * as React from 'react';
import Chat from './components/Chat.jsx';
import * as ReactDOM from "react-dom/client";
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Login from './components/Login.jsx'



const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Hello world!</div>,
  },
]);

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <RouterProvider router={router} />
//   </React.StrictMode>
// );
const root = createRoot(document.body);
root.render(<h2><Chat /></h2>);