import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  TablePagination,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  useTheme,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Avatar,
  Divider,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { buildApiUrl, API_CONFIG } from "../../../config/api";

const InquiriesTab = () => {
  const theme = useTheme();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRPP] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog State
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchInquiries = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("adminToken");

      const res = await fetch(buildApiUrl(API_CONFIG.ADMIN.INQUIRIES), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Fetch failed");
      setInquiries(json.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch inquiries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setStatusLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        buildApiUrl(`${API_CONFIG.ADMIN.INQUIRIES}/${id}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const json = await res.json();

      if (json.success) {
        setInquiries((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: newStatus } : item
          )
        );
        setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
      } else {
        alert(json.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filtered = useMemo(() => {
    if (!query) return inquiries;
    const q = query.toLowerCase();
    return inquiries.filter(
      (i) =>
        i.name?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q) ||
        i.phone?.toLowerCase().includes(q) ||
        i.message?.toLowerCase().includes(q)
    );
  }, [inquiries, query]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  const handleOpenDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedInquiry(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "NEW":
        return "error";
      case "REVIEWED":
        return "primary";
      case "CONTACTED":
        return "warning";
      case "CLOSED":
        return "success";
      default:
        return "default";
    }
  };

  if (loading && !refreshing && inquiries.length === 0)
    return (
      <Box display="flex" justifyContent="center" py={5}>
        <CircularProgress size={32} />
      </Box>
    );

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Inquiries
        </Typography>

        <Tooltip title="Refresh Data">
          <IconButton
            onClick={fetchInquiries}
            disabled={refreshing}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <RefreshIcon color="primary" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          value={query}
          placeholder="Search by customer name, email, phone..."
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
        px={1}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Showing {paginated.length} of {filtered.length} inquiries
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}
              >
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Interested In</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Message Preview</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.map((i) => (
                <Fade in key={i._id}>
                  <TableRow hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5} py={1}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: "0.875rem",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                          }}
                        >
                          {i.name?.charAt(0).toUpperCase() || (
                            <PersonIcon fontSize="small" />
                          )}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ lineHeight: 1.2 }}
                          >
                            {i.name || "N/A"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            ID: {i._id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
                          <Typography variant="caption">{i.email}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhoneIcon
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
                          <Typography variant="caption">{i.phone}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={i.interestedIn}
                        variant="outlined"
                        color="secondary"
                        sx={{ fontWeight: 500, borderRadius: 1 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "text.secondary",
                        }}
                      >
                        {i.message}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={i.status}
                        color={getStatusColor(i.status)}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          height: 20,
                          textTransform: "lowercase",
                          px: 0.5,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={
                          <VisibilityIcon
                            sx={{ fontSize: "1rem !important" }}
                          />
                        }
                        onClick={() => handleOpenDetails(i)}
                        sx={{
                          textTransform: "none",
                          borderRadius: 1.5,
                          py: 0.2,
                          fontSize: "0.75rem",
                        }}
                      >
                        VIEW
                      </Button>
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
          onRowsPerPageChange={(e) => {
            setRPP(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Inquiry Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight={700}>
              Inquiry Details
            </Typography>
            <Chip
              label={selectedInquiry?.status}
              color={getStatusColor(selectedInquiry?.status)}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {selectedInquiry && (
            <Stack spacing={3}>
              <Grid
                container
                spacing={2}
                alignItems="flex-start"
                justifyContent="space-between"
              >
                <Grid item>
                  <Box sx={{ minWidth: 100 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mb: 0.5,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Name
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "text.primary",
                      }}
                    >
                      {selectedInquiry.name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Box sx={{ minWidth: 100 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mb: 0.5,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Interested In
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "text.primary",
                      }}
                    >
                      {selectedInquiry.interestedIn}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Stack spacing={1} alignItems="flex-end" sx={{ mt: 0.5 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.9rem", fontWeight: 500 }}
                      >
                        {selectedInquiry.email}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.9rem", fontWeight: 500 }}
                      >
                        {selectedInquiry.phone}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Message
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {selectedInquiry.message}
                  </Typography>
                </Paper>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Manage Status
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Update Status</InputLabel>
                    <Select
                      value={selectedInquiry.status}
                      label="Update Status"
                      onChange={(e) =>
                        updateStatus(selectedInquiry._id, e.target.value)
                      }
                      disabled={statusLoading}
                    >
                      <MenuItem value="NEW">NEW</MenuItem>
                      <MenuItem value="REVIEWED">REVIEWED</MenuItem>
                      <MenuItem value="CONTACTED">CONTACTED</MenuItem>
                      <MenuItem value="CLOSED">CLOSED</MenuItem>
                    </Select>
                  </FormControl>
                  {statusLoading && <CircularProgress size={20} />}
                </Box>
              </Box>

              <Box
                display="flex"
                alignItems="center"
                gap={1}
                color="text.secondary"
              >
                <EventIcon fontSize="inherit" />
                <Typography variant="caption">
                  Received on{" "}
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDetails}
            variant="contained"
            disableElevation
            fullWidth
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InquiriesTab;
