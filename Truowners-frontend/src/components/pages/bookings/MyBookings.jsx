// src/components/Bookings/MyBookings.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { buildApiUrl } from '../../../config/api'
import { handleApiError, validateApiResponse } from '../../../utils/errorHandler'
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Avatar
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import ScheduleIcon from '@mui/icons-material/Schedule'
import PlaceIcon from '@mui/icons-material/Place'
import HomeIcon from '@mui/icons-material/Home'

const STATUS_COLORS = {
  approved: '#4caf50',
  pending: '#ff9800',
  rejected: '#f44336',
  cancelled: '#9e9e9e'
}

const MyBookings = () => {
  const navigate = useNavigate()
  const { token, isAuthenticated, user } = useAuth()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBookings = async () => {
    if (!isAuthenticated || user?.role !== 'user') {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(buildApiUrl('/booking'), {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error(handleApiError(null, res))
      const data = await res.json()
      validateApiResponse(data)

      const { bookings = [] } = data.data ?? {}
      setBookings(bookings)
    } catch (err) {
      setError(err.message || handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [isAuthenticated, token]) // eslint-disable-line

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <CircularProgress />
    </Box>
  )

  if (error) return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 4 }}>
      <Alert severity="error">{error}</Alert>
    </Box>
  )

  if (bookings.length === 0) return (
    <Box sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h6">No bookings found.</Typography>
    </Box>
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography
        variant="h5"
        sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}
      >
        My Bookings
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {bookings.map((b) => {
          const { _id, property, timeSlot, status, date } = b

          if (!property) {
            return (
              <Grid item xs={12} sm={6} md={4} key={_id}>
                <Paper
                  elevation={6}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    background: '#f9f9f9'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon color="disabled" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                      Property Removed
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    This property no longer exists.
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3, rowGap: 1 }}>
                    <Chip
                      icon={<EventIcon sx={{ color: 'red' }} />}
                      label={new Date(date).toLocaleDateString()}
                      sx={{ px: 1.5, borderRadius: 2 }}
                    />
                    <Chip
                      icon={<ScheduleIcon sx={{ color: 'red' }} />}
                      label={timeSlot}
                      sx={{ px: 1.5, borderRadius: 2 }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      color: STATUS_COLORS[status] || 'black',
                      mt: 1,
                      alignSelf: 'flex-end'
                    }}
                  >
                    {status}
                  </Typography>
                </Paper>
              </Grid>
            )
          }

          const loc = property?.location ?? {}
          const titleWithCapitalBHK = property.title
            .split(' ')
            .map(word => word.toLowerCase() === 'bhk' ? 'BHK' : word)
            .join(' ')

          return (
            <Grid item xs={12} sm={6} md={4} key={_id}>
              <Paper
                elevation={6}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'scale(1.03)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }
                }}
                onClick={() => navigate(`/property/${property._id}`)}
              >
                {/* Status Indicator */}
                <Box sx={{ height: 6, backgroundColor: STATUS_COLORS[status] || '#ddd' }} />

                {/* Card Content */}
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, wordBreak: 'break-word', fontSize: 16, color: 'red' }}
                  >
                    {titleWithCapitalBHK}
                  </Typography>

                  {loc?.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                      <PlaceIcon sx={{ fontSize: 18, mt: 0.5 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        {loc.address}{loc.city ? `, ${loc.city}` : ''}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  {/* Date & Time */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3, rowGap: 1 }}>
                    <Chip
                      icon={<EventIcon sx={{ color: 'red' }} />}
                      label={new Date(date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      sx={{
                        px: 1.5,
                        borderRadius: 2,
                        minHeight: 36,
                        '& .MuiChip-label': { py: 0.8 },
                      }}
                    />

                    <Chip
                      icon={<ScheduleIcon sx={{ color: 'red' }} />}
                      label={timeSlot}
                      sx={{
                        px: 1.5,
                        borderRadius: 2,
                        minHeight: 36,
                        '& .MuiChip-label': { py: 0.8 },
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      color: STATUS_COLORS[status] || 'black',
                      mt: 1,
                      alignSelf: 'flex-end'
                    }}
                  >
                    {status}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default MyBookings
