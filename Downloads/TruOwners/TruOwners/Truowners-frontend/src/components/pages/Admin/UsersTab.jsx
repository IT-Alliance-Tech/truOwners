// UsersTab.jsx  –  Enhanced
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  InputAdornment,
  TablePagination,
  IconButton,
  Tooltip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle,
  Cancel,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { buildApiUrl, API_CONFIG } from '../../../config/api';

const UsersTab = () => {
  const theme = useTheme();

  /* ---------------- state ---------------- */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage]   = useState(0);
  const [rowsPerPage, setRPP] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [userHistory, setUserHistory] = useState(null);

  /* --------------- fetch ----------------- */
  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('adminToken');

      const res  = await fetch(buildApiUrl('/admin/users-with-subscriptions'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error?.message || 'Fetch failed');
      setUsers(json.data.users || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserHistory = async (userId) => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('adminToken');
      const url = buildApiUrl(API_CONFIG.ADMIN.USER_SUBSCRIPTION_HISTORY).replace(':userId', userId);
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();

      if (json.success) {
        setUserHistory(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    fetchUserHistory(user.id);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setUserHistory(null);
  };

  useEffect(() => { fetchUsers(); }, []);

  /* ------------- filtering --------------- */
  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, query]);

  /* ------------- pagination -------------- */
  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  /* --------------- render ---------------- */
  if (loading && !refreshing && users.length === 0)
    return (
      <Box display="flex" justifyContent="center" py={5}>
        <CircularProgress size={32} />
      </Box>
    );

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Users Management&nbsp;
        </Typography>

        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchUsers}
            disabled={refreshing}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
            }}
          >
            <RefreshIcon color="primary" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* search */}
      <TextField
        fullWidth
        value={query}
        placeholder="Search by name or email…"
        onChange={e => { setQuery(e.target.value); setPage(0); }}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          )
        }}
      />

      {/* table */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.map(u => (
                <Fade in key={u.id}>
                  <TableRow hover>
                    <TableCell>
                      <Avatar
                        src={u.avatarUrl}
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          fontSize: '0.875rem'
                        }}
                      >
                        {u.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={u.role}
                        color={u.role === 'admin' ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      {u.activeSubscription ? (
                        <Chip
                          size="small"
                          label={u.activeSubscription.planName}
                          color="success"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">None</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <IconButton size="small" onClick={() => handleViewUser(u)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </Fade>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => {
            setRPP(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          User Details: {selectedUser?.name}
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : userHistory ? (
            <Grid container spacing={3}>
              {/* Active Subscription */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Active Subscription</Typography>
                {selectedUser?.activeSubscription ? (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Plan</Typography>
                        <Typography variant="body1" fontWeight={600}>{selectedUser.activeSubscription.planName}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Contacts Viewed</Typography>
                        <Typography variant="body1">
                          {selectedUser.activeSubscription.contactsViewed} / {selectedUser.activeSubscription.contactLimit}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Start Date</Typography>
                        <Typography variant="body2">{new Date(selectedUser.activeSubscription.startDate).toLocaleDateString()}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">End Date</Typography>
                        <Typography variant="body2">{new Date(selectedUser.activeSubscription.endDate).toLocaleDateString()}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ) : (
                  <Typography color="text.secondary">No active subscription</Typography>
                )}
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              {/* Subscription History */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Subscription History</Typography>
                {userHistory.subscriptions?.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Plan</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userHistory.subscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>{sub.planName}</TableCell>
                            <TableCell>
                              <Chip size="small" label={sub.status} color={sub.status === 'active' ? 'success' : 'default'} />
                            </TableCell>
                            <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No subscription history</Typography>
                )}
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              {/* Property Views */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Viewed Properties</Typography>
                {userHistory.propertyViews?.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Viewed At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userHistory.propertyViews.map((view) => (
                          <TableRow key={view.id}>
                            <TableCell>{view.property?.title || 'Unknown Property'}</TableCell>
                            <TableCell>{view.property?.location || 'N/A'}</TableCell>
                            <TableCell>{new Date(view.viewedAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No properties viewed yet</Typography>
                )}
              </Grid>
            </Grid>
          ) : (
            <Typography color="error">Failed to load history</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersTab;
