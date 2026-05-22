import { useState } from 'react'
import './App.css'
import Landing from './Pages/Landing'
import ChatPage from './Pages/ChatPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'chat'>('landing');

  return (
    <>
      {currentPage === 'landing' ? (
        <Landing onLaunchChat={() => setCurrentPage('chat')} />
      ) : (
        <ChatPage onBackToHome={() => setCurrentPage('landing')} />
      )}
    </>
  )
}

export default App

