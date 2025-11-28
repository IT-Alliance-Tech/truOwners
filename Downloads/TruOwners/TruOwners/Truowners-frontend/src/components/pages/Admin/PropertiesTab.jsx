// PropertiesTab.jsx - Updated with title search and mark as sold functionality
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
   FormGroup,          // <-- Add this
  FormControlLabel, 
  Checkbox, 
  Grid,
  Card,
  CardContent,
  CardMedia,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Stack,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility,
  FilterList,
  ExpandMore,
  Clear,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Home,
  Person,
  Email,
  Phone,
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  CalendarToday,
  Sort,
  CheckCircle,
  Cancel,
  Pending,
  Publish,
  CheckCircleOutline
} from '@mui/icons-material';
import { buildApiUrl, API_CONFIG } from '../../../config/api';
import RoomIcon from '@mui/icons-material/Room';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPropertyModal from './AddPropertyModal';

const PropertiesTab = () => {
  const theme = useTheme();
    const fileInputRef = useRef(null);

  /* ---------------- State Management ---------------- */
  const [properties, setProperties] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusBreakdown, setStatusBreakdown] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
const amenitiesList = [
  'WiFi', 'Parking', 'Gym', 'Swimming Pool', 'Security', 'Elevator',
  'Balcony', 'Garden', 'Furnished', 'Air Conditioning', 'Heating',
  'Laundry', 'Pet Friendly', 'Near Metro', 'Shopping Mall', 'Hospital'
];

  // API filters matching your backend exactly
  const [apiFilters, setApiFilters] = useState({
    propertyId: '',
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    status: '',
    propertyType: '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
    bathrooms: '',
    title: '' // Add title filter for search
  });
// Post Property Modal
const [postPropertyOpen, setPostPropertyOpen] = useState(false);

// Form Data
const [newPropertyData, setNewPropertyData] = useState({
  title: '',
  description: '',
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    googleMapsLink: ''
  },
  propertyType: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  rent: '',
  deposit: '',
  amenities: [],
  images: [],
  videos: []
});
const openGoogleMaps = () => {
  const address = newPropertyData.location.address || '';
  const query = encodeURIComponent(address);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
};

console.log(newPropertyData);


