import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import './Auth.css'

const OTPVerification = ({ email, onSuccess, onBack, onClose }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(60)
  const [retryCount, setRetryCount] = useState(0)
  const { login } = useAuth()
  const inputRefs = useRef([])
  const abortControllerRef = useRef(null)

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setResendCooldown(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)

    return () => {
      clearInterval(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Add prop validation and debug info
  useEffect(() => {
    console.log('🔍 OTP Component Mounted')
    console.log('  - Email:', email)
    console.log('  - onSuccess type:', typeof onSuccess)
    console.log('  - onBack type:', typeof onBack)
    console.log('  - onClose type:', typeof onClose)
    console.log('  - login function exists:', typeof login)
    console.log('  - AuthContext available:', !!login)
  }, [email, onSuccess, onBack, onClose, login])

  // Check for required email prop
  if (!email) {
    console.error('OTPVerification: email prop is required')
    return (
      <div className="auth-overlay">
        <div className="auth-modal">
          <div className="auth-header">
            <h2>Error</h2>
            <p>Email is required for verification</p>
          </div>
          <div className="auth-form">
            <button className="btn btn-secondary btn-full" onClick={onBack}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle individual digit input
  const handleOTPChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) value = value.slice(-1)
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Clear error when user starts typing
    if (error) setError('')

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste functionality
  const handlePaste = (e) => {
    e.preventDefault()
    
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    console.log('📋 OTP: Paste detected, cleaned data:', pastedData)
    
    if (pastedData.length === 6) {
      // If we have exactly 6 digits, fill all inputs
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      
      // Focus on the last input
      setTimeout(() => {
        inputRefs.current[5]?.focus()
      }, 0)
      
      // Clear any existing errors
      if (error) setError('')
      
      console.log('✅ OTP: All 6 digits pasted successfully')
    } else if (pastedData.length > 0) {
      // If we have some digits but not 6, fill what we can
      const newOtp = [...otp]
      const startIndex = otp.findIndex(digit => digit === '') || 0
      
      for (let i = 0; i < pastedData.length && (startIndex + i) < 6; i++) {
        newOtp[startIndex + i] = pastedData[i]
      }
      
      setOtp(newOtp)
      
      // Focus on the next empty input or last filled input
      const nextFocusIndex = Math.min(startIndex + pastedData.length, 5)
      setTimeout(() => {
        inputRefs.current[nextFocusIndex]?.focus()
      }, 0)
      
      console.log(`📋 OTP: ${pastedData.length} digits pasted`)
    } else {
      console.log('⚠️ OTP: No valid digits found in pasted content')
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    
    console.log('🚨 OTP Verification Started - Flow Type Check')
    console.log('  - Is this signup flow?', typeof onSuccess)
    console.log('  - Callback functions:', { onSuccess: !!onSuccess, onBack: !!onBack, onClose: !!onClose })
    
    // Prevent double submission
    if (loading) {
      console.log('⏸️ DEBUG: Already loading, preventing double submission')
      return
    }
    
    const otpString = otp.join('')
    console.log('🔢 DEBUG: OTP string:', otpString)
    
    if (otpString.length !== 6) {
      console.log('❌ DEBUG: OTP incomplete, length:', otpString.length)
      setError('Please enter the complete 6-digit OTP')
      return
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError('')

    console.log('📡 DEBUG: About to make API call...')
    console.log('  - URL:', buildApiUrl(API_CONFIG.AUTH.VALIDATE_OTP))
    console.log('  - Email:', email)
    console.log('  - OTP:', otpString)

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.VALIDATE_OTP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otpString
        }),
        signal: abortControllerRef.current.signal
      })

      console.log('📨 DEBUG: API Response received')
      console.log('  - Status:', response.status)
      console.log('  - OK:', response.ok)

      let data
      try {
        data = await response.json()
        validateApiResponse(data)
        console.log('📋 DEBUG: Response data:', data)
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        const errorMessage = handleApiError(null, response)
        throw new Error(data.error || errorMessage)
      }

      if (data.success) {
        console.log('✅ DEBUG: API call successful, proceeding with login...')
        console.log('🔐 OTP: About to login user')
        console.log('  - User data:', data.data.user)
        console.log('  - Token exists:', !!data.data.token)
        
        // Validate response data
        if (!data.data || !data.data.user || !data.data.token) {
          throw new Error('Invalid authentication data received')
        }

        // **CRITICAL: Check if login function is available**
        if (typeof login !== 'function') {
          console.error('❌ SIGNUP ISSUE: login function not available!')
          console.error('  - AuthContext not properly connected in signup flow')
          throw new Error('Authentication system error. Please refresh and try again.')
        }
        
        console.log('🔐 OTP: About to call login function...')
        
        try {
          // Call login and catch any errors
          login(data.data.user, data.data.token)
          console.log('✅ OTP: login() function called successfully')
          
          // Verify localStorage was updated
          setTimeout(() => {
            const storedToken = localStorage.getItem('authToken')
            const storedUser = localStorage.getItem('user')
            
            console.log('📦 OTP: Post-login storage check:')
            console.log('  - authToken stored:', !!storedToken)
            console.log('  - user stored:', !!storedUser)
            
            if (!storedToken || !storedUser) {
              console.error('❌ OTP: Data not stored in localStorage after login!')
              console.error('  - storedToken:', storedToken)
              console.error('  - storedUser:', storedUser)
            } else {
              console.log('✅ OTP: Login data successfully stored')
            }
          }, 100)
          
        } catch (loginError) {
          console.error('❌ OTP: Error calling login function:', loginError)
          throw new Error('Login failed after verification')
        }
        
        // **Wait for state to propagate before calling callbacks**
        console.log('⏳ OTP: Waiting for auth state to update...')
        setTimeout(() => {
          console.log('📞 OTP: Calling success callbacks')
          onSuccess && onSuccess(data.data)
        }, 500) // Increased delay for signup flow
        
        // **Separate timeout for closing modal**
        setTimeout(() => {
          console.log('🚪 OTP: Closing modal')
          onClose && onClose()
        }, 1200) // Even longer delay for modal close
        
      } else {
        console.log('❌ DEBUG: API call failed:', data.error)
        const errorMessage = getErrorMessage(data)
        throw new Error(errorMessage)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was cancelled')
        return // Request was cancelled
      }
      
      console.log('💥 DEBUG: API call threw error:', err)
      console.error('OTP verification error:', err)
      
      // Handle specific error cases
      if (err.message.includes('network') || err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else if (err.message.includes('invalid') || err.message.includes('expired')) {
        setError('Invalid or expired OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(err.message || 'Verification failed. Please try again.')
      }
      
      setRetryCount(prev => prev + 1)
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError('')
      }, 5000)
      
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loading) return

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          resend: true
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || handleApiError(null, response))
      }
      
      if (data.success) {
        setResendCooldown(60)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setRetryCount(0) // Reset retry count on successful resend
        
        // Start countdown timer
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>Verify Your Email</h2>
          <p>We've sent a 6-digit code to</p>
          <p className="email-highlight">{email}</p>
          {onClose && (
            <button className="auth-close" onClick={onClose}>×</button>
          )}
        </div>

        <form className="auth-form" onSubmit={handleVerifyOTP}>
          {error && (
            <div className="auth-error">
              <span>⚠️</span>
              <div>
                {error}
                {retryCount > 2 && (
                  <div className="error-help">
                    <small>Still having trouble? Try requesting a new code.</small>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="otp-container">
            <label className="otp-label">Enter verification code</label>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="otp-input"
                  autoComplete="off"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Didn't receive the code?{' '}
            <button 
              className={`auth-link ${resendCooldown > 0 || loading ? 'disabled' : ''}`}
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              type="button"
            >
              {loading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </p>
          <p>
            <button 
              className="auth-link" 
              onClick={onBack}
              type="button"
              disabled={loading}
            >
              ← Back to Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default OTPVerification
