import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import PropertyCard from '../Home/PropertyCard'
import './WishlistPage.css'

const WishlistPage = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, token } = useAuth()
  const [wishlistProperties, setWishlistProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user?.role !== 'user') {
      navigate('/')
      return
    }

    fetchWishlist()
  }, [isAuthenticated, user, navigate])

  const fetchWishlist = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.USER.WISHLIST), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      let data
      try {
        data = await response.json()
        validateApiResponse(data)
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        throw new Error(data.error || handleApiError(null, response))
      }

      if (data.success) {
        // FIXED: Access properties from the correct path in API response
        const properties = data.data?.wishlist?.properties || []
        setWishlistProperties(properties)
        console.log('Wishlist fetched:', properties.length, 'properties')
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Fetch wishlist error:', err)
      setError(err.message || 'Failed to load wishlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // UPDATED: Use the correct API endpoint structure for removing items
  const handleRemoveFromWishlist = async (propertyId) => {
    try {
      // Use the same endpoint structure as adding to wishlist
      const response = await fetch(buildApiUrl(API_CONFIG.USER.WISHLIST), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: propertyId
        })
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (response.ok && data.success) {
        // Remove the property from the local state
        setWishlistProperties(prev => prev.filter(property => property.id !== propertyId))
        console.log('Property removed from wishlist:', propertyId)
      } else {
        throw new Error(data.error || 'Failed to remove from wishlist')
      }
    } catch (err) {
      console.error('Remove from wishlist error:', err)
      alert(err.message || 'Failed to remove from wishlist. Please try again.')
    }
  }

  const handlePropertyClick = (property) => {
    navigate(`/property/${property.id}`)
  }

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner large"></div>
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        {/* Back Navigation */}
        <div className="back-navigation">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Properties
          </button>
        </div>

        {/* Page Header */}
        <div className="wishlist-header">
          <div className="header-content">
            <h1 className="wishlist-title">
              <span className="wishlist-icon">❤️</span>
              My Wishlist
            </h1>
            <p className="wishlist-subtitle">
              {wishlistProperties.length} saved propert{wishlistProperties.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="retry-btn" onClick={fetchWishlist}>
              Try Again
            </button>
          </div>
        )}

        {/* Wishlist Content */}
        <div className="wishlist-content">
          {wishlistProperties.length === 0 ? (
            <div className="empty-wishlist">
              <div className="empty-icon">💔</div>
              <h2>Your wishlist is empty</h2>
              <p>Start exploring properties and add your favorites to your wishlist!</p>
              <button 
                className="btn btn-primary explore-btn"
                onClick={() => navigate('/')}
              >
                Explore Properties
              </button>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlistProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isInWishlist={true}
                  onWishlistToggle={() => handleRemoveFromWishlist(property.id)}
                  onClick={() => handlePropertyClick(property)}
                  onLoginRequired={() => {}} // Not needed since user is already authenticated
                  isAuthenticated={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WishlistPage
