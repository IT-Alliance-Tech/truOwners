import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_CONFIG, buildApiUrl } from '../config/api'
import { validateApiResponse } from '../utils/errorHandler'

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
  const [isSubscribed, setIsSubscribed] = useState(false) // NEW: Track subscription status
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    initializeAuth()
  }, [])

  // NEW: Proactively fetch subscription status whenever authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCurrentSubscription()
    }
  }, [isAuthenticated, token])

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.SUBSCRIPTION.MY_SUBSCRIPTION), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success && data.data) {
        // Handle both object and boolean status
        const isSub = !!data.data;
        setIsSubscribed(isSub)
        
        // Update user object in state and localStorage
        if (user) {
          const updatedUser = { ...user, isSubscribed: isSub }
          localStorage.setItem('authUser', JSON.stringify(updatedUser))
          setUser(updatedUser)
        }
        console.log('Proactive subscription check:', isSub)
      }
    } catch (error) {
      console.warn('Failed to proactively fetch subscription:', error)
    }
  }

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
          
          // NEW: Check subscription status from user data
          // You can check any of these fields based on your backend structure
          const subscriptionStatus = 
            parsedUser.isSubscribed || 
            parsedUser.isPremium || 
            parsedUser.subscriptionPlan === 'premium' ||
            parsedUser.subscription?.active === true ||
            false // Default to false if no subscription info
          
          setIsSubscribed(subscriptionStatus)
          
          console.log('Auth restored from localStorage')
          console.log('Subscription status:', subscriptionStatus)
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
      setLoading(false)
    }
  }

  // Basic token format validation
  const isValidTokenFormat = (token) => {
    return token && typeof token === 'string' && token.split('.').length === 3
  }

  // Clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    setIsSubscribed(false) // NEW: Clear subscription status
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
      
      // NEW: Set subscription status on login
      const subscriptionStatus = 
        userData.isSubscribed || 
        userData.isPremium || 
        userData.subscriptionPlan === 'premium' ||
        userData.subscription?.active === true ||
        false
      
      setIsSubscribed(subscriptionStatus)
      
      console.log('Login successful, data stored')
      console.log('Subscription status:', subscriptionStatus)
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
      
      // NEW: Update subscription status if it changed
      if (newUserData.isSubscribed !== undefined || 
          newUserData.isPremium !== undefined ||
          newUserData.subscriptionPlan !== undefined ||
          newUserData.subscription !== undefined) {
        const subscriptionStatus = 
          updatedUser.isSubscribed || 
          updatedUser.isPremium || 
          updatedUser.subscriptionPlan === 'premium' ||
          updatedUser.subscription?.active === true ||
          false
        
        setIsSubscribed(subscriptionStatus)
        console.log('Subscription status updated:', subscriptionStatus)
      }
      
      console.log('User data updated')
    } catch (error) {
      console.error('Update user error:', error)
    }
  }

  // NEW: Function to update subscription status
  const updateSubscription = (subscriptionStatus) => {
    try {
      setIsSubscribed(subscriptionStatus)
      
      // Also update in user object and localStorage
      if (user) {
        const updatedUser = { ...user, isSubscribed: subscriptionStatus }
        localStorage.setItem('authUser', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
      
      console.log('Subscription status updated:', subscriptionStatus)
    } catch (error) {
      console.error('Update subscription error:', error)
    }
  }

  // Check if token is expired
  const isTokenExpired = () => {
    if (!token) return true
    
    try {
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
    isSubscribed, // NEW: Expose subscription status
    loading,
    login,
    logout,
    updateUser,
    updateSubscription, // NEW: Expose subscription update function
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