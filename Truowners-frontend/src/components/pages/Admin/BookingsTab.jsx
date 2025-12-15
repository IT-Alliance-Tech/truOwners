// BookingsTab.jsx – Enhanced (consistent dashboard styling)
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, Paper, Chip, Button, CircularProgress, Alert,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Card, CardContent, Divider, FormControl, InputLabel, Select, MenuItem,
  Accordion, AccordionSummary, AccordionDetails, Avatar, IconButton, Tooltip,
  FormGroup, FormControlLabel, Checkbox, List, ListItem, ListItemIcon, ListItemText,
  Fade, useTheme, alpha
} from '@mui/material';
import {
  Search as SearchIcon, Visibility, FilterList, ExpandMore, Clear, Schedule,
  CalendarToday, Refresh as RefreshIcon, Edit, AccessTime
} from '@mui/icons-material';
import { buildApiUrl, API_CONFIG } from '../../../config/api';

const BookingsTab = () => {
  const theme = useTheme();

  /* ───────── state ───────── */
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState({ totalBookings: 0, totalByStatus: {} });

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ status:'all', city:'all' });
  const [filterOptions, setFilterOptions] = useState({ statuses:['pending','approved','rejected','completed'], cities:[] });

  const [page, setPage] = useState(0);
  const [rpp,  setRPP] = useState(10);

  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,    setError]    = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [timeDialog, setTimeDialog] = useState(false);
  const [availableSlots, setSlots] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [reason,    setReason]    = useState('');
  const [processing, setProcessing] = useState(false);

  /* ───────── fetch ───────── */
  const fetchBookings = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('adminToken');
      const res  = await fetch(buildApiUrl(API_CONFIG.ADMIN.BOOKINGS), { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error();
      setBookings(json.data.bookings || []);
      setAnalytics({ totalBookings: json.data.totalBookings, totalByStatus: json.data.totalByStatus });
      /* cities */
      const cities = [...new Set(json.data.bookings.map(b=>b.property?.location?.city).filter(Boolean))].sort();
      setFilterOptions(prev => ({ ...prev, cities }));
      setError(null);
    } catch {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { fetchBookings(); }, []);

  /* ───────── helpers ───────── */
  const statusColor = s => ({ pending:'warning', approved:'success', rejected:'error', completed:'info' }[s] || 'default');

  const handleFilter = (k,v) => setFilters(prev => ({ ...prev, [k]:v }));

  /* ───────── derived lists ───────── */
  const filtered = useMemo(() => {
    let list = [...bookings];
    if (query)
      list = list.filter(b =>
        [b.user?.name, b.user?.email, b.property?.title, b.property?.location?.city]
          .filter(Boolean)
          .some(v => v.toLowerCase().includes(query.toLowerCase()))
      );
    if (filters.status!=='all') list = list.filter(b=>b.status===filters.status);
    if (filters.city!=='all')   list = list.filter(b=>b.property?.location?.city===filters.city);
    return list;
  }, [bookings, query, filters]);

  const paginated = useMemo(
    () => filtered.slice(page*rpp, page*rpp+rpp),
    [filtered, page, rpp]
  );

  const activeFilterCount = ['status','city'].filter(k=>filters[k]!=='all').length;

  /* ───────── status update ───────── */
  const updateStatus = async (id,status) => {
    try{
      setProcessing(true);
      const token = localStorage.getItem('adminToken');
      await fetch(buildApiUrl(API_CONFIG.ADMIN.UPDATE_BOOKING.replace(':id',id)),{
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      await fetchBookings();
      setDialogOpen(false);
    }finally{ setProcessing(false); }
  };

  /* ───────── reschedule ───────── */
  const loadSlots = async () => {
    if(!selected) return;
    setProcessing(true);
    const token = localStorage.getItem('adminToken');
    const res = await fetch(buildApiUrl(API_CONFIG.PROPERTIES.AVAILABLE_SLOTS.replace(':id',selected.property._id)),{
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ date: selected.date, excludeCurrentBooking: selected._id })
    });
    const json = await res.json();
    setSlots(json.availableSlots || []);
    setProcessing(false);
  };

  const requestChange = async () => {
    try{
      setProcessing(true);
      const token = localStorage.getItem('adminToken');
      await fetch(buildApiUrl(API_CONFIG.ADMIN.REQUEST_TIME_CHANGE.replace(':id',selected._id)),{
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ reason, suggestedSlots:suggested })
      });
      setTimeDialog(false); setSuggested([]); setReason('');
    }finally{ setProcessing(false); }
  };

  /* ───────── UI ───────── */
  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={5}>
        <CircularProgress size={32}/>
      </Box>
    );
  if (error)
    return <Alert severity="error" sx={{ mb:3 }}>{error}</Alert>;

  return (
    <Box>
      {/* header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight:700 }}>
          Bookings Management&nbsp;
        </Typography>
        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchBookings}
            disabled={refreshing}
            sx={{ bgcolor:alpha(theme.palette.primary.main,0.1),
                  '&:hover':{ bgcolor:alpha(theme.palette.primary.main,0.2)} }}
          >
            <RefreshIcon color="primary"/>
          </IconButton>
        </Tooltip>
      </Box>

      {/* analytics mini-cards */}
      <Grid container spacing={1.5} mb={3}>
        <Grid item xs={6} md={3}>
          <Card elevation={0} sx={{ border:`1px solid ${alpha(theme.palette.divider,0.12)}` }}>
            <CardContent sx={{ p:2 }}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Bookings</Typography>
                  <Typography variant="h4" color="primary.main">{analytics.totalBookings}</Typography>
                </Box>
                <Schedule sx={{ fontSize:20, color:'primary.main' }}/>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {Object.entries(analytics.totalByStatus).map(([s,c])=>(
          <Grid item xs={6} md={3} key={s}>
            <Card elevation={0} sx={{ border:`1px solid ${alpha(theme.palette.divider,0.12)}` }}>
              <CardContent sx={{ p:2 }}>
                <Box display="flex" justifyContent="space-between" width={100}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </Typography>
                    <Typography variant="h4" color={`${statusColor(s)}.main`}>{c}</Typography>
                  </Box>
                  <CalendarToday sx={{ fontSize:20, color:`${statusColor(s)}.main` }}/>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* search */}
      <TextField
        fullWidth
        placeholder="Search bookings…"
        value={query}
        onChange={e=>{setQuery(e.target.value); setPage(0);} }
        sx={{ mb:3 }}
        InputProps={{ startAdornment:(<InputAdornment position="start"><SearchIcon color="action"/></InputAdornment>) }}
      />

      {/* filters */}
      <Paper elevation={0} sx={{ mb:3, border:`1px solid ${alpha(theme.palette.divider,0.12)}`, borderRadius:2 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore/>}>
            <Box display="flex" alignItems="center" gap={1}>
              <FilterList/>
              <Typography variant="subtitle1" fontWeight={600}>
                Filters {activeFilterCount?`(${activeFilterCount})`:''}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={e=>handleFilter('status',e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {filterOptions.statuses.map(s=>(
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>City</InputLabel>
                  <Select
                    value={filters.city}
                    label="City"
                    onChange={e=>handleFilter('city',e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {filterOptions.cities.map(c=>(
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={3}>
                <Button
                  fullWidth variant="outlined" startIcon={<Clear/>}
                  onClick={()=>setFilters({ status:'all', city:'all' })}
                  disabled={!activeFilterCount}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* table */}
      <Paper elevation={0} sx={{ border:`1px solid ${alpha(theme.palette.divider,0.12)}`, borderRadius:2, overflow:'hidden' }}>
        <TableContainer sx={{ maxHeight:600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell sx={{ width:120 }}>Status</TableCell>
                <TableCell sx={{ width:140 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map(b=>(
                <Fade in key={b._id}>
                  <TableRow hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width:32,height:32, bgcolor:alpha(theme.palette.primary.main,0.1), color:'primary.main' }}>
                          {b.user?.name?.charAt(0).toUpperCase()||'?'}
                        </Avatar>
                        <Typography fontWeight={600}>{b.user?.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{b.property?.title}</TableCell>
                    <TableCell>
                      {new Date(b.date).toLocaleDateString()} {b.timeSlot}
                    </TableCell>
                    <TableCell>
                      <Chip label={b.status} color={statusColor(b.status)} size="small"/>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
  <Box display="flex" gap={1}>
    <Button
      size="small"
      variant="outlined"
      startIcon={<Visibility />}
      onClick={() => {
        setSelected(b);
        setDialogOpen(true);
      }}
    >
      View
    </Button>

    {b.status === 'approved' && (
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        startIcon={<Edit />}
        onClick={() => {
          setSelected(b);
          setTimeDialog(true);
          loadSlots();
        }}
      >
        Reschedule
      </Button>
    )}
  </Box>
</TableCell>

                  </TableRow>
                </Fade>
              ))}

              {!paginated.length && (
                <TableRow><TableCell colSpan={5}>
                  <Box display="flex" justifyContent="center" py={5}>
                    <Typography color="text.secondary">No bookings found</Typography>
                  </Box>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5,10,25]}
          component="div"
          count={filtered.length}
          rowsPerPage={rpp}
          page={page}
          onPageChange={(_,p)=>setPage(p)}
          onRowsPerPageChange={e=>{ setRPP(+e.target.value); setPage(0);} }
        />
      </Paper>

      {/* detail dialog */}
      <Dialog open={dialogOpen} onClose={()=>setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Booking Details
          {selected && (
            <Chip label={selected.status} color={statusColor(selected.status)} size="small" sx={{ ml:2 }}/>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>User</Typography>
                <Typography><strong>Name:</strong> {selected.user?.name}</Typography>
                <Typography><strong>Email:</strong> {selected.user?.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Property</Typography>
                <Typography><strong>Title:</strong> {selected.property?.title}</Typography>
                <Typography><strong>City:</strong> {selected.property?.location?.city}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Booking</Typography>
                <Typography><strong>Date:</strong> {new Date(selected.date).toLocaleDateString()}</Typography>
                <Typography><strong>Time Slot:</strong> {selected.timeSlot}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogOpen(false)}>Close</Button>
          {selected?.status==='pending' && (
            <>
              <Button color="error" disabled={processing} onClick={()=>updateStatus(selected._id,'rejected')}>
                {processing?<CircularProgress size={18}/>:'Reject'}
              </Button>
              <Button variant="contained" color="success" disabled={processing} onClick={()=>updateStatus(selected._id,'approved')}>
                {processing?<CircularProgress size={18}/>:'Approve'}
              </Button>
            </>
          )}
          {selected?.status==='approved' && (
            <>
              <Button color="secondary" startIcon={<Edit/>} onClick={()=>{ setDialogOpen(false); setTimeDialog(true); loadSlots(); }}>
                Reschedule
              </Button>
              <Button variant="contained" color="info" disabled={processing} onClick={()=>updateStatus(selected._id,'completed')}>
                {processing?<CircularProgress size={18}/>:'Mark Completed'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* reschedule dialog */}
      <Dialog open={timeDialog} onClose={()=>setTimeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center"><AccessTime sx={{ mr:1 }}/>Request Time Change</Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Current: {selected && new Date(selected.date).toLocaleDateString()} {selected?.timeSlot}
          </Typography>
          <TextField
            fullWidth multiline rows={3} label="Reason" value={reason}
            onChange={e=>setReason(e.target.value)} sx={{ mb:3 }}
          />
          <Typography variant="subtitle1" gutterBottom>Available Slots</Typography>
          {processing ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress/></Box>
          ) : availableSlots.length ? (
            <List dense>
              {availableSlots.map(s=>(
                <ListItem key={s} button onClick={()=>{
                  setSuggested(suggested.includes(s) ? suggested.filter(x=>x!==s) : [...suggested,s]);
                }}>
                  <ListItemIcon>
                    <Checkbox edge="start" checked={suggested.includes(s)} tabIndex={-1}/>
                  </ListItemIcon>
                  <ListItemText primary={s}/>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ py:2 }}>No slots found.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>{ setTimeDialog(false); setSuggested([]); setReason(''); }}>Cancel</Button>
          <Button
            variant="contained" disabled={!suggested.length||!reason||processing}
            onClick={requestChange}
          >
            {processing?<CircularProgress size={18}/>:'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingsTab;
