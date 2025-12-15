// SubscriptionTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, Paper, Chip, CircularProgress,
  InputAdornment, TablePagination, IconButton, Tooltip, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Fade,
  MenuItem, useTheme, alpha, Alert
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { buildApiUrl, API_CONFIG } from '../../../config/api';

export default function SubscriptionTab() {
  const theme = useTheme();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [planType, setPlanType] = useState('');
  const [dateFilter, setDateFilter] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchPayments = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('adminToken');
      
      const res = await fetch(buildApiUrl(API_CONFIG.ADMIN.PAYMENTS), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error?.message || 'Fetch failed');
      setPayments(json.data.payments || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = useMemo(() => {
    return payments.filter(payment => {
      const q = query.toLowerCase();
      const userName = payment.user?.name?.toLowerCase() || '';
      const userEmail = payment.user?.email?.toLowerCase() || '';
      const txnId = payment.merchantTransactionId?.toLowerCase() || '';
      
      const matchesQuery = userName.includes(q) || userEmail.includes(q) || txnId.includes(q);
      const matchesStatus = status ? payment.status === status.toLowerCase() : true;
      const matchesPlan = planType ? payment.plan?.name === planType : true;
      
      let matchesDate = true;
      if (dateFilter) {
        const pDate = new Date(payment.createdAt).toDateString();
        matchesDate = pDate === new Date(dateFilter).toDateString();
      }

      return matchesQuery && matchesStatus && matchesPlan && matchesDate;
    });
  }, [payments, query, status, planType, dateFilter]);

  const paginated = useMemo(() => {
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  if (loading && !refreshing && payments.length === 0) return (
    <Box display="flex" justifyContent="center" py={5}>
      <CircularProgress size={32} />
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight:700 }}>
          Payments & Subscriptions
        </Typography>
        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchPayments}
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

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p:2, mb:3 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} flexWrap="wrap" justifyContent="flex-start">
          <TextField
            label="Search User / Txn ID"
            variant="outlined"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action"/>
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 200, flex: 2 }}
          />
          <TextField select label="Status" value={status} onChange={e => setStatus(e.target.value)} sx={{ minWidth: 140, flex: 1.3 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Success">Success</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Failed">Failed</MenuItem>
          </TextField>
          <TextField select label="Plan Type" value={planType} onChange={e => setPlanType(e.target.value)} sx={{ minWidth: 140, flex: 1.3 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Silver Plan">Silver</MenuItem>
            <MenuItem value="Gold Plan">Gold</MenuItem>
            <MenuItem value="Diamond Plan">Diamond</MenuItem>
          </TextField>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={dateFilter}
              onChange={setDateFilter}
              renderInput={(params) => <TextField {...params} sx={{ minWidth: 140, flex: 1.5 }} />}
            />
          </LocalizationProvider>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, borderRadius:2, overflow:'hidden' }}>
        <TableContainer sx={{ maxHeight:560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map(payment => (
                <Fade in key={payment.id}>
                  <TableRow hover sx={{ '&:last-of-type td': { border:0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {payment.user?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.plan?.name || 'N/A'} 
                        color={payment.plan?.name?.includes('Gold') ? 'warning' : payment.plan?.name?.includes('Silver') ? 'info' : 'secondary'} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      ₹{payment.totalAmount}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {payment.merchantTransactionId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.status} 
                        color={payment.status==='success' ? 'success' : payment.status==='failed' ? 'error' : 'warning'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign:'right' }}>
                      {new Date(payment.createdAt).toLocaleDateString()}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </Fade>
              ))}
              {paginated.length===0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                      <Typography color="text.secondary">No payments found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5,10,25]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_,p)=>setPage(p)}
          onRowsPerPageChange={e=>{ setRowsPerPage(parseInt(e.target.value,10)); setPage(0); }}
        />
      </Paper>
    </Box>
  );
}
