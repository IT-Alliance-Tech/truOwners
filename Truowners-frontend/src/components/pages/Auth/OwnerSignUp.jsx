import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext' // Add this import
import OTPVerification from './OTPVerification'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { uploadFile, generateFileName } from '../../../config/supabase'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import './Auth.css'

const OwnerSignUp = ({ onClose, onSwitchToLogin }) => {
  const [currentStep, setCurrentStep] = useState('signup') // 'signup' or 'otp'
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'owner',
    idProofNumber: '',
    idProofType: 'Aadhar',
    idProofImageUrl: ''
  })
  const [idProofFile, setIdProofFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
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
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB')
      return
    }

    setIdProofFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target.result)
    }
    reader.readAsDataURL(file)

    // Clear any existing URL since we're now using file upload
    setFormData(prev => ({
      ...prev,
      idProofImageUrl: ''
    }))

    if (error) setError('')
  }

  const removeImage = () => {
    setIdProofFile(null)
    setImagePreview('')
    setFormData(prev => ({
      ...prev,
      idProofImageUrl: ''
    }))
  }

  const validateForm = () => {
    if (!formData.firstname.trim()) {
      setError('First name is required')
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
    if (!formData.idProofNumber.trim()) {
      setError('ID proof number is required')
      return false
    }
    if (!idProofFile && !formData.idProofImageUrl.trim()) {
      setError('Please upload your ID proof image')
      return false
    }
    return true
  }

  // *THE MISSING FUNCTION* - handleSignUp
  const handleSignUp = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      // Upload ID proof image first
      let imageUrl = ''
      try {
        imageUrl = await uploadIdProofImage()
      } catch (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`)
      }

      const response = await fetch(buildApiUrl(API_CONFIG.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstname,
          lastName: formData.lastname,
          phone:formData.phone,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          idProofNumber: formData.idProofNumber,
          idProofType: formData.idProofType,
          idProofImageUrl: imageUrl
        }),
      })

      let data
      try {
        data = await response.json()
        validateApiResponse(data)
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        const errorMessage = handleApiError(null, response)
        throw new Error(data.error.message || errorMessage)
      }

      if (data.success) {
        setUserEmail(formData.email)
        setCurrentStep('otp')
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Registration error:', err)

      // Handle specific error cases
      if (err.message.includes('email')) {
        setError('This email is already registered. Please use a different email or try logging in.')
      } else if (err.message.includes('network')) {
        setError('Network error. Please check your connection and try again.')
      } else if (err.message.includes('upload')) {
        setError(err.message) // Show specific upload error
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Update the uploadIdProofImage function:
  const uploadIdProofImage = async () => {
    if (!idProofFile) return formData.idProofImageUrl

    setUploadingImage(true)

    try {
      const fileName = generateFileName(idProofFile.name, formData.email)
      const uploadResult = await uploadFile(idProofFile, fileName)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload image')
      }

      if (!uploadResult.url) {
        throw new Error('Upload completed but no URL received')
      }

      return uploadResult.url
    } catch (err) {
      console.error('Image upload error:', err)

      if (err.message.includes('size')) {
        throw new Error('Image file is too large. Please use a smaller image.')
      } else if (err.message.includes('type')) {
        throw new Error('Invalid image format. Please use JPG, PNG, or WebP.')
      } else if (err.message.includes('network')) {
        throw new Error('Network error during upload. Please try again.')
      } else {
        throw new Error(err.message || 'Image upload failed. Please try again.')
      }
    } finally {
      setUploadingImage(false)
    }
  }

  // Updated handleOTPSuccess to accept userData and token as separate parameters
  const handleOTPSuccess = (userData, token) => {
    console.log('Owner verified and logged in successfully!')
    console.log('User data:', userData)
    console.log('Token exists:', !!token)

    // Store user in auth context just like in Login and SignUp
    login(userData, token)

    // Close the owner signup modal since user is now logged in
    if (onClose) {
      onClose()
    }
  }

  const handleBackToSignUp = () => {
    setCurrentStep('signup')
    setError('')
  }

  // Handle OTP verification step
  if (currentStep === 'otp') {
    if (!userEmail) {
      console.error('No email available for OTP verification')
      setCurrentStep('signup')
      setError('Email is required for verification. Please try again.')
      return null
    }

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
      <div className="auth-modal owner-signup-modal">
        {onClose && (
          <button className="auth-close" onClick={onClose}>×</button>
        )}
        <div className="auth-header">
          <h2>Join as Property Owner</h2>
          <p>List your properties and reach thousands of potential tenants</p>

        </div>

        <form className="auth-form" onSubmit={handleSignUp}>
          {error && (
            <div className="auth-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <div >

            <div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstname">First Name *</label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    placeholder="Enter your First name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastname">Last Name *</label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>

              
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
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
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="number"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
               
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
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
                  <label htmlFor="confirmPassword">Confirm Password *</label>
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
              </div>
            </div>

            <div>

              <div className="form-section">
                <h3 className="section-title">Identity Verification</h3>
                <p className="section-subtitle">We need to verify your identity to ensure platform security</p>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="idProofType">ID Proof Type *</label>
                    <select
                      id="idProofType"
                      name="idProofType"
                      value={formData.idProofType}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="Aadhar">Aadhar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="DrivingLicense">Driving License</option>
                      <option value="VoterID">Voter ID</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="idProofNumber">ID Proof Number *</label>
                    <input
                      type="text"
                      id="idProofNumber"
                      name="idProofNumber"
                      value={formData.idProofNumber}
                      onChange={handleInputChange}
                      placeholder="Enter ID proof number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="idProofImage">Upload ID Proof Image *</label>

                  {!imagePreview ? (
                    <div className="file-upload-area">
                      <input
                        type="file"
                        id="idProofImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                      />
                      <label htmlFor="idProofImage" className="file-upload-label">
                        <div className="upload-icon">📎</div>
                        <div className="upload-text">
                          <strong>Click to upload</strong> or drag and drop
                        </div>
                        <div className="upload-hint">
                          PNG, JPG, or WebP (max 5MB)
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="image-preview-container">
                      <div className="image-preview">
                        <img src={imagePreview} alt="ID Proof Preview" />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={removeImage}
                        >
                          ×
                        </button>
                      </div>
                      <p className="image-name">{idProofFile?.name}</p>
                      <button
                        type="button"
                        className="change-image-btn"
                        onClick={() => document.getElementById('idProofImage').click()}
                      >
                        Change Image
                      </button>
                      <input
                        type="file"
                        id="idProofImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}

                  <small className="form-hint">
                    Please ensure the image is clear and all details are readable
                  </small>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <span className="loading-spinner"></span>
                    Uploading Image...
                  </>
                ) : loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Owner Account'
                )}
              </button>
            </div>
          </div>

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

export default OwnerSignUp
