import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import AddProperty from './AddProperty'
import PropertySuccessModal from './PropertySuccessModal'
import PropertyDetailsModal from './PropertyDetailsModal'
import './OwnerDashboard.css'
import ErrorBoundary from '../../common/ErrorBoundary'
















const OwnerDashboard = () => {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showAddProperty, setShowAddProperty] = useState(false)
    const [showPropertySuccess, setShowPropertySuccess] = useState(false)
    const [showPropertyDetails, setShowPropertyDetails] = useState(false)
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [successProperty, setSuccessProperty] = useState(null)
    const [totalProperties, setTotalProperties] = useState(0)
    const { user, token } = useAuth()

    useEffect(() => {
        fetchProperties()
    }, [])

    

    const fetchProperties = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(buildApiUrl(API_CONFIG.OWNER.PROPERTIES), {
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
                setProperties(data.data.properties || [])
                setTotalProperties(data.data.totalProperties || 0)
            } else {
                throw new Error(getErrorMessage(data))
            }
        } catch (err) {
            console.error('Fetch properties error:', err)
            setError(err.message || 'Failed to load properties. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddPropertyClick = () => {
        setShowAddProperty(true)
    }

    // Add this new function after handlePropertySuccess
    const handlePropertyUpdated = (property, action) => {
        setSuccessProperty({
            ...property,
            message: action === 'edit'
                ? 'Property updated successfully!'
                : 'Property deleted successfully!'
        })
        setShowPropertySuccess(true)
        fetchProperties()
    }
    


    const handlePropertySuccess = (property) => {
        setSuccessProperty(property.property)
        setShowAddProperty(false)
        setShowPropertySuccess(true)
        // Refresh properties list
        fetchProperties()
    }

    const handlePropertyClick = (property) => {
        setSelectedProperty(property)
        setShowPropertyDetails(true)
    }

    const handleCloseModals = () => {
        setShowAddProperty(false)
        setShowPropertySuccess(false)
        setShowPropertyDetails(false)
        setSelectedProperty(null)
        setSuccessProperty(null)
    }

    const getLocationString = (location) => {
        if (typeof location === 'string') {
            return location
        }
        if (location && typeof location === 'object') {
            // Handle object location - you might need to adjust this based on your actual data structure
            if (location.address) return location.address
            if (location.street) return location.street
            if (location.coordinates && (location.coordinates.lat || location.coordinates.lng)) {
                return `Lat: ${location.coordinates.lat}, Lng: ${location.coordinates.lng}`
            }
            return 'Location not specified'
        }
        return 'Location not specified'
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'warning', text: 'Under Review', icon: '🔍' },
            approved: { color: 'success', text: 'Approved', icon: '✅' },
            rejected: { color: 'danger', text: 'Rejected', icon: '❌' },
            suspended: { color: 'danger', text: 'Suspended', icon: '⚠️' },
            published: { color: 'success', text: 'Live', icon: '✅' }
        }

        const config = statusConfig[status] || statusConfig.pending
        return (
            <span className={`status-badge status-${config.color}`}>
                <span className="status-icon">{config.icon}</span>
                {config.text}
            </span>
        )
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="owner-dashboard">
                <div className="container">
                    <div className="dashboard-loading">
                        <div className="loading-spinner large"></div>
                        <p>Loading your properties...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="owner-dashboard">
                <div className="container">
                    {/* Header Section */}
                    <div className="dashboard-header">
                        <div className="header-content">
                            <h1>Welcome, {user?.name}!</h1>
                            <p className="header-subtitle">
                                Manage your properties and track their performance
                            </p>
                        </div>

                        {/* Big Add Property Button */}
                        <div className="header-actions">
                            <button
                                className="btn btn-primary btn-large add-property-btn"
                                onClick={handleAddPropertyClick}
                            >
                                <span className="btn-icon">🏠</span>
                                Add New Property
                            </button>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <div className="stat-icon">🏘️</div>
                            <div className="stat-content">
                                <h3>{totalProperties}</h3>
                                <p>Total Properties</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                                <h3>{properties.filter(p => p.status === 'approved').length}</h3>
                                <p>Live Properties</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">🔍</div>
                            <div className="stat-content">
                                <h3>{properties.filter(p => p.status === 'pending').length}</h3>
                                <p>Under Review</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-content">
                                <h3>{formatCurrency(properties.reduce((sum, p) => sum + (p.rent || 0), 0))}</h3>
                                <p>Total Monthly Rent</p>
                            </div>
                        </div>
                    </div>

                    {/* Properties Section */}
                    <div className="properties-section">
                        <div className="section-header">
                            <h2>Your Properties ({totalProperties})</h2>
                            {properties.length > 0 && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleAddPropertyClick}
                                >
                                    + Add Another
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="dashboard-error">
                                <span>⚠️</span>
                                {error}
                                <button
                                    className="btn btn-link"
                                    onClick={fetchProperties}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {properties.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🏠</div>
                                <h3>No Properties Yet</h3>
                                <p>Start building your rental portfolio by adding your first property to Truowners.</p>
                                <div className="empty-actions">
                                    <button
                                        className="btn btn-primary btn-extra-large add-first-property-btn"
                                        onClick={handleAddPropertyClick}
                                    >
                                        <span className="btn-icon">+</span>
                                        Add Your First Property
                                    </button>
                                    <p className="empty-help">
                                        It only takes a few minutes to list your property and start receiving inquiries from potential tenants.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="properties-grid">
                                {properties.map(property => (
                                    <div
                                        key={property.id}
                                        className="property-card"
                                        onClick={() => handlePropertyClick(property)}
                                    >
                                        <div className="property-image">
                                            {property.images && property.images.length > 0 ? (
                                                <img
                                                    src={property.images[0]}
                                                    alt={property.title}
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder-property.jpg'
                                                    }}
                                                />
                                            ) : (
                                                <div className="image-placeholder">
                                                    <span>🏠</span>
                                                    <p>No Image</p>
                                                </div>
                                            )}

                                            <div className="property-status">
                                                {getStatusBadge(property.status)}
                                            </div>
                                        </div>

                                        <div className="property-details">
                                            <h3 className="property-title">{property.title}</h3>
                                            <p className="property-location">📍 {getLocationString(property.location)}</p>

                                            <div className="property-specs">
                                                <span className="spec">
                                                    <strong>{property.bedrooms}</strong> Bed
                                                </span>
                                                <span className="spec">
                                                    <strong>{property.bathrooms}</strong> Bath
                                                </span>
                                                <span className="spec">
                                                    <strong>{property.area}</strong> sq ft
                                                </span>
                                            </div>

                                            <div className="property-pricing">
                                                <div className="rent">
                                                    <strong>{formatCurrency(property.rent)}</strong>
                                                    <span>/month</span>
                                                </div>
                                                <div className="deposit">
                                                    Deposit: <strong> {formatCurrency(property.deposit)}</strong>
                                                </div>
                                            </div>

                                            <div className="property-meta">
                                                <span className="property-type">{property.propertyType}</span>
                                                <span className="created-date">
                                                    Added {formatDate(property.createdAt)}
                                                </span>
                                            </div>

                                            {/* {property.amenities && property.amenities.length > 0 && (
                                                <div className="property-amenities">
                                                    {property.amenities.slice(0, 3).map(amenity => (
                                                        <span key={amenity} className="amenity-tag">
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                    {property.amenities.length > 3 && (
                                                        <span className="amenity-tag more">
                                                            +{property.amenities.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )} */}


  {/* {property.amenities && property.amenities.length > 0 && (
  <div
    className="property-amenities"
    ref={(el) => {
      if (!el) return;
      const containerWidth = el.clientWidth;
      const gap = 8; // must match CSS
      let usedWidth = 0;
      let count = 0;

      const measureWidth = (text) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = "500 14px Inter, sans-serif";
        const textWidth = ctx.measureText(text).width;
        return Math.ceil(textWidth + 24 + 2); // padding + border
      };

      for (let i = 0; i < property.amenities.length; i++) {
        const chipWidth = measureWidth(property.amenities[i]);
        const newWidth = count === 0 ? chipWidth : usedWidth + gap + chipWidth;
        const remaining = property.amenities.length - (i + 1);
        let moreWidth = 0;
        if (remaining > 0) {
          moreWidth = gap + measureWidth(`+${remaining} more`);
        }
        if (newWidth + moreWidth <= containerWidth) {
          usedWidth = newWidth;
          count++;
        } else {
          break;
        }
      }

      // Store visible count on DOM element for render
      el.dataset.visibleCount = Math.min(count, 3);
    }}
  >
    {property.amenities
      .slice(
        0,
        Math.min(
          parseInt(
            document.querySelector(".property-amenities")?.dataset.visibleCount ||
              2
          ),
          property.amenities.length
        )
      )
      .map((amenity) => (
        <span key={amenity} className="amenity-tag">
          {amenity}
        </span>
      ))}
    {property.amenities.length >
      parseInt(
        document.querySelector(".property-amenities")?.dataset.visibleCount || 2
      ) && (
      <span className="amenity-tag more">
        +
        {property.amenities.length -
          parseInt(
            document.querySelector(".property-amenities")?.dataset.visibleCount ||
              2
          )}{" "}
        more
      </span>
    )}
  </div>
)}   */}

 
 {property.amenities && property.amenities.length > 0 && (
  <div
    className="property-amenities"
    ref={(el) => {
      if (!el) return;
      const containerWidth = el.clientWidth;
      const gap = 8; // must match CSS
      let usedWidth = 0;
      let count = 0;

      const measureWidth = (text) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = "500 14px Inter, sans-serif";
        const textWidth = ctx.measureText(text).width;
        return Math.ceil(textWidth + 24 + 2); // padding + border
      };

      const maxVisible = 2; // target max

      for (let i = 0; i < property.amenities.length && count < maxVisible; i++) {
        const chipWidth = measureWidth(property.amenities[i]);
        const newWidth = count === 0 ? chipWidth : usedWidth + gap + chipWidth;

        const remaining = property.amenities.length - (i + 1);
        let moreWidth = 0;
        if (remaining > 0) {
          moreWidth = gap + measureWidth(`+${remaining} more`);
        }

        if (newWidth + moreWidth <= containerWidth) {
          usedWidth = newWidth;
          count++;
        } else {
          break;
        }
      }

      // If we reached 4 but overflow happens, drop to 3
      if (count === 3) {
        const chip4Width = measureWidth(property.amenities[3]);
        if (usedWidth + gap + chip4Width > containerWidth) {
          count = 2;
        }
      }

      el.dataset.visibleCount = count;
    }}
  >
    {property.amenities
      .slice(
        0,
        parseInt(
          document.querySelector(".property-amenities")?.dataset.visibleCount || 3
        )
      )
      .map((amenity) => (
        <span key={amenity} className="amenity-tag">
          {amenity}
        </span>
      ))}
    {property.amenities.length >
      parseInt(
        document.querySelector(".property-amenities")?.dataset.visibleCount || 3
      ) && (
      <span className="amenity-tag more">
        +
        {property.amenities.length -
          parseInt(
            document.querySelector(".property-amenities")?.dataset.visibleCount || 3
          )}{" "}
        more
      </span>
    )}
  </div>
)} 










                                        </div>

                                        <div className="property-actions">
                                            <button className="btn btn-link view-details">
                                                View Details →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddProperty && (
                <AddProperty
                    onClose={handleCloseModals}
                    onSuccess={handlePropertySuccess}
                />
            )}

            {showPropertySuccess && (
                <PropertySuccessModal
                    onClose={handleCloseModals}
                    property={successProperty}
                />
            )}

            {showPropertyDetails && selectedProperty && (
                <ErrorBoundary onRetry={() => setShowPropertyDetails(false)}>
                    <PropertyDetailsModal
                        property={selectedProperty}
                        onClose={handleCloseModals}
                        onUpdate={fetchProperties}
                        onSuccessAction={handlePropertyUpdated}
                    />
                </ErrorBoundary>
            )}
        </>
    )
}

export default OwnerDashboard