const [uploading, setUploading] = useState(false);

  // UI State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter options
  const [filterOptions] = useState({
    propertyTypes: ['apartment', 'house', 'villa', 'studio', 'commercial'],
    statuses: ['pending', 'approved', 'published', 'rejected', 'sold']
  });

  /* ---------------- Title Search Functionality ---------------- */
  // Debounced title search
  useEffect(() => {
    const timer = setTimeout(() => {
      setApiFilters(prev => ({ ...prev, title: searchQuery }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ---------------- API Integration ---------------- */
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    // Pagination (API expects 1-based page numbers)
    params.append('page', (page + 1).toString());
    params.append('limit', rowsPerPage.toString());

    // Sorting
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);

    // Filters - only add non-empty values
    Object.entries(apiFilters).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        params.append(key, value.toString().trim());
      }
    });

    return params.toString();
  }, [page, rowsPerPage, sortBy, sortOrder, apiFilters]);

  const fetchProperties = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');

      const queryParams = buildQueryParams();
      const url = `${buildApiUrl(API_CONFIG.ADMIN.PROPERTIES)}?${queryParams}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }

      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch properties');
      }

      // Set data from API response
      setProperties(data.data.properties || []);
      setTotalCount(data.data.pagination?.totalProperties || 0);
      setStatusBreakdown(data.data.statusBreakdown || {});
      setError(null);

    } catch (err) {
      console.error('Fetch properties error:', err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  // Initial load
  useEffect(() => {
    fetchProperties(true);
  }, []);

  // Refetch when filters/sorting change
  useEffect(() => {
    if (!loading) {
      setPage(0); // Reset to first page when filters change
      fetchProperties();
    }
  }, [apiFilters, sortBy, sortOrder, rowsPerPage]);

  // Refetch when page changes
  useEffect(() => {
    if (!loading) {
      fetchProperties();
    }
  }, [page]);

  /* ---------------- Filter Management ---------------- */
  const handleFilterChange = (key, value) => {
    setApiFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setApiFilters({
      propertyId: '',
      customerEmail: '',
      customerName: '',
      customerPhone: '',
      status: '',
      propertyType: '',
      minRent: '',
      maxRent: '',
      bedrooms: '',
      bathrooms: '',
      title: ''
    });
    setSearchQuery('');
  };

  const activeFiltersCount = Object.values(apiFilters).filter(v =>
    v && v.toString().trim()
  ).length;

  /* ---------------- Property Actions ---------------- */
  const handlePropertyAction = async (propertyId, action, newStatus = null) => {
  try {
    setActionLoading(true);
    const token = localStorage.getItem('adminToken');

    let endpoint, method = 'PUT', body = null;

    switch (action) {
      case 'review':
        endpoint = API_CONFIG.ADMIN.REVIEW_PROPERTY.replace(':id', propertyId);
        body = JSON.stringify({ status: newStatus });
        method = 'PATCH';
        break;
      case 'publish':
        endpoint = API_CONFIG.ADMIN.PUBLISH_PROPERTY.replace(':id', propertyId);
        body = JSON.stringify({ status: newStatus });
        break;
      case 'markSold':
      case 'published':
        endpoint = API_CONFIG.ADMIN.PUBLISH_PROPERTY.replace(':id', propertyId);
        body = JSON.stringify({ status: newStatus });
        break;
      default:
        throw new Error('Unknown action');
    }

    const response = await fetch(buildApiUrl(endpoint), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      ...(body && { body })
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} property`);
    }

    const actionText = 
      action === 'markSold' ? 'marked as sold' : 
      action === 'unsold' ? 'marked as unsold' : 
      `${action}ed`;

    setSnackbar({
      open: true,
      message: `Property ${actionText} successfully`,
      severity: 'success'
    });

    await fetchProperties();
    setDialogOpen(false);

  } catch (err) {
    console.error(`Property ${action} error:`, err);
    setSnackbar({
      open: true,
      message: `Error: ${err.message}`,
      severity: 'error'
    });
  } finally {
    setActionLoading(false);
  }
};


  /* ---------------- UI Helpers ---------------- */
  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      published: 'info',
      rejected: 'error',
      sold: 'secondary'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Pending />,
      approved: <CheckCircle />,
      published: <Publish />,
      rejected: <Cancel />,
      sold: <CheckCircleOutline />
    };
    return icons[status] || null;
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);

  /* ---------------- Loading State ---------------- */
  if (loading) {
    return (
      <Box>
        <Grid container spacing={3} mb={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }
const handlePostPropertySubmit = async () => {
  try {
    setUploading(true);
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('title', newPropertyData.title);
    formData.append('description', newPropertyData.description);
    formData.append('propertyType', newPropertyData.propertyType);
    formData.append('area', newPropertyData.area);
    formData.append('bedrooms', newPropertyData.bedrooms);
    formData.append('bathrooms', newPropertyData.bathrooms);
    formData.append('rent', newPropertyData.rent);
    formData.append('deposit', newPropertyData.deposit);
    formData.append('location', JSON.stringify(newPropertyData.location));
    formData.append('amenities', JSON.stringify(newPropertyData.amenities));

    newPropertyData.images.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(buildApiUrl(API_CONFIG.ADMIN.POST_PROPERTY), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();

    if (!data.success) throw new Error(data.error?.message || 'Failed to post property');

    setSnackbar({ open: true, message: 'Property posted successfully', severity: 'success' });
    setPostPropertyOpen(false);
    fetchProperties();

  } catch (err) {
    console.error('Post property error:', err);
    setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
  } finally {
    setUploading(false);
  }
};

 return (
  <Box>
    {/* Header with Status Overview */}
    <Box mb={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="column" spacing={1} alignItems="center">
          {/* (You can keep this empty or remove it if not used) */}
        </Stack>

         {/* Right-side actions */}
        <Box display="flex" flexDirection="column" alignItems="flex-end">
  <Tooltip title="Refresh Data">
    <IconButton
      onClick={() => fetchProperties()}
      disabled={refreshing}
      sx={{
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
      }}
    >
      <RefreshIcon color="primary" />
    </IconButton>
  </Tooltip>

  {/* ✅ Place button directly below refresh */}
<Button
  variant="contained"
  color="primary"
  size="small"
  sx={{ mt: 1, textTransform: 'none' }}
  onClick={() => setPostPropertyOpen(true)}
>
  Add Property
</Button>

</Box>
</Box>

{/* Add Property Modal */}
{postPropertyOpen && (
  <AddPropertyModal
    onClose={() => setPostPropertyOpen(false)}
    onSuccess={(data) => {
      setSnackbar({
        open: true,
        message: `Property created successfully${data.isNewOwner ? ' with new owner' : ''}`,
        severity: 'success'
      });
      fetchProperties();
    }}
    token={localStorage.getItem('adminToken')}
  />
)}





        {/* Status Overview Cards */}
        <Grid container spacing={2} mb={3}>
          {Object.entries(statusBreakdown).map(([status, count]) => (
            <Grid item xs={6} sm={3} lg={2.4} key={status}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                }}
                onClick={() => handleFilterChange('status', status)}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette[getStatusColor(status)]?.main }}>
                    {getStatusIcon(status)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{count}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Title Search Bar */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search by property title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <Clear />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Search hint */}
        {searchQuery && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              🔍 Searching by title: "{searchQuery}"
            </Typography>
          </Box>
        )}
      </Box>

      {/* Advanced Filters */}
      <Paper elevation={0} sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, borderRadius: 2 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <FilterList />
              <Typography variant="subtitle1" fontWeight={600}>
                Advanced Filters
              </Typography>
              {activeFiltersCount > 0 && (
                <Chip
                  label={`${activeFiltersCount} active`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {refreshing && <CircularProgress size={16} />}
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Search Filters - First Row */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  fontWeight={600}
                  gutterBottom
                >
                  Search Filters
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Property ID"
                  value={apiFilters.propertyId}
                  onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                  placeholder="Enter exact property ID..."
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Name"
                  value={apiFilters.customerName}
                  onChange={(e) => handleFilterChange('customerName', e.target.value)}
                  placeholder="Search by name..."
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Phone"
                  value={apiFilters.customerPhone}
                  onChange={(e) => handleFilterChange('customerPhone', e.target.value)}
                  placeholder="Search by phone..."
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Email"
                  value={apiFilters.customerEmail}
                  onChange={(e) => handleFilterChange('customerEmail', e.target.value)}
                  placeholder="Search by email..."
                />
              </Grid>
            </Grid>

            {/* 🔹 New Grid for Property Filters */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  fontWeight={600}
                  gutterBottom
                >
                  Property Filters
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl sx={{ minWidth: 130 }} size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={apiFilters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {filterOptions.statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>Property Type</InputLabel>
                  <Select
                    value={apiFilters.propertyType}
                    label="Property Type"
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {filterOptions.propertyTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl sx={{ minWidth: 130 }} size="small">
                  <InputLabel>Bedrooms</InputLabel>
                  <Select
                    value={apiFilters.bedrooms}
                    label="Bedrooms"
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num} BHK
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl sx={{ minWidth: 130 }} size="small">
                  <InputLabel>Bathrooms</InputLabel>
                  <Select
                    value={apiFilters.bathrooms}
                    label="Bathrooms"
                    onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min Rent"
                  value={apiFilters.minRent}
                  onChange={(e) => handleFilterChange('minRent', e.target.value)}
                  placeholder="₹ Minimum"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Rent"
                  value={apiFilters.maxRent}
                  onChange={(e) => handleFilterChange('maxRent', e.target.value)}
                  placeholder="₹ Maximum"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Clear />}
                  onClick={clearAllFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Clear All ({activeFiltersCount})
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>

        </Accordion>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results Summary and Sorting */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {properties.length} of {totalCount} properties
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="createdAt">Created Date</MenuItem>
              <MenuItem value="updatedAt">Updated Date</MenuItem>
              <MenuItem value="rent">Rent Amount</MenuItem>
              <MenuItem value="title">Title</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            startIcon={<Sort />}
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </Box>
      </Box>

      {/* Properties Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Rent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      {property.images?.[0] && (
                        <Avatar
                          src={property.images[0]}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                      )}
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {property.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {property.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {property.owner?.name?.charAt(0) || 'N'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {property.owner?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {property.owner?.verified ? '✓ Verified' : '⚠ Unverified'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Email sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption">
                          {property.owner?.email || 'N/A'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption">
                          {property.owner?.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn sx={{ fontSize: 14 }} color="action" />
                      <Box>
                        <Typography variant="body2">
                          {property.location?.city || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {property.location?.state}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Bed sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption">{property.bedrooms}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Bathtub sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption">{property.bathrooms}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <SquareFoot sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption">{property.area}sqft</Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatCurrency(property.rent)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      /month
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={property.status}
                      color={getStatusColor(property.status)}
                      size="small"
                      icon={getStatusIcon(property.status)}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {
                        setSelectedProperty(property);
                        setDialogOpen(true);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {properties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box display="flex" flexDirection="column" alignItems="center" py={8}>
                      <Home sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No properties found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters or search terms
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Property Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight={600}>
              Property Details
            </Typography>
            {selectedProperty && (
              <Chip
                label={selectedProperty.status}
                color={getStatusColor(selectedProperty.status)}
                icon={getStatusIcon(selectedProperty.status)}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedProperty && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                {/* Property Images */}
                {selectedProperty.images?.length > 0 && (
                  <Box mb={3}>
                    <CardMedia
                      component="img"
                      height="300"
                      image={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      sx={{ borderRadius: 2, mb: 2 }}
                    />
                    {selectedProperty.images.length > 1 && (
                      <Grid container spacing={1}>
                        {selectedProperty.images.slice(1, 4).map((img, idx) => (
                          <Grid item xs={4} key={idx}>
                            <CardMedia
                              component="img"
                              height="80"
                              image={img}
                              sx={{ borderRadius: 1 }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}

                <Typography variant="h4" gutterBottom fontWeight={700}>
                  {selectedProperty.title}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <LocationOn color="action" />
                  <Typography variant="body1" color="text.secondary">
                    {selectedProperty.location?.address}, {selectedProperty.location?.city}, {selectedProperty.location?.state}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="baseline" gap={2} mb={3}>
                  <Typography variant="h3" color="primary" fontWeight={700}>
                    {formatCurrency(selectedProperty.rent)}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    per month
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Security Deposit: {formatCurrency(selectedProperty.deposit)}
                </Typography>

                {/* Property Features */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <Home sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          {selectedProperty.propertyType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Property Type
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <Bed sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          {selectedProperty.bedrooms}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bedrooms
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <Bathtub sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          {selectedProperty.bathrooms}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bathrooms
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <SquareFoot sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          {selectedProperty.area}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sq Ft
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedProperty.description}
                </Typography>

                {selectedProperty.amenities?.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Amenities
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedProperty.amenities.map((amenity) => (
                        <Chip
                          key={amenity}
                          label={amenity}
                          variant="outlined"
                          color="primary"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>

              {/* Owner Information Sidebar */}
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Owner Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {selectedProperty.owner ? (
                      <Stack spacing={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 56, height: 56 }}>
                            {selectedProperty.owner.name?.charAt(0) || 'N'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {selectedProperty.owner.name}
                            </Typography>
                            <Chip
                              label={selectedProperty.owner.verified ? 'Verified' : 'Unverified'}
                              color={selectedProperty.owner.verified ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </Box>

                        <List dense>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                <Email sx={{ fontSize: 16 }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary="Email"
                              secondary={selectedProperty.owner.email}
                            />
                          </ListItem>

                          {selectedProperty.owner.phone && (
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  <Phone sx={{ fontSize: 16 }} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary="Phone"
                                secondary={selectedProperty.owner.phone}
                              />
                            </ListItem>
                          )}

                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                <Person sx={{ fontSize: 16 }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary="Role"
                              secondary={selectedProperty.owner.role}
                            />
                          </ListItem>
                        </List>
                      </Stack>
                    ) : (
                      <Typography color="text.secondary">
                        Owner information not available
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Property Timeline
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <CalendarToday sx={{ fontSize: 16 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Created"
                          secondary={new Date(selectedProperty.createdAt).toLocaleString()}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <CalendarToday sx={{ fontSize: 16 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Last Updated"
                          secondary={new Date(selectedProperty.updatedAt || selectedProperty.createdAt).toLocaleString()}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
  <Button onClick={() => setDialogOpen(false)}>Close</Button>

  {/* Actions for pending properties */}
  {selectedProperty?.status === 'pending' && (
    <>
      <Button
        color="error"
        variant="outlined"
        disabled={actionLoading}
        onClick={() => handlePropertyAction(selectedProperty.id, 'review', 'rejected')}
        startIcon={actionLoading ? <CircularProgress size={16} /> : <Cancel />}
      >
        Reject
      </Button>
      <Button
        color="success"
        variant="contained"
        disabled={actionLoading}
        onClick={() => handlePropertyAction(selectedProperty.id, 'review', 'approved')}
        startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckCircle />}
      >
        Approve
      </Button>
    </>
  )}

  {/* Actions for approved properties */}
  {selectedProperty?.status === 'approved' && (
    <Button
      color="primary"
      variant="contained"
      disabled={actionLoading}
      onClick={() => handlePropertyAction(selectedProperty.id, 'publish', 'published')}
      startIcon={actionLoading ? <CircularProgress size={16} /> : <Publish />}
    >
      Publish
    </Button>
  )}

  {/* Actions for published properties */}
  {selectedProperty?.status === 'published' && (
    <Button
      color="secondary"
      variant="contained"
      disabled={actionLoading}
      onClick={() => handlePropertyAction(selectedProperty.id, 'markSold', 'sold')}
      startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckCircleOutline />}
    >
      Mark as Sold
    </Button>
  )}

  {/* Actions for sold properties */}
  {selectedProperty?.status === 'sold' && (
    <Button
      color="primary"
      variant="contained"
      disabled={actionLoading}
      onClick={() => handlePropertyAction(selectedProperty.id, 'unsold', 'published')}
      startIcon={actionLoading ? <CircularProgress size={16} /> : <Publish />}
    >
      Published
    </Button>
  )}
</DialogActions>

      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropertiesTab;
