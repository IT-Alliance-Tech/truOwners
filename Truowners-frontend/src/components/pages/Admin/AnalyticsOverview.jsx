// AnalyticsOverview.jsx (Enhanced Version)
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  Container,
  useTheme,
  alpha,
  CardActions,
  Button
} from '@mui/material';
import {
  People,
  Home,
  TrendingUp,
  Pending,
  CheckCircle,
  Cancel,
  Publish,
  LocationOn,
  AttachMoney,
  Warning,
  Schedule,
  Verified,
  Build,
  Event,
  ConfirmationNumber,
  Hotel,
  Refresh,
  TrendingDown,
  Assessment,
  Business,
  PersonAdd,
  HomeWork,
  CalendarToday,
  Star,
  Visibility,
  Info
} from '@mui/icons-material';
import { buildApiUrl, API_CONFIG } from '../../../config/api';

const AnalyticsOverview = () => {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingProperties: 0,
    approvedProperties: 0,
    publishedProperties: 0,
    rejectedProperties: 0
  });
  const [bookingAnalytics, setBookingAnalytics] = useState({
    totalBookings: 0,
    bookingsByStatus: {
      pending: 0,
      approved: 0,
      cancelled: 0
    },
    bookingsByUserRole: {
      user: 0,
      owner: 0
    },
    topProperties: []
  });
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const token = localStorage.getItem('adminToken');
      
      // Fetch users
      const usersResponse = await fetch(buildApiUrl(API_CONFIG.ADMIN.USERS), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersResponse.json();

      // Fetch properties
      const propertiesResponse = await fetch(buildApiUrl(API_CONFIG.ADMIN.PROPERTIES), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const propertiesData = await propertiesResponse.json();

      // Fetch booking analytics
      const bookingsResponse = await fetch(buildApiUrl(API_CONFIG.ADMIN.BOOKING_ANALYTICS), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const bookingsData = await bookingsResponse.json();

      const statusBreakdown = propertiesData.data?.statusBreakdown || {};
      
      setAnalytics({
        totalUsers: usersData.data?.totalUsers || 0,
        totalProperties: propertiesData.data?.totalProperties || 0,
        pendingProperties: statusBreakdown.pending || 0,
        approvedProperties: statusBreakdown.approved || 0,
        publishedProperties: statusBreakdown.published || 0,
        rejectedProperties: statusBreakdown.rejected || 0
      });
      
      setBookingAnalytics({
        totalBookings: bookingsData.data?.totalBookings || 0,
        bookingsByStatus: bookingsData.data?.bookingsByStatus || { pending: 0, approved: 0, cancelled: 0 },
        bookingsByUserRole: bookingsData.data?.bookingsByUserRole || { user: 0, owner: 0 },
        topProperties: bookingsData.data?.topProperties || []
      });
      
      setProperties(propertiesData.data?.properties || []);
      setUsers(usersData.data?.users || []);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Enhanced StatCard with better visuals
  const StatCard = ({ title, value, icon, color, subtitle, progress, trend, onClick }) => (
    <Card 
      elevation={0} 
      sx={{ 
        height: '100%', 
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: alpha(color, 0.3)
        } : {},
        background: `linear-gradient(135deg, ${alpha(color, 0.02)} 0%, ${alpha(color, 0.05)} 100%)`
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Modified title and icon row */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography 
            variant="subtitle2" 
            color="textSecondary" 
            sx={{ 
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              flexGrow: 1  // Takes available space
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box 
              sx={{ 
                color: alpha(color, 0.8),
                ml: 1  // Add some margin between title and icon
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
  
        {/* Value and trend section */}
        <Box display="flex" alignItems="center" gap={1} mb={subtitle ? 1 : 0}>
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              color,
              fontWeight: 700,
              fontSize: '2rem'
            }}
          >
            {loading ? <CircularProgress size={28} sx={{ color }} /> : value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center">
              {trend > 0 ? (
                <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: trend > 0 ? 'success.main' : 'error.main',
                  fontWeight: 600,
                  ml: 0.5
                }}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        
        {subtitle && (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ 
              fontSize: '0.8rem',
              lineHeight: 1.4
            }}
          >
            {subtitle}
          </Typography>
        )}
        
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                Progress
              </Typography>
              <Typography variant="caption" color={color} sx={{ fontWeight: 600 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: alpha(color, 0.1),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );


  // Helper functions (keeping the same logic)
  const getRentStatistics = () => {
    if (properties.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const rents = properties.map(p => p.rent).filter(r => r > 0);
    if (rents.length === 0) return { min: 0, max: 0, avg: 0 };
    
    return {
      min: Math.min(...rents),
      max: Math.max(...rents),
      avg: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length)
    };
  };

  const getCityDistribution = () => {
    const cityCount = {};
    properties.forEach(p => {
      const city = p.location?.city || 'Unknown';
      cityCount[city] = (cityCount[city] || 0) + 1;
    });
    
    return Object.entries(cityCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getPropertyTypeDistribution = () => {
    const typeCount = {};
    properties.forEach(p => {
      const type = p.propertyType || 'Unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a);
  };

  const getRecentUsers = () => {
    return users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const getRecentProperties = () => {
    return properties
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const getPendingActions = () => {
    const pendingProps = properties.filter(p => p.status === 'pending');
    const unverifiedOwners = properties.filter(p => p.owner && !p.owner.verified);
    
    return {
      pendingReviews: pendingProps.length,
      unverifiedOwners: unverifiedOwners.length,
      totalActions: pendingProps.length + unverifiedOwners.length
    };
  };

  // Calculate values
  const rentStats = getRentStatistics();
  const cityDistribution = getCityDistribution();
  const propertyTypes = getPropertyTypeDistribution();
  const recentUsers = getRecentUsers();
  const recentProperties = getRecentProperties();
  const pendingActions = getPendingActions();

  const totalProperties = analytics.totalProperties || 1;
  const pendingPercentage = Math.round((analytics.pendingProperties / totalProperties) * 100);
  const publishedPercentage = Math.round((analytics.publishedProperties / totalProperties) * 100);

  const ownerCount = users.filter(u => u.role === 'owner').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const verifiedCount = users.filter(u => u.isVerified).length;
  const verifiedPercentage = analytics.totalUsers > 0 ? Math.round((verifiedCount / analytics.totalUsers) * 100) : 0;

  const totalBookings = bookingAnalytics.totalBookings || 1;
  const approvedBookingsPercentage = Math.round((bookingAnalytics.bookingsByStatus.approved / totalBookings) * 100);
  const pendingBookingsPercentage = Math.round((bookingAnalytics.bookingsByStatus.pending / totalBookings) * 100);

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                mb: 1
              }}
            >
              Dashboard Analytics
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Comprehensive overview of your platform's performance and metrics
            </Typography>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <Refresh sx={{ color: 'primary.main' }} />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Quick Stats Bar */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="primary.main" fontWeight={700}>
                  {analytics.totalUsers}
                </Typography>
                <Typography variant="caption" color="textSecondary" fontWeight={600}>
                  TOTAL USERS
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="success.main" fontWeight={700}>
                  {analytics.totalProperties}
                </Typography>
                <Typography variant="caption" color="textSecondary" fontWeight={600}>
                  PROPERTIES
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="info.main" fontWeight={700}>
                  {bookingAnalytics.totalBookings}
                </Typography>
                <Typography variant="caption" color="textSecondary" fontWeight={600}>
                  BOOKINGS
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="warning.main" fontWeight={700}>
                  {pendingActions.totalActions}
                </Typography>
                <Typography variant="caption" color="textSecondary" fontWeight={600}>
                  PENDING ACTIONS
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Main Analytics Grid */}
      <Grid container spacing={3}>
        {/* Row 1: Core Metrics */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Users"
            value={analytics.totalUsers}
            icon={<People fontSize="small" />}
            color={theme.palette.primary.main}
            subtitle={`${ownerCount} property owners • ${adminCount} administrators`}
            
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Properties"
            value={analytics.totalProperties}
            icon={<Home />}
            color={theme.palette.success.main}
            subtitle={`Listed across ${cityDistribution.length} cities`}
                      />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Reviews"
            value={analytics.pendingProperties}
            icon={<Pending />}
            color={theme.palette.warning.main}
            subtitle="Awaiting admin approval"
            progress={pendingPercentage}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Live Properties"
            value={analytics.publishedProperties}
            icon={<Publish />}
            color={theme.palette.info.main}
            subtitle="Currently available for booking"
            progress={publishedPercentage}
          />
        </Grid>

        {/* Row 2: Booking Analytics */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Bookings"
            value={bookingAnalytics.totalBookings}
            icon={<Event />}
            color={theme.palette.primary.main}
            subtitle={`${bookingAnalytics.bookingsByStatus.approved} confirmed bookings`}
            
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Confirmed Bookings"
            value={bookingAnalytics.bookingsByStatus.approved}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            subtitle="Successfully processed"
            progress={approvedBookingsPercentage}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Bookings"
            value={bookingAnalytics.bookingsByStatus.pending}
            icon={<ConfirmationNumber />}
            color={theme.palette.warning.main}
            subtitle="Awaiting confirmation"
            progress={pendingBookingsPercentage}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Top Property"
            value={bookingAnalytics.topProperties[0]?.bookingsCount || 0}
            icon={<Star />}
            color={theme.palette.info.main}
            subtitle={bookingAnalytics.topProperties[0]?.title?.substring(0, 25) + '...' || 'No data available'}
          />
        </Grid>

        {/* Row 3: Additional Metrics */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Average Rent"
            value={`₹${rentStats.avg.toLocaleString()}`}
            icon={<AttachMoney />}
            color={theme.palette.success.main}
            subtitle={`Range: ₹${rentStats.min.toLocaleString()} - ₹${rentStats.max.toLocaleString()}`}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Rejected Properties"
            value={analytics.rejectedProperties}
            icon={<Cancel />}
            color={theme.palette.error.main}
            subtitle="Properties declined by admin"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Action Required"
            value={pendingActions.totalActions}
            icon={<Warning />}
            color={theme.palette.error.main}
            subtitle={`${pendingActions.pendingReviews} reviews • ${pendingActions.unverifiedOwners} verifications`}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Verified Users"
            value={verifiedCount}
            icon={<Verified />}
            color={theme.palette.info.main}
            subtitle={`${verifiedPercentage}% of total users verified`}
            progress={verifiedPercentage}
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Recent Properties */}
        <Grid item xs={12} lg={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              height: 420, 
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <HomeWork sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Recent Properties
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ height: 340, overflow: 'auto', px: 1 }}>
              {recentProperties.length > 0 ? (
                <List dense sx={{ p: 0 }}>
                  {recentProperties.map((property, index) => (
                    <React.Fragment key={property.id}>
                      <ListItem 
                        sx={{ 
                          px: 2, 
                          py: 1.5,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                          borderRadius: 1,
                          mx: 1,
                          my: 0.5
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 48 }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main'
                            }}
                          >
                            <Home />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Typography variant="body1" fontWeight={600} noWrap sx={{ flex: 1 }}>
                                {property.title}
                              </Typography>
                              <Chip 
                                label={property.status} 
                                size="small" 
                                color={
                                  property.status === 'pending' ? 'warning' : 
                                  property.status === 'published' ? 'info' : 
                                  property.status === 'approved' ? 'success' : 'default'
                                }
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="caption" fontWeight={600}>
                                  ₹{property.rent?.toLocaleString()}
                                </Typography>
                                <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="textSecondary">
                                  {property.location?.city || 'N/A'}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="textSecondary">
                                Added {new Date(property.createdAt).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  height="100%"
                  gap={2}
                >
                  <Home sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="textSecondary" variant="body2">
                    No recent properties found
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} lg={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              height: 420, 
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box display="flex" alignItems="center">
                  <People sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Recent Users
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ height: 340, overflow: 'auto', px: 1 }}>
              {recentUsers.length > 0 ? (
                <List dense sx={{ p: 0 }}>
                  {recentUsers.map((user, index) => (
                    <React.Fragment key={user.id}>
                      <ListItem 
                        sx={{ 
                          px: 2, 
                          py: 1.5,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                          borderRadius: 1,
                          mx: 1,
                          my: 0.5
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 48 }}>
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {user.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
                                {user.name}
                              </Typography>
                              <Chip 
                                label={user.role} 
                                size="small" 
                                color={user.role === 'admin' ? 'primary' : 'default'}
                                sx={{ fontSize: '0.7rem' }}
                              />
                              {user.isVerified && (
                                <Verified sx={{ fontSize: 16, color: 'success.main' }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="caption" noWrap>
                                {user.email}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  height="100%"
                  gap={2}
                >
                  <People sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="textSecondary" variant="body2">
                    No recent users found
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Top Booked Properties */}
        <Grid item xs={12} lg={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Box display="flex" alignItems="center">
                <Assessment sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Top Booked Properties
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ p: 3 }}>
              {bookingAnalytics.topProperties.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Property</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Bookings</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Share</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingAnalytics.topProperties.slice(0, 5).map((property, index) => (
                        <TableRow 
                          key={property.propertyId}
                          sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={index + 1} 
                                size="small" 
                                sx={{ 
                                  minWidth: 24, 
                                  height: 24,
                                  bgcolor: index === 0 ? 'warning.main' : alpha(theme.palette.primary.main, 0.1)
                                }} 
                              />
                              <Typography variant="body2" noWrap>
                                {property.title}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {property.bookingsCount}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                              {Math.round((property.bookingsCount / bookingAnalytics.totalBookings) * 100)}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  py={4}
                  gap={2}
                >
                  <Assessment sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="textSecondary" variant="body2">
                    No booking data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Property Types Distribution */}
        <Grid item xs={12} lg={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Box display="flex" alignItems="center">
                <Business sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Property Types
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ p: 3 }}>
              {propertyTypes.length > 0 ? (
                <Stack spacing={3}>
                  {propertyTypes.map(([type, count]) => {
                    const percentage = Math.round((count / analytics.totalProperties) * 100);
                    return (
                      <Box key={type}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                            {type}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={600}>
                              {count}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ({percentage}%)
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 5,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  py={4}
                  gap={2}
                >
                  <Business sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="textSecondary" variant="body2">
                    No property type data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer Note */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Last updated: {new Date().toLocaleString()} • Data refreshes automatically every 5 minutes
        </Typography>
      </Box>
    </Container>
  );
};

export default AnalyticsOverview;
