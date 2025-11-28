import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import SignUp from '../../pages/Auth/SignUp'
import OwnerSignUp from '../../pages/Auth/OwnerSignUp'
import Login from '../../pages/Auth/Login'
import AddProperty from '../../pages/Owner/AddProperty'
import PropertySuccessModal from '../../pages/Owner/PropertySuccessModal'
import defaultProfilePic from '../../../assets/images/defaultProfile.png'
import { Link } from 'react-router-dom'
import './Header.css'
import logoimage from "../../../assets/images/logoimage.jpg"
import EditProfile from '../../pages/Profile/EditProfile'
import UserEditProfile from '../../pages/Profile/UserEditProfile'




import {
  Button,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  Box,
  Divider,
  Badge,
  Chip
} from '@mui/material'
import {
  Menu as MenuIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Favorite as FavoriteIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  BookOnline as BookingIcon,
  Event as EventIcon,
  CardMembership as CardMembershipIcon
} from '@mui/icons-material'

const Header = () => {

const [showEditProfile, setShowEditProfile] = useState(false)


const handleEditProfileClick = () => {
  setShowEditProfile(true)
  handleUserMenuClose()
}

const handleSaveProfile = (updatedData) => {
  console.log("Profile Updated:", updatedData)
  // TODO: call API to save changes
  setShowEditProfile(false)
}

const [showUserEditProfile, setShowUserEditProfile] = useState(false)


  
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [showOwnerSignUp, setShowOwnerSignUp] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [showPropertySuccess, setShowPropertySuccess] = useState(false)
  const [successProperty, setSuccessProperty] = useState(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [bookingsCount, setBookingsCount] = useState(0)
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0)
  const { user, isAuthenticated, logout, token } = useAuth()

  // MUI Menu anchor states
  const [infoMenuAnchor, setInfoMenuAnchor] = useState(null)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)

  const isInfoMenuOpen = Boolean(infoMenuAnchor)
  const isUserMenuOpen = Boolean(userMenuAnchor)

  // MUI Menu handlers
  const handleInfoMenuClick = (event) => {
    setInfoMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClick = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleInfoMenuClose = () => {
    setInfoMenuAnchor(null)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Handle Sign Up modal
  const handleSignUpClick = () => {
    setShowSignUp(true)
    setIsMobileMenuOpen(false)
  }

  // Handle Owner Sign Up modal
  const handleOwnerSignUpClick = () => {
    setShowOwnerSignUp(true)
    setIsMobileMenuOpen(false)
  }

  // Handle Login modal
  const handleLoginClick = () => {
    setShowLogin(true)
    setIsMobileMenuOpen(false)
  }

  // Handle Add Property modal
  const handleAddPropertyClick = () => {
    setShowAddProperty(true)
    handleUserMenuClose()
    setIsMobileMenuOpen(false)
  }

  // Handle Wishlist click
  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      setShowLogin(true)
      return
    }

    if (user?.role === 'user') {
      navigate('/wishlist')
      handleUserMenuClose()
    }
  }

  // Handle My Bookings click
  const handleMyBookingsClick = () => {
    if (!isAuthenticated) {
      setShowLogin(true)
      return
    }

    if (user?.role === 'user') {
      navigate('/my-bookings')
      handleUserMenuClose()
    }
  }

  // Handle navigation clicks (close dropdowns)
  const handleNavigation = (path) => {
    navigate(path)
    handleInfoMenuClose()
    handleUserMenuClose()
    setIsMobileMenuOpen(false)
  }

  // Fetch wishlist count
  const fetchWishlistCount = async () => {
    if (!isAuthenticated || !token || user?.role !== 'user') return

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.USER.WISHLIST), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        validateApiResponse(data)
        
        if (data.success && data.data.wishlist) {
          const properties = data.data.wishlist.properties || []
          setWishlistCount(properties.length)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.warn('Failed to fetch wishlist count:', handleApiError(null, response))
      }
    } catch (err) {
      console.warn('Failed to fetch wishlist count:', handleApiError(err))
    }
  }

  // Fetch bookings count
  const fetchBookingsCount = async () => {
    if (!isAuthenticated || !token || user?.role !== 'user') return

    try {
      const response = await fetch(buildApiUrl('/booking'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        validateApiResponse(data)
        
        if (data.success && data.data) {
          const totalBookings = data.data.totalBookings || 0
          const bookings = data.data.bookings || []
          
          // Count pending bookings
          const pendingCount = bookings.filter(booking => booking.status === 'pending').length
          
          setBookingsCount(totalBookings)
          setPendingBookingsCount(pendingCount)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.warn('Failed to fetch bookings count:', handleApiError(null, response))
      }
    } catch (err) {
      console.warn('Failed to fetch bookings count:', handleApiError(err))
    }
  }

  // Close all modals
  const handleCloseModals = () => {
    setShowSignUp(false)
    setShowOwnerSignUp(false)
    setShowLogin(false)
    setShowAddProperty(false)
    setShowPropertySuccess(false)
  }

  // Switch from SignUp to Login
  const handleSwitchToLogin = () => {
    setShowSignUp(false)
    setShowOwnerSignUp(false)
    setShowLogin(true)
  }

  // Switch from Login to SignUp
  const handleSwitchToSignUp = () => {
    setShowLogin(false)
    setShowSignUp(true)
  }

  // Handle user logout
  const handleLogout = () => {
    logout()
    handleUserMenuClose()
    setIsMobileMenuOpen(false)
    setWishlistCount(0)
    setBookingsCount(0)
    setPendingBookingsCount(0)
  }

  // Handle successful property addition
  const handlePropertySuccess = (property) => {
    setSuccessProperty(property.property)
    setShowAddProperty(false)
    setShowPropertySuccess(true)
  }

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Fetch counts when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      fetchWishlistCount()
      fetchBookingsCount()
    }
  }, [isAuthenticated, user, token])

  // Track auth state changes
  useEffect(() => {
    console.log('🏠 Header: Auth state changed')
    console.log('  - User:', user)
    console.log('  - isAuthenticated:', isAuthenticated)
  }, [user, isAuthenticated])

  const isOwner = user?.role === 'owner'
  const isUser = user?.role === 'user'

  console.log('🏠 Header: Rendering with:', {
    isAuthenticated,
    userExists: !!user,
    userRole: user?.role,
    isOwner,
    isUser
  })

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            {/* Logo/App Name */}
            <div className="header-logo">
              <Link to="/" className="app-name-link">
                <img src={logoimage} className='logo-image' style={{ width: "275px", height: "auto" }} />
              </Link>
            </div>

            {/* Navigation - Desktop */}
            <nav className="header-nav desktop-nav">
              <div className="nav-buttons">

                {/* Info Dropdown - Desktop with MUI */}
                {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    id="info-menu-button"
                    aria-controls={isInfoMenuOpen ? 'info-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={isInfoMenuOpen ? 'true' : undefined}
                    onClick={handleInfoMenuClick}
                    startIcon={<MenuIcon />}
                    endIcon={isInfoMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{
                      color: '#333',
                      textTransform: 'none',
                      fontSize: '16px',
                      fontWeight: 500,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    Menu
                  </Button>
                  <Menu
                    id="info-menu"
                    anchorEl={infoMenuAnchor}
                    open={isInfoMenuOpen}
                    onClose={handleInfoMenuClose}
                    MenuListProps={{
                      'aria-labelledby': 'info-menu-button',
                    }}
                    sx={{
                      '& .MuiPaper-root': {
                        minWidth: '180px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0'
                      }
                    }}
                  >
                    <MenuItem 
                      onClick={() => handleNavigation('/about')}
                      sx={{ 
                        padding: '12px 20px',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <InfoIcon sx={{ mr: 2, fontSize: 20 }} />
                      <Typography variant="body2">About</Typography>
                    </MenuItem>
                    <MenuItem 
                      onClick={() => handleNavigation('/contact')}
                      sx={{ 
                        padding: '12px 20px',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <BusinessIcon sx={{ mr: 2, fontSize: 20 }} />
                      <Typography variant="body2">Contact</Typography>
                    </MenuItem>
                  </Menu>
                </Box> */}

                 <Button 
                  onClick={() => handleNavigation('/about')}
                  sx={{
                    color: '#333',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 500,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  About
                </Button>

                <Button 
                  onClick={() => handleNavigation('/contact')}
                  sx={{
                    color: '#333',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 500,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  Contact
                </Button>



                {isAuthenticated ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Wishlist Button - Only for users */}
                    {isUser && (
                      <Button
                        onClick={handleWishlistClick}
                        startIcon={<FavoriteIcon />}
                        sx={{
                          color: '#e91e63',
                          textTransform: 'none',
                          fontSize: '14px',
                          fontWeight: 500,
                          padding: '8px 16px',
                          borderRadius: '8px',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: '#fce4ec'
                          }
                        }}
                      >
                        Wishlist
                        {wishlistCount > 0 && (
                          <Chip
                            label={wishlistCount}
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: '12px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        )}
                      </Button>
                    )}

                    {/* My Bookings Button - Only for users */}
                    {isUser && (
                      <Button
                        onClick={handleMyBookingsClick}
                        startIcon={<BookingIcon />}
                        sx={{
                          color: '#2196f3',
                          textTransform: 'none',
                          fontSize: '14px',
                          fontWeight: 500,
                          padding: '8px 16px',
                          borderRadius: '8px',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: '#e3f2fd'
                          }
                        }}
                      >
                        My Bookings
                        {pendingBookingsCount > 0 && (
                          <Chip
                            label={pendingBookingsCount}
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: '12px',
                              backgroundColor: '#ff9800',
                              color: 'white',
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        )}
                      </Button>
                    )}

                    {/* User Menu with MUI */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        id="user-menu-button"
                        aria-controls={isUserMenuOpen ? 'user-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={isUserMenuOpen ? 'true' : undefined}
                        onClick={handleUserMenuClick}
                        startIcon={
                          <img 
                            src={defaultProfilePic} 
                            alt="User Icon" 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }} 
                          />
                        }
                        endIcon={isUserMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{
                          color: '#333',
                          textTransform: 'none',
                          fontSize: '14px',
                          fontWeight: 500,
                          padding: '8px 16px',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: '#f5f5f5'
                          }
                        }}
                      >
                        {user?.name}
                      </Button>


                      <Menu
                        id="user-menu"
                        anchorEl={userMenuAnchor}
                        open={isUserMenuOpen}
                        onClose={handleUserMenuClose}
                        MenuListProps={{
                          'aria-labelledby': 'user-menu-button',
                        }}
                        sx={{
                          '& .MuiPaper-root': {
                            minWidth: '280px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            border: '1px solid #e0e0e0'
                          }
                        }}
                      >
                        <Box sx={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {user?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {user?.email}
                          </Typography>
                          <Chip
                            label={user?.role}
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ 
                              textTransform: 'capitalize',
                              fontSize: '11px',
                              height: 24
                            }}
                          />
                        </Box>

                        {/* Menu Items */}
                      {/* {isUser && (
                          <>
                            <MenuItem 
                              onClick={handleWishlistClick}
                              sx={{ 
                                padding: '12px 20px',
                                '&:hover': { backgroundColor: '#f5f5f5' }
                              }}
                            >
                              <FavoriteIcon sx={{ mr: 2, fontSize: 20, color: '#e91e63' }} />
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant="body2">My Wishlist</Typography>
                                {wishlistCount > 0 && (
                                  <Chip
                                    label={wishlistCount}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '11px',
                                      backgroundColor: '#f44336',
                                      color: 'white',
                                      '& .MuiChip-label': { px: 0.5 }
                                    }}
                                  />
                                )}
                              </Box>
                            </MenuItem>
                            
                            <MenuItem 
                              onClick={handleMyBookingsClick}
                              sx={{ 
                                padding: '12px 20px',
                                '&:hover': { backgroundColor: '#f5f5f5' }
                              }}
                            >
                              <EventIcon sx={{ mr: 2, fontSize: 20, color: '#2196f3' }} />
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant="body2">My Bookings</Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {bookingsCount > 0 && (
                                    <Chip
                                      label={bookingsCount}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '11px',
                                        backgroundColor: '#2196f3',
                                        color: 'white',
                                        '& .MuiChip-label': { px: 0.5 }
                                      }}
                                    />
                                  )}
                                  {pendingBookingsCount > 0 && (
                                    <Chip
                                      label={`${pendingBookingsCount} pending`}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '11px',
                                        backgroundColor: '#ff9800',
                                        color: 'white',
                                        '& .MuiChip-label': { px: 0.5 }
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </MenuItem>
                          </>
                        )}  */}


{isUser && (
  <>
    <MenuItem
      onClick={() => { setShowUserEditProfile(true); handleUserMenuClose(); }}
      sx={{ padding: '12px 20px', '&:hover': { backgroundColor: '#f5f5f5' } }}
    >
      <PersonIcon sx={{ mr: 2, fontSize: 20, color: '#1976d2' }} />
      <Typography variant="body2">Edit Profile</Typography>
    </MenuItem>
 <MenuItem 
                              onClick={handleWishlistClick}
                              sx={{ 
                                padding: '12px 20px',
                                '&:hover': { backgroundColor: '#f5f5f5' }
                              }}
                            >
                              <FavoriteIcon sx={{ mr: 2, fontSize: 20, color: '#e91e63' }} />
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant="body2">My Wishlist</Typography>
                                {wishlistCount > 0 && (
                                  <Chip
                                    label={wishlistCount}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '11px',
                                      backgroundColor: '#f44336',
                                      color: 'white',
                                      '& .MuiChip-label': { px: 0.5 }
                                    }}
                                  />
                                )}
                              </Box>
                            </MenuItem>
                            
                            <MenuItem 
                              onClick={handleMyBookingsClick}
                              sx={{ 
                                padding: '12px 20px',
                                '&:hover': { backgroundColor: '#f5f5f5' }
                              }}
                            >
                              <EventIcon sx={{ mr: 2, fontSize: 20, color: '#2196f3' }} />
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant="body2">My Bookings</Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {bookingsCount > 0 && (
                                    <Chip
                                      label={bookingsCount}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '11px',
                                        backgroundColor: '#2196f3',
                                        color: 'white',
                                        '& .MuiChip-label': { px: 0.5 }
                                      }}
                                    />
                                  )}
                                  {pendingBookingsCount > 0 && (
                                    <Chip
                                      label={`${pendingBookingsCount} pending`}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '11px',
                                        backgroundColor: '#ff9800',
                                        color: 'white',
                                        '& .MuiChip-label': { px: 0.5 }
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </MenuItem>
  </>
)}
{isUser && (
  <MenuItem
    onClick={() => { navigate('/subscription-plans'); handleUserMenuClose(); }}
    sx={{ padding: '12px 20px', '&:hover': { backgroundColor: '#f5f5f5' } }}
  >
    <BusinessIcon sx={{ mr: 2, fontSize: 20, color: '#9c27b0' }} />
    <Typography variant="body2">Subscription Plans</Typography>
  </MenuItem>
)}

{isUser && (
  <MenuItem
    onClick={() => { navigate('/my-subscription'); handleUserMenuClose(); }}
    sx={{ padding: '12px 20px', '&:hover': { backgroundColor: '#f5f5f5' } }}
  >
    <CardMembershipIcon sx={{ mr: 2, fontSize: 20, color: '#ff9800' }} />
    <Typography variant="body2">My Subscription</Typography>
  </MenuItem>
)}



                        
                        {/* {isOwner && (
                          <MenuItem 
                            onClick={handleAddPropertyClick}
                            sx={{ 
                              padding: '12px 20px',
                              '&:hover': { backgroundColor: '#f5f5f5' }
                            }}
                          >
                            <AddIcon sx={{ mr: 2, fontSize: 20, color: '#4caf50' }} />
                            <Typography variant="body2">Add Property</Typography>
                          </MenuItem>
                        )} */}


                        {isOwner && (
  <>
    <MenuItem
      onClick={() => { setShowEditProfile(true); handleUserMenuClose(); }}
      sx={{ padding: '12px 20px', '&:hover': { backgroundColor: '#f5f5f5' } }}
    >
      <PersonIcon sx={{ mr: 2, fontSize: 20, color: '#1976d2' }} />
      <Typography variant="body2">Edit Profile</Typography>
    </MenuItem>

    <MenuItem
      onClick={handleAddPropertyClick}
      sx={{ padding: '12px 20px', '&:hover': { backgroundColor: '#f5f5f5' } }}
    >
      <AddIcon sx={{ mr: 2, fontSize: 20, color: '#4caf50' }} />
      <Typography variant="body2">Add Property</Typography>
    </MenuItem>
  </>
)}

                        
                        <Divider />
                        
                        <MenuItem 
                          onClick={handleLogout}
                          sx={{ 
                            padding: '12px 20px',
                            color: '#f44336',
                            '&:hover': { backgroundColor: '#ffebee' }
                          }}
                        >
                          <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                          <Typography variant="body2">Logout</Typography>
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleSignUpClick}
                      sx={{
                        border : '1px solid #000 !important',
                        color: '#000',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontWeight: 500
                      }}
                    >
                      Sign Up
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleLoginClick}
                      sx={{
                          backgroundColor:'#4F4F4F !important',
                        color: '#fff',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontWeight: 500
                      }}
                    >
                      Login
                    </Button>
                  </Box>
                )}

                {/* Only show "For Property Owners" button when user is NOT logged in */}
                {!isAuthenticated && (
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleOwnerSignUpClick}
                    sx={{  
                       backgroundColor:' #333333 !important',
                        color: '#fff',
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontWeight: 500,
                      ml: 1
                    }}
                  >
                    For Property Owners
                  </Button>
                )}
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <IconButton
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              sx={{
                display: { xs: 'block', md: 'none' },
                color: '#333'
              }}
            >
              <MenuIcon />
            </IconButton>
          </div>

          {/* Mobile Navigation */}
          <nav className={`header-nav mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
            <div className="mobile-nav-buttons">
              {isAuthenticated ? (
                <>
                  <div className="mobile-user-info">
                    <div className="mobile-user-avatar">
                      {getInitials(user?.name)}
                    </div>
                    <div className="mobile-user-details">
                      <p className="mobile-user-name">{user?.name}</p>
                      <p className="mobile-user-email">{user?.email}</p>
                      <p className="mobile-user-role">({user?.role})</p>
                    </div>
                  </div>

                  {isUser && (
                    <>
                      <button
                        className="btn btn-secondary btn-mobile"
                        onClick={handleWishlistClick}
                      >
                        ❤️ Wishlist ({wishlistCount})
                      </button>
                      <button
                        className="btn btn-secondary btn-mobile"
                        onClick={handleMyBookingsClick}
                      >
                        📅 My Bookings ({bookingsCount})
                        {pendingBookingsCount > 0 && (
                          <span style={{
                            marginLeft: '8px',
                            backgroundColor: '#ff9800',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '12px'
                          }}>
                            {pendingBookingsCount} pending
                          </span>
                        )}
                      </button>
                      <button className="btn btn-secondary btn-mobile">
                        Profile
                      </button>
                    </>
                  )}

                  {isOwner && (
                    <button
                      className="btn btn-secondary btn-mobile"
                      onClick={handleAddPropertyClick}
                    >
                      Add Property
                    </button>
                  )}

                  <button className="btn btn-danger btn-mobile" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn color-change btn-mobile"
                    onClick={handleSignUpClick}
                  >
                    Sign Up
                  </button>
                  <button
                    className="btn color-change1 btn-mobile"
                    onClick={handleLoginClick}
                  >
                    Login
                  </button>
                  <button className="btn color-change2 btn-mobile" onClick={handleOwnerSignUpClick}>
                    For Property Owners
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Auth Modals */}
      {showSignUp && (
        <SignUp
          onClose={handleCloseModals}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}

      {showOwnerSignUp && (
        <OwnerSignUp
          onClose={handleCloseModals}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}

      {showLogin && (
        <Login
          onClose={handleCloseModals}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
      )}

      {/* Owner Modals */}
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


{showEditProfile && (
  <EditProfile
    user={user}
    onClose={() => setShowEditProfile(false)}
    onSave={handleSaveProfile}
  />
)}

{showUserEditProfile && (
  <UserEditProfile
    user={user}
    onClose={() => setShowUserEditProfile(false)}
    onSave={(updatedData) => {
      console.log("User profile updated:", updatedData)
      // TODO: call your API here
      setShowUserEditProfile(false)
    }}
  />
)}



    </>
  )
}

export default Header