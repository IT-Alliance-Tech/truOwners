import React, { createContext, useContext, useState, useEffect } from 'react'
import { handleApiError, getErrorMessage } from '../utils/errorHandler'

const AdminAuthContext = createContext()

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('adminToken')
      const storedAdmin = localStorage.getItem('adminUser')
      
      if (storedToken && storedAdmin) {
        const parsedAdmin = JSON.parse(storedAdmin)
        if (parsedAdmin && parsedAdmin.id && parsedAdmin.email && parsedAdmin.role === 'admin') {
          setToken(storedToken)
          setAdmin(parsedAdmin)
        } else {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
        }
      }
    } catch (error) {
      console.error('Error restoring admin auth state:', error)
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    } finally {
      setLoading(false)
    }
  }, [])

  // Add error handling to the login function
const login = (adminData, authToken) => {
    try {
      if (!adminData || !authToken) {
        throw new Error('Invalid admin credentials provided')
      }
      
      if (adminData.role !== 'admin') {
        throw new Error('Access denied - admin privileges required')
      }
      
      setAdmin(adminData)
      setToken(authToken)
      localStorage.setItem('adminToken', authToken)
      localStorage.setItem('adminUser', JSON.stringify(adminData))
    } catch (error) {
      console.error('Admin login error:', error)
      setAdmin(null)
      setToken(null)
      throw error
    }
  }
  

  const logout = () => {
    try {
      setAdmin(null)
      setToken(null)
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    } catch (error) {
      console.error('Admin logout error:', error)
    }
  }

  const value = {
    admin,
    token,
    loading,
    isAuthenticated: !!admin && !!token && admin.role === 'admin',
    login,
    logout
  }

  

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
