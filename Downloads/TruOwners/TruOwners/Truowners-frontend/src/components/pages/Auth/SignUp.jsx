import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext' // Add this import
import OTPVerification from './OTPVerification'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import './Auth.css'

const SignUp = ({ onClose, onSwitchToLogin }) => {
  const [currentStep, setCurrentStep] = useState('signup')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' // Default to user, no selection needed
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const { login } = useAuth() // Add this line

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSignUp = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUserEmail(formData.email)
        setCurrentStep('otp')
      } else {
        setError(data.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Updated handleOTPSuccess to accept user data and token
  const handleOTPSuccess = (userData, token) => {
    console.log('User verified successfully!')
    // Store user in auth context just like in Login
    login(userData, token)
    onClose && onClose()
  }

  const handleBackToSignUp = () => {
    setCurrentStep('signup')
    setError('')
  }

  if (currentStep === 'otp') {
    return (
      <OTPVerification
        email={userEmail}
        onSuccess={handleOTPSuccess}
        onBack={handleBackToSignUp}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        {onClose && (
          <button className="auth-close" onClick={onClose}>×</button>
        )}
        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Join Truowners to find your perfect rental home</p>
        </div>

        <form className="auth-form" onSubmit={handleSignUp}>
          {error && (
            <div className="auth-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="number"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a strong password"
              required
            />
            <small className="form-hint">
              Password must be at least 8 characters long
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              className="auth-link"
              onClick={onSwitchToLogin}
              type="button"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp