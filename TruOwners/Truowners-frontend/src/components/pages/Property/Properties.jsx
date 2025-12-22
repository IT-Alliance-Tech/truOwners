import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { API_CONFIG, buildApiUrl } from "../../../config/api";
import { handleApiError, getErrorMessage, validateApiResponse } from "../../../utils/errorHandler";
import PropertyCard from "../Home/PropertyCard";
import PropertyFilter from "../Home/PropertyFilter";
import AuthPromptModal from "../Home/AuthPromptModal";
import Login from "../Auth/Login";
import Register from "../Auth/SignUp";
import PropertyDetailsModal from "../Home/PropertyDetailsModal";
import {
  Box,
  Container,
  Typography,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Stack,
  Divider,
  Chip,
  Drawer,
  IconButton,
} from "@mui/material";
import {
  Home as HomeIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import FilterSidebar from "./FilterSidebar";
import BannerImg from "../../../assets/images/home/banner 1.png";

const PropertiesPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, token } = useAuth();

  // State management
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(() => parseInt(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);

  // Filter state - initialized from URL params to avoid initial unfiltered fetch
  const [filters, setFilters] = useState(() => ({
    propertyType: searchParams.get("propertyType") || "",
    city: searchParams.get("city") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    searchTerm: searchParams.get("search") || "",
    amenities: searchParams.get("amenities")
      ? searchParams.get("amenities").split(",").map((a) => a.trim())
      : [],
    title: searchParams.get("title") || "",
    rentRange: [
      parseInt(searchParams.get("minRent")) || 0,
      parseInt(searchParams.get("maxRent")) || 500000,
    ],
    budgetRange: [
      parseInt(searchParams.get("minBudget")) || 0,
      parseInt(searchParams.get("maxBudget")) || 30000000,
    ],
    status: searchParams.get("status") || "All"
  }));

  // Modal states
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);


  // Initialize filters from URL parameters ONLY when searchParams change
  useEffect(() => {
    const updatedFilters = {
      propertyType: searchParams.get("propertyType") || "",
      city: searchParams.get("city") || "",
      bedrooms: searchParams.get("bedrooms") || "",
      searchTerm: searchParams.get("search") || "",
      amenities: searchParams.get("amenities")
        ? searchParams.get("amenities").split(",").map((a) => a.trim())
        : [],
      title: searchParams.get("title") || "",
      rentRange: [
        parseInt(searchParams.get("minRent")) || 0,
        parseInt(searchParams.get("maxRent")) || 500000,
      ],
      budgetRange: [
        parseInt(searchParams.get("minBudget")) || 0,
        parseInt(searchParams.get("maxBudget")) || 30000000,
      ],
      status: searchParams.get("status") || "All"
    };

    setFilters(updatedFilters);
    setPage(parseInt(searchParams.get("page")) || 1);
  }, [searchParams]);

  // Fetch properties whenever filters or page changes
  useEffect(() => {
    const controller = new AbortController();
    fetchProperties(controller.signal);
    return () => controller.abort();
  }, [filters, page, isAuthenticated]);

  // Fetch wishlist when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchProperties = async (signal) => {
    setLoading(true);
    setError("");

    try {
      const headers = { "Content-Type": "application/json" };
      if (isAuthenticated && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Build query parameters
      const params = new URLSearchParams();

      if (filters.propertyType) params.append("propertyType", filters.propertyType);
      if (filters.city) params.append("city", filters.city);
      if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
      if (filters.searchTerm) params.append("search", filters.searchTerm);
      if (filters.amenities && filters.amenities.length > 0) params.append("amenities", filters.amenities.join(","));
      if (filters.title) params.append("title", filters.title);

      if (filters.rentRange[0] > 0) params.append("minRent", filters.rentRange[0]);
      if (filters.rentRange[1] < 500000) params.append("maxRent", filters.rentRange[1]);

      if (filters.budgetRange[0] > 0) params.append("minBudget", filters.budgetRange[0]);
      if (filters.budgetRange[1] < 30000000) params.append("maxBudget", filters.budgetRange[1]);

      if (filters.status && filters.status !== "All") params.append("status", filters.status);

      // Add pagination
      params.append("page", page.toString());
      params.append("limit", "12");

      const response = await fetch(
        `${buildApiUrl(API_CONFIG.USER.PROPERTIES)}?${params.toString()}`,
        { method: "GET", headers, signal }
      );

      let data;
      try {
        data = await response.json();
        validateApiResponse(data);
      } catch (parseError) {
        if (signal?.aborted) return;
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || handleApiError(null, response));
      }

      if (data.success) {
        setProperties(data.data.properties || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalProperties(data.data.totalProperties || 0);
      } else {
        throw new Error(getErrorMessage(data));
      }
      setMobileFilterOpen(false)
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Fetch properties error:", err);
      setError(err.message || "Failed to load properties. Please try again.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.USER.WISHLIST), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const ids = (data.data.wishlist || []).map(item => item.id)
          setWishlist(ids)
        }
      }
    } catch (err) {
      console.warn("Failed to fetch wishlist:", err);
    }
  };

  const handleWishlistToggle = async (propertyId) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      const isInWishlist = wishlist.includes(propertyId);
      const method = isInWishlist ? "DELETE" : "POST";

      const response = await fetch(
        buildApiUrl(`${API_CONFIG.USER.WISHLIST}/${propertyId}`),
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (isInWishlist) {
            setWishlist((prev) => prev.filter((id) => id !== propertyId));
          } else {
            setWishlist((prev) => [...prev, propertyId]);
          }
        }
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handleLoginRequired = () => {
    setShowLogin(true);
  };

  const handleAuthSuccess = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowAuthPrompt(false);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleCloseModals = () => {
    setShowAuthPrompt(false);
    setShowLogin(false);
    setShowRegister(false);
    setShowPropertyDetails(false);
    setSelectedProperty(null);
  };

  const handleFilterSearch = (queryString, updatedFilters) => {

    console.log(updatedFilters);

    // Update filters state
    const newFilters = {
      propertyType: updatedFilters.propertyType || "",
      city: updatedFilters.city || "",
      bedrooms: updatedFilters.bedrooms || "",
      searchTerm: updatedFilters.search || "",
      rentRange: updatedFilters.rentRange || [0, 500000],
      budgetRange: updatedFilters.budgetRange || [0, 30000000],
      amenities: updatedFilters.amenities || [],
      title: updatedFilters.title || "",
      status: updatedFilters.status || "All"
    };

    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change

    // Update URL parameters
    const newSearchParams = new URLSearchParams();
    if (newFilters.propertyType) newSearchParams.set("propertyType", newFilters.propertyType);
    if (newFilters.city) newSearchParams.set("city", newFilters.city);
    if (newFilters.bedrooms) newSearchParams.set("bedrooms", newFilters.bedrooms);
    if (newFilters.searchTerm) newSearchParams.set("search", newFilters.searchTerm);

    if (newFilters.rentRange[0] > 0) newSearchParams.set("minRent", newFilters.rentRange[0]);
    if (newFilters.rentRange[1] < 500000) newSearchParams.set("maxRent", newFilters.rentRange[1]);

    if (newFilters.budgetRange[0] > 0) newSearchParams.set("minBudget", newFilters.budgetRange[0]);
    if (newFilters.budgetRange[1] < 30000000) newSearchParams.set("maxBudget", newFilters.budgetRange[1]);

    if (newFilters.amenities && newFilters.amenities.length > 0) newSearchParams.set("amenities", newFilters.amenities.join(","));
    if (newFilters.title) newSearchParams.set("title", newFilters.title);
    if (newFilters.status && newFilters.status !== "All") newSearchParams.set("status", newFilters.status);

    setSearchParams(newSearchParams);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);

    // Update URL with new page
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set("page", newPage.toString());
    setSearchParams(newSearchParams);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentFilters = {
    propertyType: filters.propertyType,
    city: filters.city,
    bedrooms: filters.bedrooms,
    search: filters.searchTerm,
    amenities: filters.amenities,
    title: filters.title,
    budgetRange: filters.budgetRange,
    rentRange: filters.rentRange,
    status: filters.status
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const active = [];
    if (filters.propertyType) active.push({ key: 'propertyType', label: 'Property Type', value: filters.propertyType });
    if (filters.city) active.push({ key: 'city', label: 'City', value: filters.city });
    if (filters.bedrooms) active.push({ key: 'bedrooms', label: 'Bedrooms', value: `${filters.bedrooms} BHK` });
    if (filters.searchTerm) active.push({ key: 'search', label: 'Search', value: filters.searchTerm });
    if (filters.amenities && filters.amenities.length > 0) active.push({ key: 'amenities', label: 'amenities', value: filters.amenities.join(", ") });
    if (filters.title) active.push({ key: 'title', label: 'title', value: filters.title });

    if (filters.rentRange[0] > 0 || filters.rentRange[1] < 500000) {
      active.push({ key: 'rent', label: 'Rent Range', value: `₹${filters.rentRange[0].toLocaleString()} - ₹${filters.rentRange[1].toLocaleString()}` });
    }
    if (filters.budgetRange[0] > 0 || filters.budgetRange[1] < 30000000) {
      active.push({ key: 'budget', label: 'Budget Range', value: `₹${filters.budgetRange[0].toLocaleString()} - ₹${filters.budgetRange[1].toLocaleString()}` });
    }
    if (filters.status && filters.status !== "All") active.push({ key: 'status', label: 'status', value: filters.status });
    return active;
  };

  const clearAllFilters = () => {
    handleFilterSearch("", {
      propertyType: "",
      city: "",
      bedrooms: "",
      search: "",
      amenities: [],
      title: "",
      budgetRange: [0, 30000000],
      rentRange: [0, 500000],
      status: "All"
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Container maxWidth="xl">
        {/* Page Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Properties
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {totalProperties > 0
              ? `Found ${totalProperties} properties matching your criteria`
              : "Discover amazing properties from verified owners"}
          </Typography>
        </Box>

        {getActiveFilters().length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50', position: 'sticky', top: 0, zIndex: 10 }}>
            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
              <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                Active Filters:
              </Typography>
              {getActiveFilters().map((filter) => (
                <Chip
                  key={filter.key}
                  label={`${filter.label}: ${filter.value}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              ))}
              <Button
                size="small"
                onClick={clearAllFilters}
                sx={{ ml: 'auto' }}
              >
                Clear All
              </Button>
            </Stack>
          </Paper>
        )}



        <Grid container spacing={2} sx={{ mt: 2, display: "flex" }}>
          {/* Sidebar */}
          <Grid
            item
            xs={12}
            lg={3}
            sx={{
              display: {
                xs: "none",
                sm: "none",
                md: "none",
                lg: "none", // hide 1200–1275 too
                "@media (min-width:1276px)": {
                  display: "block", // show desktop filter only above 1276px
                },
              },


            }}
          // show only ≥1200px
          >
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderRadius: 2,
                position: "sticky",
                top: "80px",
              }}
            >
              <FilterSidebar
                initialFilters={{
                  propertyType: "",
                  city: "",
                  bedrooms: "",
                  search: "",
                  budgetRange: [0, 100000],
                  rentRange: [0, 50000],
                  amenities: [""],
                  title: "",
                }}
                currentFilters={currentFilters}
                onSearch={handleFilterSearch}
              />
            </Paper>
          </Grid>

          {/* Active Filters Display */}
          {/* Properties List */}
          <Grid item xs={12} md={6} sx={{
            maxWidth: {
              xs: "100%",
              md: "100%",
              "@media (min-width:1200px) and (max-width:1275px)": "100%",
              lg: "70%",
            },

            width: "100%",
            "@media (max-width:1275px)": {
              maxWidth: "100%",
            },
          }} width={"100%"}>
            <Box sx={{ mt: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', }}>
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Loading properties...
                  </Typography>
                </Box>
              ) : error ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <WarningIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                  <Typography variant="h5" color="error.main" gutterBottom>
                    Something went wrong
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    {error}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={fetchProperties}
                    startIcon={<SearchIcon />}
                  >
                    Try Again
                  </Button>
                </Paper>
              ) : properties.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <HomeIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
                  <Typography variant="h5" gutterBottom>
                    No properties found
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                    We couldn't find any properties matching your criteria. Try
                    adjusting your filters or search terms to see more results.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={clearAllFilters}
                    startIcon={<SearchIcon />}
                  >
                    Clear All Filters
                  </Button>
                </Paper>
              ) : (
                <>
                  {/* Properties Grid */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                      gap: 3,
                      mb: 4,
                      justifyContent: "center",
                      justifyItems: "center",
                      mx: "auto",
                      ml: { xs: 0, md: 4, lg: 6 }
                    }}
                  >

                    {/*{properties.map((property, index) => (
        <React.Fragment key={property.id}>
          <PropertyCard
            property={property}
            isInWishlist={wishlist.includes(property.id)}
            onWishlistToggle={() => handleWishlistToggle(property.id)}
            onClick={() => handlePropertyClick(property)}
            onLoginRequired={handleLoginRequired}
            isAuthenticated={isAuthenticated}
          />

          {(index + 1) % 2 === 0 && (
            <SearchAds key={`ad-${index}`} />
          )}
        </React.Fragment>
      ))}*/}
                    {properties.map((property, index) => (
                      <React.Fragment key={property.id}>
                        <PropertyCard
                          property={property}
                          isInWishlist={wishlist.includes(property.id)}
                          onWishlistToggle={() => handleWishlistToggle(property.id)}
                          onClick={() => handlePropertyClick(property)}
                          onLoginRequired={handleLoginRequired}
                          isAuthenticated={isAuthenticated}
                          postType={property?.listingType ?? "Rent"}
                        />
                        {/* Insert banner after the 2nd card (index === 1) */}
                        {index === 1 && (
                          <Box >
                            <img
                              src={BannerImg}
                              alt="Property Banner"
                              style={{
                                maxWidth: "320px",
                                borderRadius: "8px",
                                margin: "12px",
                              }}
                            />
                          </Box>
                        )}
                      </React.Fragment>
                    ))}
                  </Box>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontWeight: 600,
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Results Info */}
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {properties.length} of {totalProperties} properties
                      {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Floating Filter Button (Mobile Only) */}
      <Box
        sx={{
          position: 'fixed',
          top: 100,
          left: 15,
          zIndex: 2000,
          display: {
            xs: "flex",
            lg: "none",
            "@media (min-width:1200px) and (max-width:1275px)": {
              display: "flex"
            }

          }

        }}
      >

        <Box
          sx={{
            position: "fixed",
            top: 240,
            left: 15,
            zIndex: 2000,
            display: {
              xs: mobileFilterOpen ? "none" : "flex",
              sm: mobileFilterOpen ? "none" : "flex",
              md: mobileFilterOpen ? "none" : "flex",
              lg: mobileFilterOpen ? "none" : "flex",   // 1200–1275 also visible
              "@media (min-width:1276px)": {
                display: "none",                        // Hide only after 1276px
              },
            },

          }}
        >
          <button
            onClick={() => setMobileFilterOpen(true)}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#1976d2",
              border: "none",
              color: "white",
              fontSize: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            ☰
          </button>
        </Box>


      </Box>

      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        sx={{
          "@media (min-width:1276px)": {
            display: "none",
          },
          "& .MuiDrawer-paper": {
            width: "80%",
            maxWidth: "400px",
          },
        }}

        // ✅ This allows dropdowns to render in portals outside the drawer
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header with close button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            <IconButton
              onClick={() => setMobileFilterOpen(false)}
              edge="end"
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Scrollable filter content */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
            }}
          >
            <FilterSidebar
              initialFilters={{
                propertyType: "",
                city: "",
                bedrooms: "",
                search: "",
                budgetRange: [0, 100000],
                rentRange: [0, 50000],
                amenities: [""],
                title: "",
              }}
              currentFilters={currentFilters}
              onSearch={handleFilterSearch}
            // onSearch={(data) => {
            //   console.log(data);

            //   handleFilterSearch(data);
            //   setMobileFilterOpen(false);
            // }}
            />
          </Box>
        </Box>
      </Drawer>


      {/* Modals */}
      {showAuthPrompt && <AuthPromptModal onClose={handleCloseModals} />}

      {showLogin && (
        <Login
          onClose={handleCloseModals}
          onSwitchToSignUp={handleSwitchToRegister}
        />
      )}

      {showRegister && (
        <Register
          onClose={handleCloseModals}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}

      {showPropertyDetails && selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={handleCloseModals}
          isInWishlist={wishlist.includes(selectedProperty.id)}
          onWishlistToggle={() => handleWishlistToggle(selectedProperty.id)}
          isAuthenticated={isAuthenticated}
          onAuthPrompt={() => setShowAuthPrompt(true)}
        />
      )}
    </Box>
  );
};

export default PropertiesPage;