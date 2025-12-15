import React from 'react'
import './Owner.css'

const PropertySuccessModal = ({ onClose, property }) => {
  return (
    <div className="auth-overlay">
      <div className="auth-modal success-modal">
        <div className="success-content">
          <div className="success-icon">
            ✅
          </div>
          
          <h2>Property Submitted Successfully!</h2>
          
          <div className="success-message">
            <p className="primary-message">
              Thank you for listing <strong>"{property?.title}"</strong> with Truowners.
            </p>
            
            <div className="verification-notice">
              <div className="notice-icon">🔍</div>
              <div className="notice-content">
                <h3>Under Review</h3>
                <p>Your property is currently being reviewed by our team to ensure quality and accuracy.</p>
              </div>
            </div>
            
            <div className="verification-info">
              <h3>What happens next?</h3>
              <div className="verification-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Property Review</strong>
                    <p>Our team will verify your property details, images, and information within 24-48 hours</p>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Quality Check</strong>
                    <p>We'll ensure all information meets our platform standards and guidelines</p>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>Go Live</strong>
                    <p>Once approved, your property will be visible to thousands of potential tenants</p>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <strong>Start Receiving Inquiries</strong>
                    <p>You'll receive email notifications when tenants show interest in your property</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="next-steps">
              <h3>In the meantime:</h3>
              <div className="tips-grid">
                <div className="tip-item">
                  <span className="tip-icon">📧</span>
                  <div>
                    <strong>Check Your Email</strong>
                    <p>We'll send updates on your property's verification status</p>
                  </div>
                </div>
                
                <div className="tip-item">
                  <span className="tip-icon">📱</span>
                  <div>
                    <strong>Keep Contact Info Updated</strong>
                    <p>Ensure your phone and email are current for tenant inquiries</p>
                  </div>
                </div>
                
                <div className="tip-item">
                  <span className="tip-icon">🏠</span>
                  <div>
                    <strong>Add More Properties</strong>
                    <p>List additional properties to maximize your rental opportunities</p>
                  </div>
                </div>
                
                <div className="tip-item">
                  <span className="tip-icon">⚡</span>
                  <div>
                    <strong>Prepare for Inquiries</strong>
                    <p>Be ready to respond quickly to potential tenant questions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="estimated-time">
              <div className="time-badge">
                <span className="clock-icon">⏱️</span>
                <div>
                  <strong>Estimated Review Time</strong>
                  <p>24-48 hours</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="success-actions">
            <button className="btn btn-primary" onClick={onClose}>
              Perfect, Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertySuccessModal
