import * as React from 'react';
import Chat from './components/Chat.jsx';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.body);
root.render(<h2><Chat /></h2>);