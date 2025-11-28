import React, { useState } from 'react'
import './HomePage.css'

const PropertyDetailsModal = ({ 
  property, 
  onClose, 
  isInWishlist, 
  onWishlistToggle, 
  isAuthenticated, 
  onAuthPrompt 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const getLocationString = (location) => {
    if (typeof location === 'string') {
      return location
    }
    if (location && typeof location === 'object') {
      if (location.address) return location.address
      if (location.street) return location.street
      if (location.city && location.state) return `${location.city}, ${location.state}`
      return 'Location not specified'
    }
    return 'Location not specified'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSafeImages = (images) => {
    if (Array.isArray(images)) {
      return images.filter(img => img && typeof img === 'string' && img.trim())
    }
    return []
  }

  const getSafeAmenities = (amenities) => {
    if (Array.isArray(amenities)) {
      return amenities.filter(amenity => amenity && typeof amenity === 'string' && amenity.trim())
    }
    return []
  }

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      onAuthPrompt()
      return
    }
    onWishlistToggle()
  }

  const handleContactOwner = () => {
    if (!isAuthenticated) {
      onAuthPrompt()
      return
    }
    // TODO: Implement contact owner functionality
    alert('Contact owner functionality coming soon!')
  }

  const safeImages = getSafeImages(property.images)
  const safeAmenities = getSafeAmenities(property.amenities)

  return (
    <div className="property-details-overlay">
      <div className="property-details-modal">
        <div className="modal-header">
          <h2>{property.title || 'Property Details'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Image Gallery */}
          {safeImages.length > 0 && (
            <div className="image-gallery">
              <div className="main-image">
                <img 
                  src={safeImages[currentImageIndex]} 
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  onError={(e) => {
                    e.target.src = '/placeholder-property.jpg'
                  }}
                />
                
                {safeImages.length > 1 && (
                  <>
                    <button 
                      className="image-nav prev"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? safeImages.length - 1 : prev - 1
                      )}
                    >
                      ‹
                    </button>
                    <button 
                      className="image-nav next"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === safeImages.length - 1 ? 0 : prev + 1
                      )}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              
              {safeImages.length > 1 && (
                <div className="image-thumbnails">
                  {safeImages.map((image, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={image} alt={`Thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Property Information */}
          <div className="property-info">
            <div className="property-header">
              <div className="property-basic-info">
                <h1>{property.title || 'Untitled Property'}</h1>
                <p className="location">📍 {getLocationString(property.location)}</p>
                <div className="property-specs">
                  <span>{property.bedrooms || 0} Bedrooms</span>
                  <span>{property.bathrooms || 0} Bathrooms</span>
                  <span>{property.area || 0} sq ft</span>
                  <span className="property-type">{property.propertyType || 'Property'}</span>
                </div>
              </div>
              
              <div className="property-actions">
                <button 
                  className={`wishlist-btn large ${isInWishlist ? 'active' : ''}`}
                  onClick={handleWishlistClick}
                  title={isAuthenticated ? (isInWishlist ? 'Remove from wishlist' : 'Add to wishlist') : 'Login to add to wishlist'}
                >
                  {isInWishlist ? '❤️' : '🤍'}
                </button>
              </div>
            </div>

            <div className="pricing-section">
              <div className="rent-info">
                <div className="rent">
                  <strong>{formatCurrency(property.rent)}</strong>
                  <span>/month</span>
                </div>
                <div className="deposit">
                  Security Deposit: {formatCurrency(property.deposit)}
                </div>
              </div>
              
              <button 
                className="btn btn-primary btn-large contact-btn"
                onClick={handleContactOwner}
              >
                {isAuthenticated ? '📞 Contact Owner' : '🔐 Login to Contact'}
              </button>
            </div>

            <div className="description-section">
              <h3>Description</h3>
              <p>{property.description || 'No description provided'}</p>
            </div>

            {safeAmenities.length > 0 && (
              <div className="amenities-section" sx={{color:'#2F80ED'}}>
                <h3>Amenities</h3>
                <div className="amenities-grid">
                  {safeAmenities.map(amenity => (
                    <span key={amenity} className="amenity-item">
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="property-meta">
              <div className="meta-item">
                <strong>Property ID:</strong> {property.id}
              </div>
              <div className="meta-item">
                <strong>Listed on:</strong> {formatDate(property.createdAt)}
              </div>
              <div className="meta-item">
                <strong>Status:</strong> 
                <span className="status-live">🟢 Available</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleContactOwner}
          >
            {isAuthenticated ? 'Contact Owner' : 'Login to Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetailsModal
