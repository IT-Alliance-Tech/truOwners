import React, { useState } from 'react'
import { useAdminAuth } from '../../../context/AdminAuthContext'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import './AdminLogin.css'

const AdminLogin = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminKey: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const { login } = useAdminAuth()
  console.log("test");

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Rate limiting - max 3 attempts
    if (attemptCount >= 3) {
      setError('Too many failed attempts. Access denied for security reasons.')
      return
    }

    if (!formData.email || !formData.password || !formData.adminKey) {
      setError('All fields are required for admin access')
      return
    }

    // Simple admin key validation (you can enhance this)
    if (formData.adminKey !== 'TRUOWNERS_ADMIN_2025') {
      setError('Invalid admin access key')
      setAttemptCount(prev => prev + 1)
      return
    }

    setLoading(true)
    setError('')

    try {
      // **Use the same login API as regular users**
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.LOGIN_PASSWORD), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      })

      let data
      try {
        
        data = await response.json()
        console.log('API Response Data:', data)
        validateApiResponse(data)
      } catch (parseError) {
        if (data.success === false && data.error) {
    throw new Error(data.error.message);
  }
        throw new Error('Invalid server response')
      }

      if (!response.ok) {
        if (response.status === 401) {
          setAttemptCount(prev => prev + 1)
          throw new Error('Invalid admin credentials')
        }
        throw new Error(data.error || handleApiError(null, response))
      }

      if (data.success) {
        // **Check if user has admin role**
        if (data.data.user.role !== 'admin') {
          setAttemptCount(prev => prev + 1)
          throw new Error('Access denied - admin privileges required')
        }
        
        login(data.data.user, data.data.token)
        console.log('Admin logged in successfully')
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Admin login error:', err)
      setError(err.message || 'Login failed. Please verify your admin credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-modal">
        <div className="admin-login-header">
          <h2>🔒 Admin Access Portal</h2>
          <p>Authorized Personnel Only</p>
          {onClose && (
            <button className="admin-close" onClick={onClose}>×</button>
          )}
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="admin-error">
              <span>⚠️</span>
              {error}
              {attemptCount >= 2 && (
                <div className="security-warning">
                  <small>Security Warning: Multiple failed attempts detected</small>
                </div>
              )}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@truowners.com"
              required
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Admin Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter admin password"
              required
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="adminKey">Admin Access Key</label>
            <input
              type="password"
              id="adminKey"
              name="adminKey"
              value={formData.adminKey}
              onChange={handleInputChange}
              placeholder="Enter admin access key"
              required
              disabled={loading}
            />
            <small className="key-hint">Contact system administrator for access key</small>
          </div>

          <button 
            type="submit" 
            className="admin-submit-btn"
            disabled={loading || attemptCount >= 3}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Authenticating...
              </>
            ) : (
              '🔓 Access Admin Panel'
            )}
          </button>
        </form>

        <div className="admin-footer">
          <div className="security-notice">
            <p>⚡ This is a secure admin portal</p>
            <p>All access attempts are logged and monitored</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
