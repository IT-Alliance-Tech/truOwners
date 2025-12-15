// update login jsx file

// in the auth folder
import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import './Auth.css'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'

const Login = ({ onClose, onSwitchToSignUp }) => {
  const [loginMethod, setLoginMethod] = useState('password') // 'password' or 'otp'
  const [step, setStep] = useState('login') // 'login', 'otp-verify', 'forgot', 'forgot-otp'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const { login } = useAuth()
  const inputRefs = React.useRef([])

  // ============================
  // FIX: HANDLE MULTI-LINE PASTE
  // ============================
  const handleEmailPaste = (e) => {
    const paste = e.clipboardData.getData("text");

    if (paste.includes("\n")) {
      e.preventDefault();
      const [pastedEmail, pastedPassword] = paste.split("\n");

      setFormData(prev => ({
        ...prev,
        email: pastedEmail.trim(),
        password: pastedPassword?.trim() || prev.password
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleOTPChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    if (error) setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // ===== LOGIN HANDLERS =====
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }
  
    setLoading(true)
    setError('')
  
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.LOGIN_PASSWORD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      })
  
      let data
      try {
        data = await response.json()
        validateApiResponse(data)
      } catch {
        throw new Error('Invalid response from server')
      }
  
      if (!response.ok) {
        throw new Error(data.error.message || handleApiError(null, response))
      }
  
      if (data.success) {
        login(data.data.user, data.data.token)
        onClose && onClose()
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSendOTP = async (e, isForgotFlow = false) => {
    e.preventDefault()
    
    if (!formData.email) {
      setError('Please enter your email address')
      return
    }
  
    setLoading(true)
    setError('')
  
    try {
      const endpoint = isForgotFlow
        ? API_CONFIG.AUTH.FORGOT_PASSWORD
        : API_CONFIG.AUTH.SEND_OTP

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        throw new Error(data.error || handleApiError(null, response))
      }
  
      if (data.success) {
        setStep(isForgotFlow ? 'forgot-otp' : 'otp-verify')
        setResendCooldown(60)
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
      console.error('Send OTP error:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPLogin = async (e) => {
    e.preventDefault()
    
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.LOGIN_OTP), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otpString
        }),
      })

      const data = await response.json()

      if (data.success) {
        login(data.data.user, data.data.token)
        onClose && onClose()
      } else {
        setError(data.error || 'Invalid OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      console.error('OTP login error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ===== FORGOT PASSWORD HANDLERS =====
  const handlePasswordReset = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')

    if (otpString.length !== 6 || !formData.password) {
      setError('Please enter OTP and your new password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.RESET_PASSWORD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otpString,
          newPassword: formData.password
        })
      })

      const data = await response.json()

      if (!data.success) throw new Error(getErrorMessage(data))

      alert('Password reset successful. Please log in.')
      setStep('login')
      setFormData({ email: '', password: '' })
      setOtp(['', '', '', '', '', ''])
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = (isForgotFlow = false) => {
    if (resendCooldown > 0) return
    const fakeEvent = { preventDefault: () => {} }
    handleSendOTP(fakeEvent, isForgotFlow)
  }

  const handleBackToLogin = () => {
    setStep('login')
    setOtp(['', '', '', '', '', ''])
    setError('')
  }

  // ===== RENDER STEPS =====
  if (step === 'otp-verify' || step === 'forgot-otp') {
    const isForgotFlow = step === 'forgot-otp'
    return (
      <div className="auth-overlay">
        <div className="auth-modal">
          <div className="auth-header">
            <h2>{isForgotFlow ? 'Reset Password' : 'Enter OTP'}</h2>
            <p>We've sent a 6-digit code to</p>
            <p className="email-highlight">{formData.email}</p>
            {onClose && <button className="auth-close" onClick={onClose}>×</button>}
          </div>

          <form className="auth-form" onSubmit={isForgotFlow ? handlePasswordReset : handleOTPLogin}>
            {error && <div className="auth-error"><span>⚠</span>{error}</div>}

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
                    className="otp-input"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            {isForgotFlow && (
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {isForgotFlow ? 'Resetting...' : 'Verifying...'}
                </>
              ) : (
                isForgotFlow ? 'Reset Password' : 'Login'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Didn't receive the code?{' '}
              <button
                className={`auth-link ${resendCooldown > 0 ? 'disabled' : ''}`}
                onClick={() => handleResendOTP(isForgotFlow)}
                disabled={resendCooldown > 0}
                type="button"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </p>
            <p>
              <button className="auth-link" onClick={handleBackToLogin} type="button">
                ← Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'forgot') {
    return (
      <div className="auth-overlay">
        <div className="auth-modal">
          <div className="auth-header">
            <h2>Forgot Password</h2>
            <p>Enter your email to receive an OTP for resetting your password</p>
            {onClose && <button className="auth-close" onClick={onClose}>×</button>}
          </div>

          <form className="auth-form" onSubmit={(e) => handleSendOTP(e, true)}>
            {error && <div className="auth-error"><span>⚠</span>{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onPaste={handleEmailPaste}
                placeholder="Enter your email address"
                required
                style={{marginBottom:'10px'}}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <button className="auth-link" onClick={handleBackToLogin} type="button">
                ← Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ===== DEFAULT LOGIN SCREEN =====
  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        {onClose && <button className="auth-close" onClick={onClose}>×</button>}
        <div className="auth-header">
          <h2>Welcome </h2>
          <p>Sign in to your Truowners account</p>
        </div>

        <div className="auth-form">
          {error && <div className="auth-error"><span>⚠</span>{error}</div>}

          <div className="login-method-selector">
            <button
              type="button"
              className={`method-option ${loginMethod === 'password' ? 'active' : ''}`}
              onClick={() => setLoginMethod('password')}
            >
              Password
            </button>
            <button
              type="button"
              className={`method-option ${loginMethod === 'otp' ? 'active' : ''}`}
              onClick={() => setLoginMethod('otp')}
            >
              OTP
            </button>
          </div>

          <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : (e) => handleSendOTP(e, false)}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onPaste={handleEmailPaste}
                placeholder="Enter your email address"
                required
                style={{marginBottom:'10px'}}
              />
            </div>

            {loginMethod === 'password' && (
              <>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <p className="forgot-password-link">
                  <button type="button" className="auth-link" onClick={() => setStep('forgot')}>
                    Forgot Password?
                  </button>
                </p>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {loginMethod === 'password' ? 'Signing In...' : 'Sending OTP...'}
                </>
              ) : (
                loginMethod === 'password' ? 'Sign In' : 'Send OTP'
              )}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button className="auth-link" onClick={onSwitchToSignUp} type="button">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
