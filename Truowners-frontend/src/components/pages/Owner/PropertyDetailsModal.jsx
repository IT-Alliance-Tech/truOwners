import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Card,
  CardMedia,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Backdrop,
  Badge
} from '@mui/material'
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Bed as BedIcon,
  Bathtub as BathtubIcon,
  Square as SquareIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  FullscreenExit as FullscreenExitIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material'
import { useAuth } from '../../../context/AuthContext'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import EditProperty from './EditProperty'
import PropertySuccessModal from './PropertySuccessModal'

const PropertyDetailsModal = ({ property, onClose, onUpdate, onSuccessAction }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showPropertySuccess, setShowPropertySuccess] = useState(false)
  const [successProperty, setSuccessProperty] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { token } = useAuth()

  const handleCloseModals = () => {
    setShowPropertySuccess(false)
    onClose()
  }

  const handleEditSuccess = (updatedProperty) => {
    onUpdate && onUpdate()
    setShowEdit(false)
    onClose()
    onSuccessAction && onSuccessAction(updatedProperty, 'edit')
  }

  const handleDelete = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.OWNER.PROPERTIES)}/${property.id}`, {
        method: 'DELETE',
        headers: {
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
        onUpdate && onUpdate()
        setSuccessProperty({ title: property.title, message: 'Property deleted successfully!' })
        setShowPropertySuccess(true)
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Delete property error:', err)
      setError(err.message || 'Failed to delete property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Image slider handlers
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    )
  }

  const handleImageSelect = (index) => {
    setCurrentImageIndex(index)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Updated to handle the exact 4 status values
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: 'warning',
        text: 'Under Review',
        icon: <ScheduleIcon fontSize="small" />,
        sx: {
          backgroundColor: '#fff3cd',
          color: '#856404',
          '& .MuiChip-icon': { color: '#856404' }
        }
      },
      approved: {
        color: 'success',
        text: 'Approved',
        icon: <CheckCircleIcon fontSize="small" />,
        sx: {
          backgroundColor: '#d4edda',
          color: '#155724',
          '& .MuiChip-icon': { color: '#155724' }
        }
      },
      rejected: {
        color: 'error',
        text: 'Rejected',
        icon: <CancelIcon fontSize="small" />,
        sx: {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          '& .MuiChip-icon': { color: '#721c24' }
        }
      },
      published: {
        color: 'success',
        text: 'Live',
        icon: <VisibilityIcon fontSize="small" />,
        sx: {
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          '& .MuiChip-icon': { color: '#0c5460' }
        }
      }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <Chip
        icon={config.icon}
        label={config.text}
        size="small"
        sx={{
          fontWeight: 600,
          ...config.sx,
          '& .MuiChip-icon': {
            marginLeft: '4px',
            ...config.sx['& .MuiChip-icon']
          }
        }}
      />
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getLocationString = (location) => {
    if (typeof location === 'string') {
      return location
    }
    if (location && typeof location === 'object') {
      // Handle the API format: { address, city, state, country }
      if (location.address && location.city && location.state) {
        return `${location.address}, ${location.city}, ${location.state}`
      }
      if (location.address) return location.address
      if (location.city && location.state) {
        return `${location.city}, ${location.state}${location.country ? `, ${location.country}` : ''}`
      }
      if (location.street) return location.street
      if (location.coordinates && (location.coordinates.lat || location.coordinates.lng)) {
        return `Coordinates: ${location.coordinates.lat || 'N/A'}, ${location.coordinates.lng || 'N/A'}`
      }
      return 'Location not specified'
    }
    return 'Location not specified'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Updated status descriptions for the exact 4 statuses
  const getStatusDescription = (status) => {
    const descriptions = {
      pending: 'Your property is currently under review by our team. This typically takes 24-48 hours. You will be notified once the review is complete.',
      approved: 'Your property has been approved by our team. You can now publish it to make it visible to potential tenants.',
      rejected: 'Your property submission has been rejected. Please review the feedback and make necessary changes before resubmitting. Contact support if you need assistance.',
      published: 'Your property is live and visible to potential tenants on our platform. Tenants can now view and inquire about your property.'
    }
    return descriptions[status] || 'Status information not available.'
  }

  // Get additional status info for better UX
  const getStatusInfo = (status) => {
    const statusInfo = {
      pending: {
        severity: 'info',
        nextSteps: 'Your property is being reviewed. Please wait for approval or feedback.'
      },
      approved: {
        severity: 'success',
        nextSteps: 'Your property is approved! You can publish it to make it live.'
      },
      rejected: {
        severity: 'error',
        nextSteps: 'Please review feedback and edit your property to address the issues.'
      },
      published: {
        severity: 'success',
        nextSteps: 'Your property is live! Monitor inquiries and manage bookings.'
      }
    }
    return statusInfo[status] || statusInfo.pending
  }

  // Image Slider Component
  const ImageSlider = () => {
    if (!property.images || property.images.length === 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Property Images
          </Typography>
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.100' }}>
            <Typography color="text.secondary">No images available</Typography>
          </Paper>
        </Box>
      )
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Property Images
          </Typography>
          <Badge badgeContent={property.images.length} color="primary">
            <Typography variant="body2" color="text.secondary">
              {currentImageIndex + 1} of {property.images.length}
            </Typography>
          </Badge>
        </Box>

        {/* Main Image Display */}
        <Card sx={{ position: 'relative', mb: 2 }}>
          <CardMedia
            component="img"
            height={400}
            image={property.images[currentImageIndex]}
            alt={`${property.title} - Image ${currentImageIndex + 1}`}
            sx={{
              objectFit: 'cover',
              cursor: 'pointer', height: '300px'
            }}
            onClick={toggleFullscreen}
            onError={(e) => {
              e.target.src = '/placeholder-property.jpg'
            }}
          />

          {/* Navigation Arrows */}
          {property.images.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </>
          )}

          {/* Fullscreen Toggle */}
          <IconButton
            onClick={toggleFullscreen}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              }
            }}
          >
            <FullscreenIcon />
          </IconButton>

          {/* Image Counter */}
          {property.images.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              {currentImageIndex + 1} / {property.images.length}
            </Box>
          )}
        </Card>

        {/* Thumbnail Navigation */}
        {/* {property.images.length > 1 && (
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
            {property.images.map((image, index) => (
              <Card
                key={index}
                onClick={() => handleImageSelect(index)}
                sx={{
                  minWidth: 80,
                  height: 60,
                  cursor: 'pointer',
                  border: currentImageIndex === index ? 2 : 1,
                  borderColor: currentImageIndex === index ? 'primary.main' : 'grey.300',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CardMedia
                  component="img"
                  height={60}
                  image={image}
                  alt={`Thumbnail ${index + 1}`}
                  sx={{ objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = '/placeholder-property.jpg'
                  }}
                />
              </Card>
            ))}
          </Stack>
        )} */}
      </Box>
    )
  }

  return (
    <>
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {property.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusBadge(property.status)}
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Property Images Slider */}
          <ImageSlider />

          {/* Property Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Property Information
            </Typography>
            <Grid container spacing={3}>


              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Property ID
                  </Typography>
                 <Typography variant="h6" sx={{fontSize:'12px'}}>
                    {(property.id)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {getLocationString(property.location)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Property Type
                  </Typography>
                  <Chip
                    label={property.propertyType?.charAt(0).toUpperCase() + property.propertyType?.slice(1)}
                    variant="outlined"
                  />
                </Paper>
              </Grid>

              {/* <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Property Type
                  </Typography>
                  <Chip 
                    label={property.propertyType?.charAt(0).toUpperCase() + property.propertyType?.slice(1)} 
                    variant="outlined" 
                  />
                </Paper>
              </Grid> */}

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Monthly Rent
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={600}>
                    {formatCurrency(property.rent)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Security Deposit
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(property.deposit)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <BedIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Bedrooms
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {property.bedrooms} Bed{property.bedrooms > 1 ? 's' : ''}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <BathtubIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Bathrooms
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {property.bathrooms} Bath{property.bathrooms > 1 ? 's' : ''}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <SquareIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Area
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {property.area} sq ft
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {formatDate(property.createdAt)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1">
                {property.description}
              </Typography>
            </Paper>
          </Box>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom  sx={{color:'#2F80ED'}} >
                Amenities
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {property.amenities.map(amenity => (
                  <Chip
                    key={amenity}
                    label={amenity}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Status Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status Information
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {getStatusBadge(property.status)}
              </Box>
              <Alert severity={getStatusInfo(property.status).severity} sx={{ mb: 1 }}>
                {getStatusDescription(property.status)}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Next steps: {getStatusInfo(property.status).nextSteps}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setShowEdit(true)}
          >
            Edit Property
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
          >
            Delete Property
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Image Modal */}
      <Dialog
        open={isFullscreen}
        onClose={toggleFullscreen}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '95vw',
            maxHeight: '95vh',
            bgcolor: 'black'
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'black',
            minHeight: '80vh'
          }}
        >
          <IconButton
            onClick={toggleFullscreen}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              }
            }}
          >
            <FullscreenExitIcon />
          </IconButton>

          <img
            src={property.images?.[currentImageIndex]}
            alt={`${property.title} - Full view`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.src = '/placeholder-property.jpg'
            }}
          />

          {/* Navigation in fullscreen */}
          {property.images?.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: 'absolute',
                  left: 16,
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'absolute',
                  right: 16,
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Dialog>

      {/* Edit Property Modal */}
      {showEdit && (
        <EditProperty
          property={property}
          onClose={() => setShowEdit(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Delete Property?</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{property.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Modal */}
      {showPropertySuccess && (
        <Backdrop open={showPropertySuccess} onClick={handleCloseModals}>
          <Box onClick={(e) => e.stopPropagation()}>
            <PropertySuccessModal
              onClose={handleCloseModals}
              property={successProperty}
            />
          </Box>
        </Backdrop>
      )}
    </>
  )
}

export default PropertyDetailsModal