import React, { useEffect, useState, useRef } from "react";
import "./home.css";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import headerImage from "../../../assets/images/home/banner.png"; // ✅ corrected path
import search from "../../../assets/images/home/search.svg";
import useScreenSize from "../../helper/userScreenSize.jsx";
import PropertyTypeSelect from "../search-screen/propertyTypeSelect.jsx";
import { BudgetFilter } from "../search-screen/budgetFilter.jsx";
import SearchBar from "../search-screen/searchBar.jsx";
import { useNavigate } from "react-router-dom";
import PropertyFilters from "./PropertyFilters.jsx";
import PropertyFilter from "./PropertyFilter.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { API_CONFIG, buildApiUrl } from "../../../config/api.js";
import { validateApiResponse } from "../../../utils/errorHandler.js";
import PropertyCard from "./PropertyCard.jsx";
import { Button } from "@mui/material";
import AuthPromptModal from "./AuthPromptModal.jsx";
import Login from "../Auth/Login.jsx";
import Register from "../Auth/SignUp";
import PropertyDetailsModal from "./PropertyDetailsModal.jsx";
import { motion } from "framer-motion";

const HomeHeaderContainer = ({ activeBtn = "all", activeTab, setActiveTab }) => {
  const width = useScreenSize();
  const navigate = useNavigate();
  const [searchedItems, setSearchedItems] = useState("");
  let locationData = "Bangalore";

  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const { user, isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [postType, setPostType] = useState(null);

  const [filters, setFilters] = useState({
    status: "All",
    propertyType: "",
    city: "",
    bedrooms: "",
    searchTerm: "",
    maxBudget: "",
  });

  useEffect(() => {
    fetchProperties();
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, filters]);

  useEffect(() => {
    if (isAuthenticated) {
      const propertyToView = localStorage.getItem("propertyToView");
      if (propertyToView) {
        localStorage.removeItem("propertyToView");
        window.open(`/property/${propertyToView}`, "_blank");
      }
    }
  }, [isAuthenticated, properties]);

  useEffect(() => {
    applyFilters();
  }, [properties, searchTerm, sortBy]);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.propertyType) params.append("propertyType", filters.propertyType);
      if (filters.city) params.append("city", filters.city);
      if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
      if (filters.searchTerm) params.append("search", filters.searchTerm);
      if (filters.maxBudget) params.append("maxBudget", filters.maxBudget);

        console.log(params.toString(), "params");

      const response = await fetch(
        `${buildApiUrl(API_CONFIG.USER.PROPERTIES)}?${params.toString()}`,
        {
          method: "GET",
          headers,
        }
      );

      let data;
      try {
        data = await response.json();
        validateApiResponse(data);
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch properties");
      }

      if (data.success) {
        setProperties(data.data.properties || []);
      }
    } catch (err) {
      console.error("Fetch properties error:", err);
      setError(err.message || "Failed to load properties. Please try again.");
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
          const ids = (data.data.wishlist || []).map((item) => item.id);
          setWishlist(ids);
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

  const applyFilters = () => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = properties.filter((property) => {
        const titleMatch = property.title?.toLowerCase().includes(searchLower);
        const descMatch = property.description?.toLowerCase().includes(searchLower);
        const locationMatch = getLocationString(property.location)
          .toLowerCase()
          .includes(searchLower);
        return titleMatch || descMatch || locationMatch;
      });
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  };

  const getLocationString = (location) => {
    if (typeof location === "string") return location;
    if (location && typeof location === "object") {
      if (location.address) return location.address;
      if (location.street) return location.street;
      if (location.city && location.state) return `${location.city}, ${location.state}`;
      return "Location not specified";
    }
    return "Location not specified";
  };

  const handleCloseModals = () => {
    setShowAuthPrompt(false);
    setShowLogin(false);
    setShowRegister(false);
    setShowPropertyDetails(false);
    setSelectedProperty(null);
  };

  if (loading) {
    return (
      <div className="homepage">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner large"></div>
            <p>Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ✅ HERO SECTION */}
      <motion.div 
        className="position-relative row g-0 justify-content-center cursor_pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <img
          className="home_header_image"
          src={headerImage}
          alt="hero_banner"
          style={{
            width: "100%",
            height: "400px",
            objectFit: "cover",
          }}
        />
      </motion.div>

      {/* ✅ FILTER SECTION — removed mt-3 (margin-top) */}
      <motion.div
        className={`home_filter_main_container card border-0 p-1 mt-0 bg-transparent`}
        style={{ marginTop: "0 !important" }}
        initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0.9 }}
        animate={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className={width < 576 ? "pb-2" : "card-body"}>
          <div className="search-filter-container">
            <PropertyFilter
              initialFilters={{
                status: "",
                propertyType: "",
                city: "",
                bedrooms: "",
                search: "",
                maxBudget: "",
              }}
              currentFilters={filters}
              onSearch={(queryString, updatedFilters) => {
                setFilters({
                  ...filters,
                  status: updatedFilters.status,
                  propertyType: updatedFilters.propertyType,
                  city: updatedFilters.city,
                  bedrooms: updatedFilters.bedrooms,
                  searchTerm: updatedFilters.search,
                  rentRange: updatedFilters.rentRange,
                  maxBudget: updatedFilters.maxBudget,
                });
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* ✅ Properties Section */}
      <div className="properties-section sec-top">
        <div className="properties-header">
          <h2>Featured Properties</h2>
          <p>Browse through our verified listings</p>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="empty-properties">
            <div className="empty-icon">🏠</div>
            <h3>No properties match your criteria</h3>
            <p>Try adjusting your filters or search terms to see more results.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setFilters({
                  status: "All",
                  propertyType: "",
                  city: "",
                  bedrooms: "",
                  searchTerm: "",
                  rentRange: [0, 50000],
                  depositRange: [0, 100000],
                });
                setSearchTerm("");
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="properties-grid">
            {filteredProperties.slice(0, 6).map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PropertyCard
                  property={property}
                  isInWishlist={wishlist.includes(property.id)}
                  onWishlistToggle={() => handleWishlistToggle(property.id)}
                  onClick={() => handlePropertyClick(property)}
                  onLoginRequired={handleLoginRequired}
                  isAuthenticated={isAuthenticated}
                  postType={property?.post_type ?? "Rent"}
                />
              </motion.div>
            ))}
          </div>
        )}
        <div className="home-showMore d-flex justify-content-center mb-4">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() =>
              navigate(`/properties?${new URLSearchParams(filters).toString()}`)
            }
            sx={{
              mt: 3,
              fontWeight: 600,
              borderRadius: "8px",
              maxWidth: "10rem",
              display: "flex",
              justifyContent: "center",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            SHOW MORE
          </Button>
        </div>
      </div>

      {/* ✅ Modals */}
      {showAuthPrompt && <AuthPromptModal onClose={handleCloseModals} />}
      {showLogin && (
        <Login onClose={handleCloseModals} onSwitchToSignUp={handleSwitchToRegister} />
      )}
      {showRegister && (
        <Register onClose={handleCloseModals} onSwitchToLogin={handleSwitchToLogin} />
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
    </div>
  );
};

export default HomeHeaderContainer;
