// src/components/PropertyFilter.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeIcon from "@mui/icons-material/Home";
import BedIcon from "@mui/icons-material/Bed";

// ======== Constants ========
const propertyTypes = [
  { label: "All Types", value: "" },
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Villa", value: "villa" },
  { label: "Studio", value: "studio" },
  { label: "Commercial", value: "commercial" },
];

const bedroomOptions = [
  { label: "Any", value: "" },
  { label: "1 BHK", value: "1" },
  { label: "2 BHK", value: "2" },
  { label: "3 BHK", value: "3" },
  { label: "4 BHK", value: "4" },
  { label: "5+ BHK", value: "5" },
];

const defaultFilters = {
  status: "",
  propertyType: "",
  city: "",
  bedrooms: "",
  maxBudget: "",
  search: "",
};

// ======== Styled Components ========
const StyledTabs = styled(Tabs)(({ theme }) => ({
  "& .MuiTabs-flexContainer": {
    display: "flex",
    justifyContent: "center",
    // flexWrap: "wrap",  
    [theme.breakpoints.down(568)]: {
      flexDirection: "column",
      alignItems: "center",
    },
    [theme.breakpoints.down(992)]: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
      justifyContent: "center",
      alignItems: "center",
    },
  },
  "& .MuiTabs-indicator": {
    display: "none",
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minWidth: "160px",
  fontWeight: "700",
  textTransform: "uppercase",
  fontSize: "14px",
  borderRadius: "12px 12px 0 0",
  color: theme.palette.text.secondary,
  backgroundColor: "#f8f9fa",
  "&.Mui-selected": {
    backgroundColor: "#1976d2",
    color: "white",
    fontWeight: "800",
  },
  "@media (max-width:568px)": {
    minWidth: "250px",
  },
}));

const StyledTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    transition: "all 0.3s ease",
    width: "100%",
    height: "40px",
    maxWidth: "170px",
  },
  "& .MuiInputLabel-root": {
    display: "none",
  },
}));

const StyledButton = styled(Button)(() => ({
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: "800",
  fontSize: "14px",
  height: "40px",
  borderRadius: "12px",
  "&:hover": {
    backgroundColor: "#1565c0",
  },
}));

const SectionLabel = styled(Typography)(() => ({
  fontWeight: "700",
  fontSize: "12px",
  color: "#666",
  textTransform: "uppercase",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
}));

// ======== Component ========
export default function PropertyFilter({ initialFilters = {}, currentFilters = {}, onSearch }) {
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    ...initialFilters,
  }));

  // Map status to tab index
  const getStatusTabIndex = (status) => {
    switch (status) {
      case "rent":
        return 1;
      case "sale":
      case "sell": // Backend uses 'sell'
        return 2;
      case "lease":
        return 3;
      case "commercial":
        return 4;
      default:
        return 0;
    }
  };

  const [statusTab, setStatusTab] = useState(getStatusTabIndex(filters.status));

  const lastSearchRef = useRef("");
  const isInitialMount = useRef(true);

  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (!isInitialMount.current && Object.keys(currentFilters).length > 0) {
      console.log("PropertyFilter: Syncing currentFilters", currentFilters);
      setFilters((prev) => ({
        ...prev,
        ...currentFilters,
      }));
      const newTabIndex = getStatusTabIndex(currentFilters.status);
      console.log("PropertyFilter: Setting tab index to", newTabIndex, "for status", currentFilters.status);
      setStatusTab(newTabIndex);
    }
  }, [currentFilters]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (filters.search.trim() && filters.search !== lastSearchRef.current) {
        handleSearchClick();
      }
    }, 500);
    return () => clearTimeout(delay);
  }, );

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (event, newValue) => {
    setStatusTab(newValue);
    // Backend expects 'sell' not 'sale'
    const statusMap = ["All", "rent", "sell", "lease", "commercial"];
    const newStatus = statusMap[newValue];
    setFilters((prev) => ({ ...prev, status: newStatus }));
  };

  const handleSearchClick = () => {
    const params = new URLSearchParams();

    console.log("PropertyFilter: handleSearchClick called with filters", filters);

    // Map status to listingType for backend compatibility
    if (filters.status && filters.status !== "All") {
      params.append("listingType", filters.status);
    }
    if (filters.propertyType) params.append("propertyType", filters.propertyType);
    if (filters.city) params.append("city", filters.city);
    if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
    if (filters.search) params.append("search", filters.search);
    if (filters.maxBudget) params.append("maxBudget", filters.maxBudget);

    lastSearchRef.current = filters.search;

    console.log("PropertyFilter: Calling onSearch with params:", params.toString());
    console.log("PropertyFilter: Calling onSearch with filters:", filters);
    onSearch(params.toString(), filters);
  };

  return (
    <div>
      {/* Status Tabs */}
      <StyledTabs
        value={statusTab}
        onChange={handleTabChange}
        centered
        sx={{ display: { xs: "none", lg: "flex" } }}
      >
        <StyledTab label="ALL STATUS" />
        <StyledTab label="FOR RENT" />
        <StyledTab label="FOR SALE" />
        <StyledTab label="FOR LEASE" />
        <StyledTab label="FOR COMMERCIAL" />
      </StyledTabs>

      {/* Filters */}
      <Grid
        container
        spacing={3}
        sx={{
          p: 4,
          justifyContent: "center",
          alignItems: "end",
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* Property Type */}
        <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: "none", lg: "block" } }}>
          <SectionLabel>
            <HomeIcon sx={{ fontSize: 16 }} />
            LOOKING FOR
          </SectionLabel>
          <StyledTextField
            select
            fullWidth
            value={filters.propertyType}
            onChange={(e) => handleChange("propertyType", e.target.value)}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) =>
                value || <span style={{ color: "#9e9e9e" }}>PROPERTY TYPE</span>,
            }}
          >
            {propertyTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </StyledTextField>
        </Grid>

        {/* Location */}
        <Grid item xs={12} sm={8} lg={3}>
          <SectionLabel>
            <LocationOnIcon sx={{ fontSize: 16 }} />
            LOCATION
          </SectionLabel>
          <StyledTextField
            fullWidth
            value={filters.city}
            onChange={(e) => handleChange("city", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon sx={{ color: "#999", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            placeholder="ALL CITIES"
          />
        </Grid>

        {/* Bedrooms */}
        <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: "none", lg: "block" } }}>
          <SectionLabel>
            <BedIcon sx={{ fontSize: 16 }} />
            PROPERTY SIZE
          </SectionLabel>
          <StyledTextField
            select
            fullWidth
            value={filters.bedrooms}
            onChange={(e) => handleChange("bedrooms", e.target.value)}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) =>
                value ? `${value} BHK` : <span style={{ color: "#9e9e9e" }}>BEDROOMS</span>,
            }}
          >
            {bedroomOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </StyledTextField>
        </Grid>

        {/* Budget */}
        <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: "none", lg: "block" } }}>
          <SectionLabel>
            <BedIcon sx={{ fontSize: 16 }} />
            YOUR BUDGET
          </SectionLabel>
          <StyledTextField
            fullWidth
            value={filters.maxBudget}
            onChange={(e) => handleChange("maxBudget", e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            placeholder={"MAX PRICE"}
          />
        </Grid>

        {/* Search Button */}
        <Grid item xs={12} sm={4} lg={2}>
          <StyledButton variant="contained" fullWidth onClick={handleSearchClick}>
            Search
          </StyledButton>
        </Grid>
      </Grid>
    </div>
  );
}
