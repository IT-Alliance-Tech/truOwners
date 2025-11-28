import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true) // Add loading state for initial check

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = () => {
    try {
      // Get stored auth data
      const storedToken = localStorage.getItem('authToken')
      const storedUser = localStorage.getItem('authUser')
      
      if (storedToken && storedUser) {
        // Validate token format (basic check)
        if (isValidTokenFormat(storedToken)) {
          const parsedUser = JSON.parse(storedUser)
          
          // Set auth state
          setToken(storedToken)
          setUser(parsedUser)
          setIsAuthenticated(true)
          
          console.log('Auth restored from localStorage')
        } else {
          // Invalid token format, clear storage
          clearAuthData()
          console.log('Invalid token format, cleared auth data')
        }
      } else {
        console.log('No stored auth data found')
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      clearAuthData()
    } finally {
      setLoading(false) // Always set loading to false
    }
  }

  // Basic token format validation
  const isValidTokenFormat = (token) => {
    // Check if token looks like a JWT (has 3 parts separated by dots)
    // Or implement your own token validation logic
    return token && typeof token === 'string' && token.split('.').length === 3
  }

  // Clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  // Login function
  const login = (userData, authToken) => {
    try {
      // Validate inputs
      if (!userData || !authToken) {
        throw new Error('Invalid login data')
      }

      // Store in localStorage
      localStorage.setItem('authToken', authToken)
      localStorage.setItem('authUser', JSON.stringify(userData))
      
      // Update state
      setUser(userData)
      setToken(authToken)
      setIsAuthenticated(true)
      
      console.log('Login successful, data stored')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout function
  const logout = () => {
    try {
      clearAuthData()
      console.log('Logout successful')
      
      // Optional: Redirect to home page
      // window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Update user data (for profile updates, etc.)
  const updateUser = (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData }
      localStorage.setItem('authUser', JSON.stringify(updatedUser))
      setUser(updatedUser)
      console.log('User data updated')
    } catch (error) {
      console.error('Update user error:', error)
    }
  }

  // Check if token is expired (implement based on your token structure)
  const isTokenExpired = () => {
    if (!token) return true
    
    try {
      // For JWT tokens, decode and check expiration
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error checking token expiration:', error)
      return true
    }
  }

  // Validate current session
  const validateSession = async () => {
    if (!token || isTokenExpired()) {
      logout()
      return false
    }
    return true
  }

  // Context value
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    validateSession,
    isTokenExpired
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}