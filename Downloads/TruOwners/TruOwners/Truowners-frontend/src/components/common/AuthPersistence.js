import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { buildApiUrl, API_CONFIG } from '../config/api'

// Component to wrap pages that need authentication persistence
const AuthPersistence = ({ children }) => {
  const { token, validateSession, logout } = useAuth()
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    // Validate token on component mount and periodically
    if (token) {
      validateTokenWithServer()
    }

    // Set up periodic token validation (every 5 minutes)
    const interval = setInterval(() => {
      if (token) {
        validateTokenWithServer()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [token])

  const validateTokenWithServer = async () => {
    if (!token || validating) return

    setValidating(true)
    
    try {
      // Make a simple API call to validate the token
      const response = await fetch(buildApiUrl('/auth/validate'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // Token is invalid, logout user
        console.log('Token validation failed, logging out')
        logout()
      }
    } catch (error) {
      console.error('Token validation error:', error)
      // On network errors, don't logout immediately
    } finally {
      setValidating(false)
    }
  }

  return children
}

// Higher-order component for protected routes
export const withAuthPersistence = (WrappedComponent) => {
  return function AuthPersistedComponent(props) {
    return (
      <AuthPersistence>
        <WrappedComponent {...props} />
      </AuthPersistence>
    )
  }
}

export default AuthPersistence