import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import './PropertyDetailsPage.css'


// MUI imports

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid,
   IconButton
} 
from '@mui/material'


import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import FacebookIcon from "@mui/icons-material/Facebook";
import TelegramIcon from "@mui/icons-material/Telegram";
import CloseIcon from "@mui/icons-material/Close";

// Temporary placeholder for "X" (Twitter) – later we can replace with correct SVG
import ClearIcon from "@mui/icons-material/Clear";

import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import EditIcon from '@mui/icons-material/Edit'
import PendingIcon from '@mui/icons-material/Pending'
import CancelIcon from '@mui/icons-material/Cancel'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import dayjs from 'dayjs'
import PropertyCard from '../Home/PropertyCard'
import bed from '../../../assets/images/Bed.png';
import bath from '../../../assets/images/Bath.png';
import areaImg from '../../../assets/images/area.png';
import trueOwnersLogo from "../../../assets/images/truownerslogo.png"
import { Favorite, FavoriteOutlined } from '@mui/icons-material'
import { styled } from "@mui/material/styles";
import LockIcon from '@mui/icons-material/Lock';
import SubscriptionBanner from '../../common/SubscriptionBanner';


const PropertyDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, token, loading: authLoading, validateSession } = useAuth()
  const [property, setProperty] = useState(null)
  const [similarProperties, setSimilarProperties] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [unlockContact, setUnlockContact] = useState()
  const [subscription, setSubscription] = useState(null)
  const [checkingSubscription, setCheckingSubscription] = useState(true)

  // Booking state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingBookingId, setEditingBookingId] = useState(null)
  const [shareOpen, setShareOpen] = useState(false);
  const shareUrl = `https://truowners.com/property-details/${id}`;; // ✅ later replace with dynamic property link

