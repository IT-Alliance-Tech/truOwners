import React, { useState } from 'react'
import Login from '../Auth/Login'  // Updated path
import Register from '../Auth/SignUp'  // Updated path
import './HomePage.css'

const AuthPromptModal = ({ onClose }) => {
  const [authMode, setAuthMode] = useState('prompt') // 'prompt', 'login', 'register'

  const handleAuthSuccess = () => {
    onClose()
    // The page will automatically refresh the wishlist due to useEffect dependency
  }

  if (authMode === 'login') {
    return <Login onClose={onClose} onSuccess={handleAuthSuccess} />
  }

  if (authMode === 'register') {
    return <Register onClose={onClose} onSuccess={handleAuthSuccess} />
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal auth-prompt-modal">
        <div className="auth-header">
          <h2>Save to Wishlist</h2>
          <p>Create an account or login to save your favorite properties</p>
          <button className="auth-close" onClick={onClose}>×</button>
        </div>
      </div>
    </div>
  )
}

export default AuthPromptModal
