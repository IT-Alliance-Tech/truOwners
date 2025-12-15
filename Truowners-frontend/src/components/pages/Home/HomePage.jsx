import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../../../context/AuthContext'
import { buildApiUrl, API_CONFIG } from '../../../config/api'
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler'
import PropertyCard from './PropertyCard'
import PropertyFilters from './PropertyFilters'
import AuthPromptModal from './AuthPromptModal'
import Login from '../Auth/Login'
import Register from '../Auth/SignUp'
import PropertyDetailsModal from './PropertyDetailsModal'
import SubscriptionAdBanner from './SubscriptionAdBanner'
import './HomePage.css'
import CountUp from 'react-countup';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { FaArrowRight } from "react-icons/fa";
import { Box, Grid, Typography, Card, CardMedia, CardContent, Button } from "@mui/material";
import { motion } from "framer-motion";
import villaImg from '/src/assets/images/villa.jpg'
import aprtmentImg from '/src/assets/images/apartment.jpg'
import singleImg from '/src/assets/images/single.jpg'
import studioImg from '/src/assets/images/studio.jpg'
import shopImg from '/src/assets/images/shop.jpg'
import officeImg from '/src/assets/images/office.jpg'
import indepenImg from '/src/assets/images/indepen.jpg'
import truOwnersLogo from '../../../assets/images/logo-Copy.jpg';
import icon1 from '../../../assets/images/Icon(1).png';
import icon2 from '../../../assets/images/Icon(2).png';
import icon3 from '../../../assets/images/Icon(3).png';
// import Button from '@mui/material/Button';
// import AddAlertIcon from '@mui/icons-material/AddAlert';
// import AccountCircleSharp from '@mui/icons-material/AccountCircleSharp';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
// import { useEffect, useRef, useState } from "react";
// import React, { useState, useEffect, useRef } from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import per2 from '../../../assets/images/2.png';
import per1 from '../../../assets/images/1.png';
import per3 from '../../../assets/images/3.png';
import per4 from '../../../assets/images/4.png';
import per5 from '../../../assets/images/5.png';
const Counter = ({ target, label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const end = target;
      const duration = 2000; // ms
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setCount(Math.floor(start));
      }, 16);
    }
  }, [isVisible, target]);
  return (
    <div className="counter-item" ref={ref}>
      <h2 className="counter-number">{count}</h2>
      <p className="counter-label">{label}</p>
    </div>
  );
};
const properties = [
  { title: "Villa", count: 28, img: "/villa.jpg" },
  { title: "Apartment", count: 12, img: "/apartment.jpg" },
  { title: "Independent house", count: 32, img: "/independent.jpg" },
  { title: "Studio", count: 18, img: "/studio.jpg" },
  { title: "Single Family Room", count: 32, img: "/single.jpg" },
  { title: "Office", count: 32, img: "/office.jpg" },
  { title: "Shop", count: 18, img: "/shop.jpg" },
];
const testimonials = [
  {
    name: 'Rahul Mehta',
    role: 'Tenant, Jayanagar',
    text: 'House hunting in Bangalore used to be exhausting until I found TruOwners. The platform’s filters helped me find exactly what I was looking for, and within a week, I got my perfect 2BHK — without paying a single rupee in brokerage. The listings were genuine, and the owner I contacted was polite and transparent. The whole experience saved me time, money, and stress. I’ll definitely use TruOwners again in the future!',
    image: per1,
  },
  {
    name: 'Sneha Reddy',
    role: 'Landlord, Electronic City',
    text: 'When I had to move my family from Nagpur to Pune, I was worried about the hassle of finding a good home. TruOwners made the process incredibly smooth. Their relationship manager guided me from start to finish, helping me shortlist flats, arrange visits, and even get the rental agreement done. There were no hidden charges, and I only dealt with genuine property owners. It saved me from the headache of brokers completely!',
    image: per2,
  },
  {
    name: 'Vikram Sharma',
    role: 'Tenant, Whitefield',
    text: 'As a student, finding an affordable and safe place near my college was tough — until I used TruOwners. Within just two days, I found a PG that fit my budget perfectly. The entire process was transparent, quick, and stress-free. I didn’t have to deal with any random broker calls or inflated prices. TruOwners is a real lifesaver for students like me who want a straightforward and affordable rental experience.',
    image: per3,
  },
  {
    name: 'Ananya Iyer',
    role: 'Tenant, Indiranagar',
    text: 'I’ve tried several property portals before, but TruOwners stands out because it only connects you to verified owners. I didn’t receive any spam calls or have to deal with pushy agents. I directly spoke with the property owner, negotiated a fair rent, and closed the deal within a few days. The process saved me a lot of time and money, and I would recommend it to anyone who wants a genuine, broker-free experience.',
    image: per5,
  },
  {
    name: 'Amitabh Singh',
    role: 'Landlord, Koramangala',
    text: 'We were looking to rent out our apartment without going through agents, and TruOwners was the perfect solution. Within just 4 days, we found verified tenants who met all our requirements. The listing process was simple, the tenants were genuine, and the platform handled everything smoothly. Best of all, we saved on heavy brokerage fees. It was a stress-free experience, and we’ll definitely use TruOwners again when needed.',
    image: per4,
  },
];
const HomePage = () => {
  const sliderSettings = {
    dots: true,           // show navigation dots
    infinite: true,       // loop slides
    speed: 500,           // transition speed
    slidesToShow: 2,      // number of slides visible
    slidesToScroll: 1,    // slides per scroll
    autoplay: true,       // enable autoplay
    autoplaySpeed: 2000,  // 2 seconds per slide
    arrows: true,        // hide arrows if you want
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ]
  };
  const [activeTab, setActiveTab] = useState("Rent");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();
  const tabs = ["Rent", "Buy", "Sell", "Commercial"];
  const [showAll, setShowAll] = useState(false);
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [wishlist, setWishlist] = useState([])
  // Update the initial filters state in HomePage.jsx
  const [filters, setFilters] = useState({
    searchTerm: '',
    location: '',
    city: '',
    state: '',
    propertyType: 'all',
    priceRange: { min: 0, max: 100000 },
    bedrooms: 'any',
    bathrooms: 'any',
    amenities: [],
    minArea: '',
    maxArea: ''
  });
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const { user, isAuthenticated, token } = useAuth()
  useEffect(() => {
    fetchProperties()
    if (isAuthenticated) {
      fetchWishlist()
    }
  }, [isAuthenticated])
  useEffect(() => {
    console.log('Total properties from API:', properties.length);
    console.log('Filtered properties:', filteredProperties.length);
    console.log('Properties data:', properties);
  }, [properties, filteredProperties]);
  useEffect(() => {
    if (isAuthenticated) {
      const propertyToView = localStorage.getItem('propertyToView')
      if (propertyToView) {
        localStorage.removeItem('propertyToView')
        // Navigate to property details page instead of showing modal
        window.open(`/property/${propertyToView}`, '_blank')
      }
    }
  }, [isAuthenticated, properties])
  useEffect(() => {
    applyFilters()
  }, [properties, filters, searchTerm, sortBy])
  const fetchProperties = async () => {
    setLoading(true)
    setError('')
    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(buildApiUrl(API_CONFIG.USER.PROPERTIES), {
        method: 'GET',
        headers
      })
      let data
      try {
        data = await response.json()
        validateApiResponse(data)
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }
      if (!response.ok) {
        throw new Error(data.error || handleApiError(null, response))
      }
      if (data.success) {
        setProperties(data.data.properties || [])
      } else {
        throw new Error(getErrorMessage(data))
      }
    } catch (err) {
      console.error('Fetch properties error:', err)
      setError(err.message || 'Failed to load properties. Please try again.')
    } finally {
      setLoading(false)
    }
  }