const handleCopy = () => {
  navigator.clipboard.writeText(shareUrl);
  alert("Link copied!");
};


  // New booking info state
  const [bookingInfo, setBookingInfo] = useState({
    userHasBooking: false,
    bookedSlots: []
  })

  // Available time slots
  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM'
  ]

  useEffect(() => {
    // Wait for auth context to finish loading before fetching data
    if (!authLoading) {
      fetchPropertyDetails()
      if (isAuthenticated && user?.role === 'user') {
        checkWishlistStatus()
        fetchSubscription()
      } else {
        setCheckingSubscription(false)
      }
    }
  }, [id, isAuthenticated, user?.role, authLoading])

  const fetchSubscription = async () => {
    try {
      // const token = localStorage.getItem('token') // Use token from context
      const response = await fetch(buildApiUrl(API_CONFIG.SUBSCRIPTION.MY_SUBSCRIPTION), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success && data.data) {
        setSubscription(data.data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setCheckingSubscription(false)
    }
  }

  const fetchPropertyDetails = async () => {
    setLoading(true)
    setError('')

    try {
      // Validate session if user is authenticated
      if (isAuthenticated && !(await validateSession())) {
        setError('Session expired. Please login again.')
        return
      }

      const headers = {
        'Content-Type': 'application/json'
      }

      // Add auth header if user is authenticated and token exists
      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(buildApiUrl(`${API_CONFIG.USER.PROPERTIES}/${id}`), {
        method: 'GET',
        headers
      })

      let data
      try {
        data = await response.json()
        validateApiResponse(data)
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - token might be expired
          setError('Authentication expired. Please login again.')
          // Don't auto-logout here as property might be viewable without auth
          return
        }
        if (response.status === 404) {
          throw new Error('Property not found')
        }
        throw new Error(data.error || handleApiError(null, response))
      }

      if (data.success) {
        setProperty(data.data.property)
        setSimilarProperties(data.data.similarProperties);
        // Set booking info if available
        if (data.data.bookingInfo) {
          setBookingInfo(data.data.bookingInfo)
        }
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Fetch property details error:', err)
      setError(err.message || 'Failed to load property details. Please try again.')
    } finally {
      setLoading(false)
    }
  }



  const contactOwnerFn = async () => {
    try {
      // Validate session if user is authenticated
      if (isAuthenticated && !(await validateSession())) {
        setError('Session expired. Please login again.')
        return
      }

      const headers = {
        'Content-Type': 'application/json'
      }

      // Add auth header if user is authenticated and token exists
      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(buildApiUrl(API_CONFIG.PROPERTY_VIEWS.VIEW_OWNER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: id
        })
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please login again.')
          return
        }
        if (response.status === 403) {
          // Subscription issue (expired, limit reached, or none)
          alert(data.error?.message || 'Please subscribe to view owner details')
          navigate('/subscription-plans')
          return
        }
        throw new Error(data.error?.message || 'Failed to unlock contact')
      }

      if (data.success) {
        console.log('Owner details unlocked:', data.data)
        setUnlockContact(data.data)
        // Refresh subscription data to update credits
        fetchSubscription()
      } else {
        throw new Error(data.error?.message || 'Failed to unlock contact')
      }
    } catch (err) {
      console.error('Contact owner error:', err)
      alert(err.message || 'Failed to contact owner. Please try again.')
    } finally {
      setLoading(false)
    }
  }





  const checkWishlistStatus = async () => {
    if (!isAuthenticated || !token || user?.role !== 'user') return

    try {
      // Validate session before making API call
      if (!(await validateSession())) {
        return
      }

      const response = await fetch(buildApiUrl(API_CONFIG.USER.WISHLIST), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.wishlist) {
          const wishlistPropertyIds = data.data.wishlist.properties.map(prop => prop.id) || []
          setIsInWishlist(wishlistPropertyIds.includes(id))
        }
      } else if (response.status === 401) {
        console.warn('Unauthorized access to wishlist')
        // Token might be expired, but don't force logout
      }
    } catch (err) {
      console.warn('Failed to fetch wishlist:', err)
    }
  }

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', `/property/${id}`)
      navigate('/login')
      return
    }

    if (user?.role !== 'user') {
      alert('Only users can add properties to wishlist')
      return
    }

    // Validate session before making API call
    if (!(await validateSession())) {
      setError('Session expired. Please login again.')
      return
    }

    setWishlistLoading(true)

    try {
      let response

      if (isInWishlist) {
        // REMOVE from wishlist
        response = await fetch(buildApiUrl(`${API_CONFIG.USER.WISHLIST_REMOVE}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            propertyId: id
          })
        })
      } else {
        // ADD to wishlist
        response = await fetch(buildApiUrl(API_CONFIG.USER.WISHLIST), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            propertyId: id
          })
        })
      }

      let data
      try {
        data = await response.json()
        validateApiResponse(data)
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (response.status === 401) {
        throw new Error('Session expired. Please login again.')
      }

      if (response.ok && data.success) {
        setIsInWishlist(!isInWishlist)

        const action = !isInWishlist ? 'added to' : 'removed from'
        console.log(`Property ${action} wishlist successfully`)
      } else {
        throw new Error(data.error || getErrorMessage(data))
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err)
      setError(err.message || 'Failed to update wishlist. Please try again.')
    } finally {
      setWishlistLoading(false)
    }
  }

  // Check if a specific date and time slot is booked by others (not current user)
  const isSlotBookedByOthers = (date, timeSlot) => {
    if (!bookingInfo.bookedSlots || bookingInfo.bookedSlots.length === 0) return false

    return bookingInfo.bookedSlots.some(slot => {
      const slotDate = dayjs(slot.date).format('YYYY-MM-DD')
      const selectedDateStr = date.format('YYYY-MM-DD')
      return slotDate === selectedDateStr && slot.timeSlot === timeSlot && !slot.bookedByCurrentUser
    })
  }

  // Check if current user has booked a specific slot
  const isSlotBookedByCurrentUser = (date, timeSlot) => {
    if (!bookingInfo.bookedSlots || bookingInfo.bookedSlots.length === 0) return false

    return bookingInfo.bookedSlots.some(slot => {
      const slotDate = dayjs(slot.date).format('YYYY-MM-DD')
      const selectedDateStr = date.format('YYYY-MM-DD')
      return slotDate === selectedDateStr && slot.timeSlot === timeSlot && slot.bookedByCurrentUser
    })
  }

  // Get current user's bookings for display
  const getCurrentUserBookings = () => {
    if (!bookingInfo.bookedSlots) return []

    return bookingInfo.bookedSlots.filter(slot => slot.bookedByCurrentUser)
  }

  // Get booking status icon and color
  const getBookingStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: <PendingIcon />,
          color: 'warning',
          label: 'Pending Confirmation'
        }
      case 'approved':
        return {
          icon: <CheckCircleIcon />,
          color: 'success',
          label: 'Confirmed'
        }
      case 'rejected':
        return {
          icon: <CancelIcon />,
          color: 'error',
          label: 'Rejected'
        }
      case 'completed':
        return {
          icon: <TaskAltIcon />,
          color: 'info',
          label: 'Completed'
        }
      default:
        return {
          icon: <PendingIcon />,
          color: 'default',
          label: 'Unknown'
        }
    }
  }

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return timeSlots

    return timeSlots.map(slot => ({
      value: slot,
      label: slot,
      isBookedByOthers: isSlotBookedByOthers(selectedDate, slot),
      isBookedByCurrentUser: isSlotBookedByCurrentUser(selectedDate, slot)
    }))
  }

  // Check if user can make a new booking (doesn't have existing booking)
  const canMakeNewBooking = () => {
    return !bookingInfo.userHasBooking || getCurrentUserBookings().length === 0
  }

  // Booking functionality
  const handleBookVisit = () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', `/property/${id}`)
      navigate('/login')
      return
    }

    if (user?.role !== 'user') {
      alert('Only users can book property visits')
      return
    }

    setBookingDialogOpen(true)
    setBookingError('')
    setBookingSuccess(false)
    setIsEditMode(false)
    setEditingBookingId(null)
  }

  // Edit booking functionality
  const handleEditBooking = (booking) => {
    setIsEditMode(true)
    setEditingBookingId(booking.id || booking._id) // Handle both id formats
    setSelectedDate(dayjs(booking.date))
    setSelectedTimeSlot(booking.timeSlot)
    setBookingDialogOpen(true)
    setBookingError('')
    setBookingSuccess(false)
  }

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      setBookingError('Please select both date and time slot')
      return
    }

    // Check if slot is already booked by others (exclude current user's booking in edit mode)
    if (!isEditMode && isSlotBookedByOthers(selectedDate, selectedTimeSlot)) {
      setBookingError('This time slot is already booked by someone else. Please select another slot.')
      return
    }

    // In edit mode, check if the new slot conflicts with other bookings
    if (isEditMode && isSlotBookedByOthers(selectedDate, selectedTimeSlot)) {
      setBookingError('This time slot is already booked by someone else. Please select another slot.')
      return
    }

    // Validate session before making API call
    if (!(await validateSession())) {
      setBookingError('Session expired. Please login again.')
      return
    }

    setBookingLoading(true)
    setBookingError('')

    try {
      let response

      if (isEditMode) {
        // Update existing booking
        response = await fetch(buildApiUrl(API_CONFIG.USER.BOOKING_UPDATE.replace(':id', editingBookingId)), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            date: selectedDate.format('YYYY-MM-DD'),
            timeSlot: selectedTimeSlot
          })
        })
      } else {
        // Create new booking
        response = await fetch(buildApiUrl(API_CONFIG.USER.BOOKING_ADD), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            property: id,
            date: selectedDate.format('YYYY-MM-DD'),
            timeSlot: selectedTimeSlot
          })
        })
      }

      let data
      try {
        data = await response.json()
        validateApiResponse(data)
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }

      if (response.status === 401) {
        throw new Error('Session expired. Please login again.')
      }

      if (response.ok && data.success) {
        setBookingSuccess(true)
        setSelectedDate(null)
        setSelectedTimeSlot('')

        // Show success message and close dialog
        setTimeout(() => {
          setBookingDialogOpen(false)
          setBookingSuccess(false)
          setIsEditMode(false)
          setEditingBookingId(null)
          fetchPropertyDetails() // Refresh to get updated booking info
        }, 3000) // Show success message for 3 seconds
      } else {
        throw new Error(data.error || getErrorMessage(data))
      }
    } catch (err) {
      console.error('Booking error:', err)
      setBookingError(err.message || `Failed to ${isEditMode ? 'update' : 'book'} visit. Please try again.`)
    } finally {
      setBookingLoading(false)
    }
  }

  const handleBookingCancel = () => {
    setBookingDialogOpen(false)
    setSelectedDate(null)
    setSelectedTimeSlot('')
    setBookingError('')
    setBookingSuccess(false)
    setIsEditMode(false)
    setEditingBookingId(null)
  }

  // Handle return to home
  const handleReturnToHome = () => {
    navigate(`/properties?propertyType=${property?.propertyType}&title=${property?.title}`)
  }

  const getLocationString = (location) => {
    try {
      if (typeof location === 'string' && location.trim()) {
        return location
      }
      if (location && typeof location === 'object') {
        if (location.address && typeof location.address === 'string') return location.address
        if (location.street && typeof location.street === 'string') return location.street
        if (location.city && location.state) return `${location.city}, ${location.state}`
        return 'Location not specified'
      }
      return 'Location not specified'
    } catch (error) {
      return 'Location not specified'
    }
  }

  const formatCurrency = (amount) => {
    const num = parseInt(amount) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date not available'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="property-details-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner large"></div>
            <p>Initializing...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="property-details-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner large"></div>
            <p>Loading property details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="property-details-page">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Property</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={handleReturnToHome}>
                Back to Home
              </button>
              <button className="btn btn-secondary" onClick={fetchPropertyDetails}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="property-details-page">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">🏠</div>
            <h2>Property Not Found</h2>
            <p>The property you're looking for doesn't exist or has been removed.</p>
            <button className="btn btn-primary" onClick={handleReturnToHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const safeImages = getSafeImages(property.images)
  const safeAmenities = getSafeAmenities(property.amenities)
  const currentUserBookings = getCurrentUserBookings()


  function timeAgo(dateString) {
    const now = new Date();
    const created = new Date(dateString);
    const diff = Math.floor((now - created) / 1000); // in seconds

    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(diff / 86400);
    const weeks = Math.floor(diff / 604800);
    const months = Math.floor(diff / 2592000); // approx 30 days
    const years = Math.floor(diff / 31536000);

    if (years > 0) return years + (years === 1 ? " year ago" : " years ago");
    if (months > 0) return months + (months === 1 ? " month ago" : " months ago");
    if (weeks > 0) return weeks + (weeks === 1 ? " week ago" : " weeks ago");
    if (days > 0) return days + (days === 1 ? " day ago" : " days ago");
    if (hours > 0) return hours + (hours === 1 ? " hour ago" : " hours ago");
    if (minutes > 0) return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
    return "just now";
  }


  const WishlistButton = styled(IconButton)(({ theme, isWishlisted }) => ({
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: isWishlisted ? "#d32f2f" : "#666",
    zIndex: 1,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 1)",
      color: "#d32f2f",
      transform: "scale(1.1)",
    },
  }));



  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="property-details-page">
        <div className="container">
          {/* Navigation Buttons */}
          <div className="navigation-section">
            <div className="back-navigation">
              <button className="back-btn" onClick={() => navigate(-1)}>
                ← Back
              </button>
            </div>

            <div className="home-navigation">
              <button className="home-btn" onClick={handleReturnToHome}>
                🏠 Return to Home
              </button>
            </div>
          </div>

          {/* Property Header */}
          <div className="property-header">
            <div className="property-title-section">
              <h1 className="property-title">{property.title || 'Untitled Property'}</h1>
              
              <div className="property-location-wrapper">
                {isAuthenticated && subscription ? (
                  <p className="property-location">📍 {getLocationString(property.location)}</p>
                ) : (
                  <div className="blurred-location">
                    <p className="property-location blur-text">📍 {getLocationString(property.location)}</p>
                    <div className="lock-overlay">
                      <LockIcon fontSize="small" />
                      <span>Subscribe to view address</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="property-meta">
                <span className="property-type">{property.propertyType || 'Property'}</span>
                <span className="listed-date">Listed on {formatDate(property.createdAt)}</span>
              </div>
            </div>

            <div className="subscription-banner-wrapper" style={{ marginTop: '20px' }}>
              <SubscriptionBanner variant="compact" />
            </div>

            {/* WISHLIST BUTTON - Only show for users or non-authenticated */}
            {/* <div className="property-actions">
              {(user?.role === 'user' || !isAuthenticated) && (
                <button
                  className={`wishlist-btn large ${isInWishlist ? 'active' : ''} ${wishlistLoading ? 'loading' : ''}`}
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  title={
                    !isAuthenticated
                      ? 'Login to add to wishlist'
                      : isInWishlist
                        ? 'Remove from wishlist'
                        : 'Add to wishlist'
                  }
                >
                  {wishlistLoading ? (
                    <div className="loading-spinner small"></div>
                  ) : (
                    <>
                      <span className="wishlist-icon">
                        {isInWishlist ? '❤️' : '🤍'}
                      </span>
                      <span className="wishlist-text">
                        {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div> */}
          </div>

          {/* Current User's Bookings Display */}
          {isAuthenticated && bookingInfo.userHasBooking && currentUserBookings.length > 0 && (
            <div className="user-bookings-section">
              <Alert severity="info" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Your Scheduled Visit
                  </Typography>
                  {currentUserBookings.map((booking, index) => {
                    const statusConfig = getBookingStatusConfig(booking.status)
                    return (
                      <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<CalendarTodayIcon />}
                          label={`${dayjs(booking.date).format('MMM DD, YYYY')} at ${booking.timeSlot}`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                        />
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditBooking(booking)}
                          variant="outlined"
                          color="primary"
                        >
                          Edit
                        </Button>
                      </Box>
                    )
                  })}
                </Box>
              </Alert>
            </div>
          )}

          <div className="main-image">
            <div className="property-image-wrapper">
              <img
                src={safeImages[currentImageIndex]}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="property-image"
                onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
              />
              <IconButton
  onClick={() => setShareOpen(true)}
  size="small"
  sx={{
    position: "absolute",
    top: 8,
    right: 110,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#555",
    zIndex: 1,
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 1)",
      transform: "scale(1.1)",
    },
  }}
  title="Share Property"
>
  <ShareIcon />
</IconButton>



<IconButton
  onClick={handleBookVisit}
  size="small"
  sx={{
    position: "absolute",
    top: 8,
    right: 60, // adjust 48px so it doesn't overlap wishlist button
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#2F80ED",
    zIndex: 1,
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 1)",
      transform: "scale(1.1)",
    },
  }}
  title="Book a Visit"
>
  <CalendarTodayIcon />
</IconButton>

              {/* Wishlist Icon */}

              <WishlistButton
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                size="small"
              >
                {isInWishlist ? (
                  <Favorite sx={{ color: "#d32f2f" }} />
                ) : (
                  <FavoriteOutlined />
                )}
              </WishlistButton>
            </div>

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


          {/* Property Content */}
          <div className="property-content">
            <div className="property-main">
              {/* Property Specs */}
              <div className="property-specs">
                <div className="spec-item">
                  <span className="spec-number">{property.bedrooms || 0}</span>
                  <div>
                    <img src={bed} alt="bedrooms" />
                    <span className="spec-label mx-1">Bedrooms</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-number">{property.bathrooms || 0}</span>
                  <div>
                    <img src={bath} alt="bathrooms" />
                    <span className="spec-label mx-1">Bathrooms</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-number">{property.area || 0}</span>
                  <div>
                    <img src={areaImg} alt="area" />
                    <span className="spec-label mx-1">sq ft</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="description-section">
                <h3>Description</h3>
                <p>{property.description || 'No description provided'}</p>
              </div>

              {/* Amenities */}
              {safeAmenities.length > 0 && (
                <div className="amenities-section" style={{ color: '#2F80ED' }}>
                  <h3>Amenities</h3>
                  <div className="amenities-grid">
                    {safeAmenities.map(amenity => (
                      <div key={amenity} className="amenity-item">
                        <span className="amenity-icon">✓</span>
                        <span className="amenity-name">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="property-sidebar">
              {/* Pricing Card */}
              <div className="pricing-card">
                <div className="rent-info">
                  <div className="rent-amount">
                    <span className="rent-price">{formatCurrency(property.rent)}</span>
                    <span className="rent-period">/month</span>
                  </div>
                  <div className="deposit-amount">
                    Security Deposit: {formatCurrency(property.deposit)}
                  </div>
                </div>

                {/* Add another wishlist button in sidebar for easier access */}
                {(user?.role === 'user' || !isAuthenticated) && (
                  <button
                    className={`wishlist-sidebar-btn ${isInWishlist ? 'active' : ''} ${wishlistLoading ? 'loading' : ''}`}
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                  >
                    {wishlistLoading ? (
                      <>
                        <div className="loading-spinner small"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="wishlist-icon">
                          {isInWishlist ? '❤️' : '🤍'}
                        </span>
                        {isInWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
                      </>
                    )}
                  </button>
                )}

                {isAuthenticated ? (
                  <>
                    {subscription ? (
                      <button className="contact-btn" onClick={contactOwnerFn}>
                        📞 Contact Owner
                      </button>
                    ) : (
                      <button className="contact-btn locked" onClick={() => navigate('/subscription-plans')}>
                        <LockIcon fontSize="small" style={{ marginRight: '8px' }} />
                        Subscribe to Contact Owner
                      </button>
                    )}

                    {/* Book a Visit Button - Only show if user can make new booking */}
                    {/* {canMakeNewBooking() && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CalendarTodayIcon />}
                        onClick={handleBookVisit}
                        fullWidth
                        sx={{
                          mt: 1,
                          height: '48px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          textTransform: 'none'
                        }}
                      >
                        📅 Book a Visit
                      </Button>
                    )} */}
                  </>
                ) : (
                  <button className="login-btn" onClick={() => navigate('/login')}>
                    🔐 Login to Contact Owner
                  </button>
                )}
              </div>

              {/* Owner Info */}
              {unlockContact && (
                <div className="property-info-card owner-info-highlight">
                  <h3>OWNER INFORMATION</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">NAME: </span>
                      <span className="info-value">
                        {unlockContact.owner?.name || unlockContact.ownerContact?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">EMAIL:</span>
                      <span className="info-value">
                        {unlockContact.owner?.email || unlockContact.ownerContact?.email || 'N/A'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">PHONE:</span>
                      <span className="info-value">
                        {unlockContact.owner?.phone || unlockContact.ownerContact?.phone || 'N/A'}
                      </span>
                    </div>
                    {unlockContact.remainingContacts !== undefined && (
                      <div className="info-item highlight-credits">
                        <span className="info-label">CREDITS LEFT:</span>
                        <span className="info-value">{unlockContact.remainingContacts}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Property Info */}
              <div className="property-info-card">
                <h3>Property Information</h3>
                <div className="info-list">
                  <div className="info-item" key={property._id}>
                    <span className="info-label">ID:</span>
                    <span className="info-value">
                      {property._id || 'N/A'}

                      {/* {property.id !== undefined && property.id !== null ? property.id : 'N/A'} */}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{property.propertyType || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value status-available">🟢 Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Return to Home Section at the bottom */}
          <div className="return-section">
            <div className="return-content d-flex justify-content-between align-items-center">
              {/* <h3>Explore More Properties</h3>
              <p>Find more amazing properties that match your preferences</p>
              <button className="return-home-btn" onClick={handleReturnToHome}>
                🏠 Browse All Properties
              </button> */}
              <h3>Similar Properties</h3>
              <button className="return-home-btn" onClick={handleReturnToHome} style={{ maxWidth: "150px", fontSize: "12px", maxHeight: "35px" }}>
                Show more
              </button>
            </div>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: 3,
                mb: 4,
                mt: 4,
                '@media (max-width: 768px)': {
                  gridTemplateColumns: '1fr',
                  gap: 2,
                },
              }}
            >
              {similarProperties?.map((item, index) =>
                index < 3 &&
                (
                  <div className='my-3 mb-md-4'>
                    <div style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", maxWidth: "325px" }}
                      className='rounded-2 my-2 py-2 px-3 d-flex justify-content-between align-items-center'>
                      <img src={trueOwnersLogo} alt='truowners' width={110} />
                      <span> {timeAgo(item?.createdAt)}</span>
                    </div>
                    <div>
                      <PropertyCard
                        key={item.id}
                        property={item}
                        // isInWishlist={wishlist.includes(property.id)}
                        onWishlistToggle={() => handleWishlistToggle(item.id)}
                        onClick={() => handlePropertyClick(item)}
                        // onLoginRequired={handleLoginRequired}
                        isAuthenticated={isAuthenticated}
                      /></div>
                  </div>
                )
              )}
            </Box>
          </div>
        </div>

        {/* Booking Dialog */}
        <Dialog
          open={bookingDialogOpen}
          onClose={handleBookingCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              {isEditMode ? <EditIcon color="primary" /> : <CalendarTodayIcon color="primary" />}
              <Typography variant="h6">
                {isEditMode ? 'Edit Your Visit' : 'Book a Visit'}
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent>
            {bookingSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {isEditMode ? 'Visit Updated Successfully!' : 'Visit Booked Successfully!'}
                </Typography>
                <Typography variant="body2">
                  Our team will confirm your booking shortly. You will receive a notification once confirmed.
                </Typography>
              </Alert>
            ) : (
              <>
                {bookingError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {bookingError}
                  </Alert>
                )}

                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {isEditMode
                    ? 'Update your preferred date and time for the property visit.'
                    : 'Select your preferred date and time to visit this property.'
                  }
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={(newValue) => {
                      setSelectedDate(newValue)
                      if (!isEditMode) {
                        setSelectedTimeSlot('') // Reset time slot when date changes (not in edit mode)
                      }
                    }}
                    minDate={dayjs()}
                    maxDate={dayjs().add(30, 'day')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined"
                      }
                    }}
                  />
                </Box>

                <TextField
                  select
                  label="Select Time Slot"
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  fullWidth
                  variant="outlined"
                  disabled={!selectedDate}
                  helperText={!selectedDate ? "Please select a date first" : ""}
                >
                  {getAvailableTimeSlots().map((slot) => (
                    <MenuItem
                      key={slot.value}
                      value={slot.value}
                      disabled={slot.isBookedByOthers}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography>{slot.label}</Typography>
                        {slot.isBookedByCurrentUser ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Your current booking"
                            color="info"
                            size="small"
                          />
                        ) : slot.isBookedByOthers ? (
                          <Chip
                            icon={<BlockIcon />}
                            label="Booked"
                            color="error"
                            size="small"
                          />
                        ) : null}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
          </DialogContent>

          {!bookingSuccess && (
            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={handleBookingCancel}
                color="inherit"
                disabled={bookingLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookingSubmit}
                variant="contained"
                color="primary"
                disabled={bookingLoading || !selectedDate || !selectedTimeSlot}
                startIcon={bookingLoading ? <CircularProgress size={20} /> : null}
              >
                {bookingLoading ? (isEditMode ? 'Updating...' : 'Booking...') : (isEditMode ? 'Update Visit' : 'Book Visit')}
              </Button>
            </DialogActions>
          )}
        </Dialog>
        <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
  <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="h6" color="primary">
      Share property
    </Typography>
    <IconButton onClick={() => setShareOpen(false)}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent>
    <Typography variant="body2" sx={{ mb: 2 }}>
      Share this property with your friends and family
    </Typography>

    {/* Social Media Icons */}
    <Box sx={{ display: "flex", justifyContent: "space-around", mb: 3 }}>
  <Box
    textAlign="center"
    sx={{ cursor: "pointer" }}
    onClick={() => window.open(`https://wa.me/?text=${shareUrl}`, "_blank")}
  >
    <WhatsAppIcon sx={{ fontSize: 36, color: "#25D366" }} />
    <Typography variant="caption" display="block">
      WhatsApp
    </Typography>
  </Box>
      
  <Box
    textAlign="center"
    sx={{ cursor: "pointer" }}
    onClick={() => window.open(`mailto:?subject=Check this property&body=${shareUrl}`)}
  >
    <EmailIcon sx={{ fontSize: 36, color: "#0072c6" }} />
    <Typography variant="caption" display="block">
      Email
    </Typography>
  </Box>
      
  <Box
    textAlign="center"
    sx={{ cursor: "pointer" }}
    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, "_blank")}
  >
    <FacebookIcon sx={{ fontSize: 36, color: "#1877F2" }} />
    <Typography variant="caption" display="block">
      Facebook
    </Typography>
  </Box>
       <Box
    textAlign="center"
    sx={{ cursor: "pointer" }}
    onClick={() => window.open(`https://t.me/share/url?url=${shareUrl}`, "_blank")}
  >
    <TelegramIcon sx={{ fontSize: 36, color: "#0088cc" }} />
    <Typography variant="caption" display="block">
      Telegram
    </Typography>
  </Box>
    </Box>

    {/* Copy Link */}
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <TextField
        fullWidth
        size="small"
        value={shareUrl}
        InputProps={{ readOnly: true }}
      />
      <Button
        onClick={handleCopy}
        variant="contained"
        color="success"
        sx={{ ml: 1 }}
      >
        Copy
      </Button>
    </Box>
  </DialogContent>
</Dialog>

      </div>
    </LocalizationProvider>
  )
}

export default PropertyDetailsPage
