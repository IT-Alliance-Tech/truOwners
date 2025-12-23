// PropertyFilters.jsx - Updated with amenities and area on separate line
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
  Slider,
  Typography,
  Button,
  Grid,
  Paper,
  Collapse,
  IconButton,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: "#2F80ED",
  height: 4,
  "& .MuiSlider-thumb": {
    backgroundColor: "#2F80ED",
    height: 20,
    width: 20,
  },
  "& .MuiSlider-track": {
    backgroundColor: "#2F80ED",
  },
  "& .MuiSlider-rail": {
    backgroundColor: "#e0e0e0",
  },
}));

const PropertyFilters = ({
  filters,
  onFiltersChange,
  totalProperties,
  properties = [],
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rentRange, setRentRange] = useState([0, 500000]); // RENT ONLY
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const listingType = filters.status || "rent";

  // Extract unique values from properties for autocomplete
  const uniqueLocations = [
    ...new Set(
      properties
        .map((p) => {
          if (typeof p.location === "string") return p.location;
          if (p.location?.city) return p.location.city;
          if (p.location?.address) return p.location.address;
          return "";
        })
        .filter(Boolean)
    ),
  ];

  const uniqueCities = [
    ...new Set(properties.map((p) => p.location?.city || "").filter(Boolean)),
  ];

  const uniqueStates = [
    ...new Set(properties.map((p) => p.location?.state || "").filter(Boolean)),
  ];

  const availableAmenities = [
    "WiFi",
    "Parking",
    "Gym",
    "Swimming Pool",
    "Security",
    "Elevator",
    "Balcony",
    "Garden",
    "Furnished",
    "Air Conditioning",
    "Heating",
    "Laundry",
    "Pet Friendly",
    "Near Metro",
    "Shopping Mall",
    "Hospital",
  ];

  const propertyTypes = [
    { value: "all", label: "All Types" },
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "villa", label: "Villa" },
    { value: "studio", label: "Studio" },
    { value: "penthouse", label: "Penthouse" },
    { value: "duplex", label: "Duplex" },
  ];

  useEffect(() => {
    if (!properties.length) return;

    if (listingType === "rent") {
      const rents = properties
        .filter((p) => p.listingType === "rent")
        .map((p) => Number(p.rent) || 0);

      const minRent = rents.length ? Math.min(...rents) : 0;
      setRentRange([minRent, 500000]);
    }

    if (listingType === "sell" || listingType === "lease") {
      const prices = properties
        .filter((p) => p.listingType !== "rent")
        .map((p) => Number(p.price) || 0);

      const minPrice = prices.length ? Math.min(...prices) : 0;
      setPriceRange([minPrice, 50000000]);
    }
  }, [properties, listingType]);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };
  const handleRentRangeChange = (event, newValue) => {
    setRentRange(newValue);

    handleFilterChange("rentRange", {
      min: newValue[0],
      max: newValue[1],
    });

    handleFilterChange("minRent", newValue[0]);
    handleFilterChange("maxRent", newValue[1]);
  };
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);

    handleFilterChange("priceRange", {
      min: newValue[0],
      max: newValue[1],
    });

    handleFilterChange("minBudget", newValue[0]);
    handleFilterChange("maxBudget", newValue[1]);
  };

  // const handlePriceRangeChange = (event, newValue) => {
  //   setPriceRange(newValue);
  //   handleFilterChange("priceRange", { min: newValue[0], max: newValue[1] });
  // };

  const handleAmenitiesChange = (event) => {
    const value = event.target.value;
    handleFilterChange(
      "amenities",
      typeof value === "string" ? value.split(",") : value
    );
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      location: "",
      city: "",
      state: "",
      listingType: "rent",
      propertyType: "all",
      rentRange: { min: 0, max: 500000 },
      maxBudget: "",
      priceRange: { min: 0, max: 50000000 },
      bedrooms: "any",
      bathrooms: "any",
      amenities: [],
      minArea: "",
      maxArea: "",
    };
    onFiltersChange(clearedFilters);
    setRentRange([0, 500000]);
    setPriceRange([0, 50000000]);
  };

  return (
    <FilterPaper>
      {/* Top Row - Search and Property Type */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by title, description, or location..."
              value={filters.searchTerm || ""}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleFilterChange("searchTerm", "")}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  height: "40px",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Property Type</InputLabel>
              <Select
                value={filters.propertyType || "all"}
                onChange={(e) =>
                  handleFilterChange("propertyType", e.target.value)
                }
                label="Property Type"
                sx={{ height: "40px" }}
              >
                {propertyTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s",
                  }}
                />
              }
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{
                height: "40px",
                borderRadius: "8px",
                textTransform: "none",
                borderColor: "#2F80ED",
                color: "#2F80ED",
                "&:hover": {
                  borderColor: "#2F80ED",
                  backgroundColor: "rgba(47, 128, 237, 0.04)",
                },
              }}
            >
              Advanced Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 2 }}>
          {/* First Advanced Filter Row */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            {/* Location/Address */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Location/Address"
                value={filters.location || ""}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" sx={{ fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { height: "40px" } }}
              />
            </Grid>

            {/* City */}
            <Grid item xs={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={filters.city || ""}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { height: "40px" } }}
              />
            </Grid>

            {/* State */}
            <Grid item xs={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label="State"
                value={filters.state || ""}
                onChange={(e) => handleFilterChange("state", e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { height: "40px" } }}
              />
            </Grid>

            {/* Rent Range */}
            {listingType !== "rent" && (
              <Grid item xs={12} md={3}>
                <Box sx={{ px: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "12px", color: "#666" }}
                  >
                    Price Range: ₹{priceRange[0].toLocaleString()} - ₹
                    {priceRange[1].toLocaleString()}
                  </Typography>

                  <StyledSlider
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    min={0}
                    max={50000000}
                    step={100000}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `₹${v.toLocaleString()}`}
                  />
                </Box>
              </Grid>
            )}

            {/* Bedrooms */}
            <Grid item xs={6} md={3}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  minWidth: 150, // widen the field
                  "& .MuiInputLabel-root": {
                    overflow: "visible", // let the whole word show
                    whiteSpace: "nowrap",
                  },
                  "& .MuiInputLabel-shrink": {
                    // floated (shrunk) state
                    transform: "translate(14px,-6px) scale(0.75)",
                  },
                }}
              >
                <InputLabel>Bedrooms</InputLabel>
                <Select
                  value={filters.bedrooms || "any"}
                  onChange={(e) =>
                    handleFilterChange("bedrooms", e.target.value)
                  }
                  label="Bedrooms"
                  sx={{ height: "40px" }}
                >
                  <MenuItem value="any">Any</MenuItem>
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="4">4</MenuItem>
                  <MenuItem value="5">5+</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Bathrooms */}
            <Grid item xs={6} md={3}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  minWidth: 150, // widen the field
                  "& .MuiInputLabel-root": {
                    overflow: "visible", // let the whole word show
                    whiteSpace: "nowrap",
                  },
                  "& .MuiInputLabel-shrink": {
                    // floated (shrunk) state
                    transform: "translate(14px,-6px) scale(0.75)",
                  },
                }}
              >
                <InputLabel>Bathrooms</InputLabel>
                <Select
                  value={filters.bathrooms || "any"}
                  onChange={(e) =>
                    handleFilterChange("bathrooms", e.target.value)
                  }
                  label="Bathrooms"
                  sx={{ height: "40px" }}
                >
                  <MenuItem value="any">Any</MenuItem>
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="4">4+</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Min Area */}
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Min Area (sq ft)"
                type="number"
                value={filters.minArea || ""}
                onChange={(e) => handleFilterChange("minArea", e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { height: "40px" } }}
              />
            </Grid>

            {/* Max Area */}
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Max Area (sq ft)"
                type="number"
                value={filters.maxArea || ""}
                onChange={(e) => handleFilterChange("maxArea", e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { height: "40px" } }}
              />
            </Grid>
          </Grid>

          {/* Second Advanced Filter Row - Area and Amenities */}
          <Grid container spacing={2} alignItems="center">
            {/* Amenities */}
            <Grid item xs={12} md={30}>
              <Autocomplete
                multiple
                size="small"
                options={availableAmenities}
                value={filters.amenities}
                onChange={(_, v) => handleFilterChange("amenities", v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      size="small"
                      sx={{ backgroundColor: "#2F80ED", color: "#fff" }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Amenities"
                    placeholder="Select…"
                  />
                )}
                sx={{ minWidth: 240 }}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* Bottom Row - Results and Clear */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          pt: 2,
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#2F80ED" }}>
          {totalProperties} properties found
        </Typography>
        <Button
          variant="text"
          color="error"
          startIcon={<ClearIcon />}
          onClick={clearAllFilters}
          sx={{
            textTransform: "none",
            fontSize: "14px",
          }}
        >
          Clear All Filters
        </Button>
      </Box>
    </FilterPaper>
  );
};

export default PropertyFilters;