const handleSearch = () => {
  console.log("Property Type:", filters.propertyType);
  console.log("Bedrooms:", filters.bedrooms);
  console.log("Type:", activeTab); // ✅ This is what you were missing

  // Navigate to properties page with query params
  navigate(
    `/properties?propertyType=${filters.propertyType}&bedrooms=${filters.bedrooms}&listingType=${activeTab}`
  );
};
  const fetchWishlist = async () => {
    if (!isAuthenticated || !token) return

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.USER.WISHLIST), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWishlist(data.data.wishlist || [])
        }
      }
    } catch (err) {
      console.warn('Failed to fetch wishlist:', err)
    }
  }
  const handleWishlistToggle = async (propertyId) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true)
      return
    }
    try {
      const isInWishlist = wishlist.includes(propertyId)
      const method = isInWishlist ? 'DELETE' : 'POST'
      const response = await fetch(buildApiUrl(`${API_CONFIG.USER.WISHLIST}/${propertyId}`), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          if (isInWishlist) {
            setWishlist(prev => prev.filter(id => id !== propertyId))
          } else {
            setWishlist(prev => [...prev, propertyId])
          }
        }
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err)
    }
  }
  const handlePropertyClick = (property) => {
    setSelectedProperty(property)
    setShowPropertyDetails(true)
  }
  // NEW: Handle login requirement for view details
  const handleLoginRequired = () => {
    setShowLogin(true)
  }
  // NEW: Handle successful login
  const handleAuthSuccess = () => {
    setShowLogin(false)
    setShowRegister(false)
    setShowAuthPrompt(false)
  }
  // NEW: Switch between login and register
  const handleSwitchToRegister = () => {
    setShowLogin(false)
    setShowRegister(true)
  }
  const handleSwitchToLogin = () => {
    setShowRegister(false)
    setShowLogin(true)
  }
  // Update the applyFilters function in HomePage.jsx
  const applyFilters = () => {
    let filtered = [...properties];
    // Search term filter - searches in title, description, and location
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(property => {
        const titleMatch = property.title?.toLowerCase().includes(searchLower);
        const descMatch = property.description?.toLowerCase().includes(searchLower);
        const locationMatch = getLocationString(property.location).toLowerCase().includes(searchLower);
        const cityMatch = property.location?.city?.toLowerCase().includes(searchLower);
        const addressMatch = property.location?.address?.toLowerCase().includes(searchLower);
        return titleMatch || descMatch || locationMatch || cityMatch || addressMatch;
      });
    }
    // Location filter
    if (filters.location) {
      filtered = filtered.filter(property => {
        const locationString = getLocationString(property.location).toLowerCase();
        const address = property.location?.address?.toLowerCase() || '';
        return locationString.includes(filters.location.toLowerCase()) ||
          address.includes(filters.location.toLowerCase());
      });
    }
    // City filter
    if (filters.city) {
      filtered = filtered.filter(property =>
        property.location?.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    // State filter
    if (filters.state) {
      filtered = filtered.filter(property =>
        property.location?.state?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }
    // Property type filter
    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(property =>
        property.propertyType?.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }
    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(property => {
        const rent = parseFloat(property.rent) || 0;
        return rent >= filters.priceRange.min && rent <= filters.priceRange.max;
      });
    }
    // Bedrooms filter
    if (filters.bedrooms && filters.bedrooms !== 'any') {
      const bedroomCount = parseInt(filters.bedrooms);
      filtered = filtered.filter(property => {
        const propBedrooms = parseInt(property.bedrooms) || 0;
        return filters.bedrooms === '5' ? propBedrooms >= 5 : propBedrooms === bedroomCount;
      });
    }
    // Bathrooms filter
    if (filters.bathrooms && filters.bathrooms !== 'any') {
      const bathroomCount = parseInt(filters.bathrooms);
      filtered = filtered.filter(property => {
        const propBathrooms = parseInt(property.bathrooms) || 0;
        return filters.bathrooms === '4' ? propBathrooms >= 4 : propBathrooms === bathroomCount;
      });
    }
    // Area filter
    if (filters.minArea || filters.maxArea) {
      filtered = filtered.filter(property => {
        const area = parseFloat(property.area) || 0;
        const minArea = parseFloat(filters.minArea) || 0;
        const maxArea = parseFloat(filters.maxArea) || Infinity;
        return area >= minArea && area <= maxArea;
      });
    }
    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(property =>
        filters.amenities.every(amenity =>
          (property.amenities || []).some(propAmenity =>
            propAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      );
    }
    setFilteredProperties(filtered);
  };
  const getLocationString = (location) => {
    if (typeof location === 'string') {
      return location
    }
    if (location && typeof location === 'object') {
      if (location.address) return location.address
      if (location.street) return location.street
      if (location.city && location.state) return `${location.city}, ${location.state}`
      return 'Location not specified'
    }
    return 'Location not specified'
  }
  const handleCloseModals = () => {
    setShowAuthPrompt(false)
    setShowLogin(false)
    setShowRegister(false)
    setShowPropertyDetails(false)
    setSelectedProperty(null)
  }
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
    )
  }
  
  return (
    <>
      <div className="homepage">
        <div className="container">
          {/* 🌟 Premium Subscription Banner */}
          <SubscriptionAdBanner />
          
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="whole-con" >
              <Container>
                <div className="container2">
                  {/* Row 1 */}
                  <div className=" row12">
                    <div className=" half2 heading2">
                      <h2>
                        We make it easy for <span className="highlight2">tenants</span> and{" "}
                        <span className="highlight2">landlords</span>.
                      </h2>
                    </div>
                    <div className=" half2 paragraph2">
                      <p>
                        Whether it’s selling your current home, getting financing, or buying
                        a new home, we make it easy and efficient. The best part? You’ll
                        save a bunch of money and time with our services.
                      </p>
                    </div>
                  </div>
                  {/* Row 2 - Slider */}
                  <div className="slider-wrapper" >
                    <Slider {...sliderSettings}>
                      <div className="slide">
                        <div className="card-g  bg-col1">
                          <div className="row-g">
                            <div className="col-left">
                                <img src={icon1} style={{ width: '50px' }} />
                            </div>
                            <div className="col-right">
                              <h3>Verified Listings
                              </h3>
                              <p>You can communicate directly with landlords and we provide you with virtual tour before you buy/rent property.</p>
                            </div>

                          </div>
                        </div>
                      </div>
                      <div className="slide"> <div className="card-g bg-col2">
                        <div className="row-g">
                          <div className="col-left">
                           <img src={icon2} style={{ width: '50px' }} />
                          </div>
                          <div className="col-right">
                            <h3>Find the best deal</h3>
                            <p style={{ color: '#000' }}>Browse thousands of properties, save your favorites and set up search alerts so you don’t miss the best home deal!</p>
                          </div>

                        </div>
                      </div></div>
                      <div className="slide"> <div className="card-g bg-col3">
                        <div className="row-g">
                          <div className="col-left">
                             <img src={icon3} style={{ width: '50px' }} />
                          </div>
                          <div className="col-right">
                            <h3>Get ready to apply</h3>
                            <p>Find your dream house? You just need to do a little to no effort and you can start move in to your new dream home!</p>
                          </div>

                        </div>
                      </div></div>
                    </Slider>
                  </div>
                  {/* Row 3 - Counters */}
                  <div className="counter-section">
                    <Counter target={7.4} label="Property Return Rate" />
                    <Counter target={3798} label="Property in Sell & Rent" style={{
                      borderLeft: "2px solid #ccc",
                      borderRight: "2px solid #ccc"
                    }} />
                    <Counter target={2095} label="Daily Completed Transactions" />
                  </div>
                </div>

              </Container>
            </div>
          </motion.section>

         <motion.section 
           className="res-sec"
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, delay: 0.2 }}
         >
  <div
    style={{
      textAlign: "center",
      padding: "50px 0 0 0",
      width: "70%",
      margin: "0 auto",
    }}
  >
    <p className="head-size" style={{ fontSize: "50px" }}>Residential</p>
    <p
      className="para-pad"
      style={{ paddingBottom: "50px", fontSize: "16px" }}
    >
      Find your dream home with Tru Owners. Explore a wide range of verified
      residential listings including apartments, villas, plots, and independent
      houses.
    </p>
  </div>
  
  <div className="container-image">
    {/* Left Column */}
    <div className="left-col">
      {propertyData.leftCol.map((row, rowIndex) => (
        <div key={rowIndex} className="row1">
          {row.map((item, index) => (
            <div
              key={index}
              className={`img-box ${item.size}`}
              style={{ backgroundImage: `url(${item.backgroundImage})` }}
              onClick={() =>
                navigate(
                  `/properties?propertyType=${item.propertyType.toLowerCase()}&listingType=${activeTab.toLowerCase()}`
                )
              }
            >
              <div className="overlay-1">
                <h4>{item.propertyType}</h4>
                <p style={{ fontWeight: 600, fontStyle: 'italic', marginTop: '5px' }}>
                  {item.listingType}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
    {/* Right Column */}
    <div className="right-col">
      {/* Independent House */}
      <div
        className="img-box full-height"
        style={{
          backgroundImage: `url(${propertyData.rightCol.independent.backgroundImage})`,
        }}
        onClick={() =>
          navigate(
            `/properties?propertyType=${propertyData.rightCol.independent.propertyType.toLowerCase()}&listingType=${activeTab.toLowerCase()}`
          )
        }
      >
        <div className="overlay-1">
          <h4>{propertyData.rightCol.independent.propertyType}</h4>
          <p style={{ fontWeight: 600, fontStyle: 'italic', marginTop: '5px' }}>
            {propertyData.rightCol.independent.listingType}
          </p>
        </div>
      </div>

      {/* Commercial Text Box */}
      <div className="text-box">
        <h2>{propertyData.rightCol.commercial.heading}</h2>
       
        <p>{propertyData.rightCol.commercial.description}</p>
      </div>
    </div>
  </div>
</motion.section>

</div>

          {/* Properties Grid */}
          <motion.div 
            className="properties-section" 
            style={{ background: 'linear-gradient(180deg, #E1EDFF 0%, rgba(255, 255, 255, 0.14) 100%)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="properties-header" >
              {/* Commented section kept as is */}
              <h2>Based on your location</h2>
              <p>Some of our picked properties near you location.</p>
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
                      location: '',
                      propertyType: 'all',
                      priceRange: { min: 0, max: 10000 },
                      bedrooms: 'any',
                      amenities: []
                    })
                    setSearchTerm('')
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="properties-grid">
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <PropertyCard
                      property={property}
                      // isInWishlist={wishlist.includes(property.id)}
                      onWishlistToggle={() => handleWishlistToggle(property.id)}
                      onClick={() => handlePropertyClick(property)}
                      onLoginRequired={handleLoginRequired}
                      isAuthenticated={isAuthenticated}
                    />
                  </motion.div>
                ))}
              </div>
            )}
            <div className="button-color">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate(`/properties?city=bengaluru`)}
                sx={{
                  mt: 1,
                  pt: 1,
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  borderRadius: "8px",
                  maxWidth: "10rem",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                SHOW MORE
              </Button>
            </div>

          </motion.div>
          <motion.section 
            className="about-cta"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="three-column-layout">
              {/* Column 3 (Form) */}
              <div className="column form-column" >
                <form >
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', }}>
                    <img src={truOwnersLogo} alt="TruOwners Logo" style={{ width: '200px' }} />

                    <label className='title-color' >VIEW LISTINGS</label>
                  </div>
                  {/* <select>
          <option>Select</option>
        </select> */}
                  {/* <label className='title-color1'>Information</label> */}
                  {/* <input type="text" placeholder="I'm a" /> */}
                  <input type="text" placeholder="NAME" />
                  {/* <input type="text" placeholder="Last Name" /> */}
                  <input type="email" placeholder="EMAIL ADDRESS" />
                  <input type="number" placeholder="PHONE NUMBER" />
                  {/* 
 <input type="text" placeholder="LOCATION" /> */}
                  <textarea placeholder="HELLO, I AM INTERESTED IN 2 BHK 2ND FLOOR, NORTH FACING MAIN DOOR, 32000 RENT." rows="4"></textarea>
                  {/* <label>Property</label> */}
                  <select >
                    <option value="">INTERESTED IN</option>
                    <option value="SELL">SELL</option>
                    <option value="RENT">RENT</option>
                    <option value="LEASE">LEASE</option>
                  </select>
                  <label style={{ color: '#000' }}>
                    <input type="checkbox" /> By submitting this form I agree to Terms of Use
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', columnGap: '20px' }}>
                    <button type="submit" class="submit-btn mar-btn" style={{ width: "50%" }}>SEND MESSAGE</button>
                    <button type="submit" class="submit-btn mar-btn" style={{ width: "50%" }}>CALL</button>
                  </div>
                  <div className='whatsapp-btn'>
                    <button type="submit" class="submit-btn mar-btn1" >WHATSAPP</button>
                  </div>
                </form>
              </div>
              {/* Column 1 */}
              <div className="column center1">
                <div className="section12">
                  <h3>Putting a plan to action,
                    to assure your satisfaction! </h3>
                  <p>
                    Every property listed on our platform is thoroughly verified for authenticity, location accuracy, and pricing—so you can rent or buy with complete confidence.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
          <motion.div
            style={{
              width: '100%',
              background: 'linear-gradient(180deg, #E1EDFF 0%, rgba(255, 255, 255, 0.14) 100%)'
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="testimonial-slider-container">
              <h2
                className="slider-title"
                style={{
                  textAlign: 'center',
                  marginBottom: '10px',
                  fontSize: '40px',
                  color: '#000'
                }}
              >
              What Our Happy Customers Say
              </h2>
              <p
                style={{
                  textAlign: 'center',
                  marginBottom: '40px',
                  fontSize: '16px',
                  color: '#000',
                  opacity: '60%'
                }}
              >
                See what our property managers, landlords, and tenants have to say
              </p>

              <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                spaceBetween={30}
                slidesPerView={1}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false
                }}
                loop={true}
                navigation={true} // ✅ Enables arrows
                breakpoints={{
                  640: { slidesPerView: 1 },
                  1024: { slidesPerView: 1 }
                }}
                style={{ padding: '20px' }}
              >
                {testimonials.map((testimonial, index) => (
                  <SwiperSlide
                    key={index}
                    style={{
                      height: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div className="div-test"
                      style={{
                        borderRadius: '10px',
                        padding: '30px',
                        height: '250px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <p
                        style={{
                          fontSize: '16px',
                          lineHeight: '1.6',
                          marginBottom: '20px',
                          flexGrow: 1
                        }}
                      >
                        "{testimonial.text}"
                      </p>

                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginBottom: '10px'
                        }}
                      />

                      <h4
                        style={{
                          margin: '0',
                          fontSize: '1.1rem',
                          color: '#000'
                        }}
                      >
                        {testimonial.name}
                      </h4>
                      <p
                        style={{
                          margin: '5px 0 0',
                          fontSize: '0.9rem',
                          color: '#000',
                          opacity: '60%'
                        }}
                      >
                        {testimonial.role}
                      </p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </motion.div>
      </div>
      

      {/* Modals */}
      {showAuthPrompt && (
        <AuthPromptModal onClose={handleCloseModals} />
      )}

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
          // isInWishlist={wishlist.includes(selectedProperty.id)}
          onWishlistToggle={() => handleWishlistToggle(selectedProperty.id)}
          isAuthenticated={isAuthenticated}
          onAuthPrompt={() => setShowAuthPrompt(true)}
        />
      )}
    </>
  )
}
export default HomePage
const propertyData = {
  leftCol: [
    [
      { propertyType: "Villa", listingType: "Rent", backgroundImage: villaImg, size: "w75" },
      { propertyType: "Apartment", listingType: "Sale", backgroundImage: aprtmentImg, size: "w25" },
    ],
    [
      { propertyType: "Studio", listingType: "Lease", backgroundImage: studioImg, size: "w25" },
      { propertyType: "Single Family Room", listingType: "Rent", backgroundImage: singleImg, size: "w75" },
    ],
    [
      { propertyType: "Office", listingType: "Commercial", backgroundImage: officeImg, size: "w75" },
      { propertyType: "Shop", listingType: "Commercial", backgroundImage: shopImg, size: "w25" },
    ],
  ],
  rightCol: {
    independent: {
      propertyType: "Independent House",
      listingType: "Rent", // ✅ Add the type here
      backgroundImage: indepenImg,
    },
    commercial: {
      heading: "Commercial",
      description:
        "Unlock high-potential spaces for your business or investment. Tru Owners offers a trusted selection of commercial properties.",
    },
  },
};


