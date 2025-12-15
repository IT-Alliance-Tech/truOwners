import React, { useState } from 'react'
import { useAdminAuth } from '../../../context/AdminAuthContext'
import AdminLogin from './AdminLogin'
import './AdminLogin.css'

const SecretAdminAccess = () => {
  const { isAuthenticated } = useAdminAuth()
  const [showWarning, setShowWarning] = useState(true)

  // If already authenticated as admin, redirect to dashboard
  if (isAuthenticated) {
    window.location.href = '/admin/dashboard'
    return null
  }

  return (
    <div className="secret-admin-page">
      {showWarning && (
        <div className="security-warning-overlay">
          <div className="security-warning-modal">
            <div className="warning-header">
              <h2>🚨 RESTRICTED AREA</h2>
              <p>Unauthorized Access is Prohibited</p>
            </div>
            
            <div className="warning-content">
              <div className="warning-icon">⚠️</div>
              <p>This area is restricted to authorized administrators only.</p>
              <p>All access attempts are logged and monitored.</p>
              <p>Unauthorized access may result in legal action.</p>
            </div>
            
            <div className="warning-actions">
              <button 
                className="btn-warning-exit"
                onClick={() => window.location.href = '/'}
              >
                Exit Immediately
              </button>
              <button 
                className="btn-proceed"
                onClick={() => setShowWarning(false)}
              >
                I Am Authorized - Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!showWarning && <AdminLogin />}
    </div>
  )
}

export default SecretAdminAccess
