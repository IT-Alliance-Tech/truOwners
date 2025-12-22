const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Wishlist = require("../models/Wishlist");
const { PROPERTY_STATUS, BOOKING_STATUS } = require("../utils/constants");

// Get all published properties
const getAllProperties = async (req, res) => {
  try {
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Page number must be greater than 0",
        },
        data: null,
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Limit must be between 1 and 100",
        },
        data: null,
      });
    }

    // Build filter query
    let status = req.query.status || PROPERTY_STATUS.PUBLISHED;
    if (status === "All") {
      status = PROPERTY_STATUS.PUBLISHED;
    }
    const filterQuery = { status };

    // Rent filters (range)
    if (req.query.minRent || req.query.maxRent) {
      filterQuery.rent = {};
      if (req.query.minRent) {
        filterQuery.rent.$gte = parseInt(req.query.minRent);
      }
      if (req.query.maxRent) {
        filterQuery.rent.$lte = parseInt(req.query.maxRent);
      }
    }

    // Deposit/Budget filters (range)
    if (
      req.query.minBudget ||
      req.query.maxBudget ||
      req.query.minDeposit ||
      req.query.maxDeposit
    ) {
      filterQuery.deposit = {};
      const min = req.query.minBudget || req.query.minDeposit;
      const max = req.query.maxBudget || req.query.maxDeposit;
      if (min) {
        filterQuery.deposit.$gte = parseInt(min);
      }
      if (max) {
        filterQuery.deposit.$lte = parseInt(max);
      }
    }

    // Property type filter
    if (req.query.propertyType) {
      filterQuery.propertyType = req.query.propertyType;
    }

    // Bedrooms filter
    if (req.query.bedrooms) {
      filterQuery.bedrooms = parseInt(req.query.bedrooms);
    }

    // Bathrooms filter
    if (req.query.bathrooms) {
      filterQuery.bathrooms = parseInt(req.query.bathrooms);
    }

    // Area filter (range)
    if (req.query.minArea || req.query.maxArea) {
      filterQuery.area = {};
      if (req.query.minArea) {
        filterQuery.area.$gte = parseInt(req.query.minArea);
      }
      if (req.query.maxArea) {
        filterQuery.area.$lte = parseInt(req.query.maxArea);
      }
    }

    // Amenities filter (contains any of the specified amenities)
    if (req.query.amenities) {
      const amenitiesArray = Array.isArray(req.query.amenities)
        ? req.query.amenities
        : req.query.amenities.split(",").map((a) => a.trim());
      filterQuery.amenities = { $in: amenitiesArray };
    }

    // Location and search filters
    const searchConditions = [];

    if (req.query.city) {
      const cityRegex = { $regex: req.query.city, $options: "i" };
      searchConditions.push({
        $or: [
          { "location.city": cityRegex },
          { "location.address": cityRegex },
        ],
      });
    }

    if (req.query.address) {
      searchConditions.push({
        "location.address": { $regex: req.query.address, $options: "i" },
      });
    }

    if (req.query.state) {
      searchConditions.push({
        "location.state": { $regex: req.query.state, $options: "i" },
      });
    }

    // Text search filter (searches in title and description)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };
      searchConditions.push({
        $or: [{ title: searchRegex }, { description: searchRegex }],
      });
    }

    if (searchConditions.length > 0) {
      filterQuery.$and = searchConditions;
    }

    // Sorting options
    let sortQuery = { createdAt: -1 }; // Default sort by newest
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case "rent_asc":
          sortQuery = { rent: 1 };
          break;
        case "rent_desc":
          sortQuery = { rent: -1 };
          break;
        case "area_asc":
          sortQuery = { area: 1 };
          break;
        case "area_desc":
          sortQuery = { area: -1 };
          break;
        case "price_asc":
          sortQuery = { price: 1 };
          break;
        case "price_desc":
          sortQuery = { price: -1 };
          break;
        case "newest":
          sortQuery = { createdAt: -1 };
          break;
        case "oldest":
          sortQuery = { createdAt: 1 };
          break;
        default:
          sortQuery = { createdAt: -1 };
      }
    }

    // Get total count for pagination metadata
    const totalProperties = await Property.countDocuments(filterQuery);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProperties / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Fetch properties with filters, pagination, and sorting
    const properties = await Property.find(filterQuery)
      .populate("owner")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Properties retrieved successfully",
        properties: properties.map((property) => ({
          id: property._id,
          title: property.title,
          description: property.description,
          location: property.location,
          rent: property.rent,
          deposit: property.deposit,
          listingType: property.listingType,
          price: property.price,
          propertyType: property.propertyType,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          amenities: property.amenities,
          images: property.images,
          status: property.status,
          owner: property.owner
            ? {
                id: property.owner._id,
                name: property.owner.name,
                phone: property.owner.phone,
              }
            : null,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        })),
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalProperties: totalProperties,
          propertiesPerPage: limit,
          propertiesOnCurrentPage: properties.length,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
        appliedFilters: {
          minRent: req.query.minRent || null,
          maxRent: req.query.maxRent || null,
          minDeposit: req.query.minDeposit || null,
          maxDeposit: req.query.maxDeposit || null,
          propertyType: req.query.propertyType || null,
          bedrooms: req.query.bedrooms || null,
          bathrooms: req.query.bathrooms || null,
          minArea: req.query.minArea || null,
          maxArea: req.query.maxArea || null,
          amenities: req.query.amenities || null,
          address: req.query.address || null,
          city: req.query.city || null,
          state: req.query.state || null,
          search: req.query.search || null,
          sortBy: req.query.sortBy || "newest",
        },
      },
    });
  } catch (error) {
    console.error("Get all properties error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

const getPropertyById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id ? req.user._id.toString() : null;

  try {
    // fetch property
    const property = await Property.findById(id).lean();
    if (!property) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Property not found" },
        data: null,
      });
    }

    // fetch bookings
    const bookings = await Booking.find({ property: id })
      .select("_id user date timeSlot status")
      .lean();

    const bookedSlots = bookings.map((b) => ({
      id: b._id,
      date: b.date,
      timeSlot: b.timeSlot,
      status: b.status,
      bookedByCurrentUser: !!(b.user && b.user.toString() === userId),
    }));

    // target count
    const SIMILAR_LIMIT = 5;
    let candidates = [];

    // step 1: same city + rent range
    // step 1: same city + rent/price range
    let priceOrRent =
      property.listingType === "rent" ? property.rent : property.price;
    const fieldToCheck = property.listingType === "rent" ? "rent" : "price";

    const rangeFilter = {};
    if (priceOrRent) {
      rangeFilter[fieldToCheck] = {
        $gte: priceOrRent * 0.8,
        $lte: priceOrRent * 1.2,
      };
    }

    candidates = await Property.find({
      _id: { $ne: property._id },
      "location.city": property.location.city,
      propertyType: property.propertyType,
      listingType: property.listingType,
      ...rangeFilter,
      status: "published",
    }).lean();

    // step 2: same city (ignore rent) if fewer than 5
    if (candidates.length < SIMILAR_LIMIT) {
      const extra = await Property.find({
        _id: { $ne: property._id },
        "location.city": property.location.city,
        propertyType: property.propertyType,
        listingType: property.listingType,
        status: "published",
      }).lean();

      candidates = [...candidates, ...extra];
    }

    // step 3: any city (fallback) if still fewer than 5
    if (candidates.length < SIMILAR_LIMIT) {
      const extra = await Property.find({
        _id: { $ne: property._id },
        propertyType: property.propertyType,
        listingType: property.listingType,
        status: "published",
      }).lean();

      candidates = [...candidates, ...extra];
    }

    // sort by rent difference (closest first)
    // sort by price/rent difference (closest first)
    candidates = candidates.sort((a, b) => {
      const valA = a[fieldToCheck] || 0;
      const valB = b[fieldToCheck] || 0;
      const target = priceOrRent || 0;
      return Math.abs(valA - target) - Math.abs(valB - target);
    });

    // take top 5
    const similarProperties = candidates.slice(0, SIMILAR_LIMIT);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Property retrieved successfully",
        property,
        bookingInfo: {
          userHasBooking: bookedSlots.some((s) => s.bookedByCurrentUser),
          bookedSlots,
        },
        similarProperties,
      },
    });
  } catch (error) {
    console.error("Get property by ID error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Add property to wishlist
const addToWishlist = async (req, res) => {
  const { propertyId } = req.body;

  try {
    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Property ID is required",
        },
        data: null,
      });
    }

    // Check if property exists and is published
    const property = await Property.findById(propertyId);
    if (!property || property.status !== PROPERTY_STATUS.PUBLISHED) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Property not found or not available",
        },
        data: null,
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    let isNewProperty = true;

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        properties: [propertyId],
      });
    } else {
      if (!wishlist.properties.includes(propertyId)) {
        wishlist.properties.push(propertyId);
      } else {
        isNewProperty = false;
      }
    }

    await wishlist.save();
    await wishlist.populate("properties");

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: isNewProperty
          ? "Property added to wishlist successfully"
          : "Property already in wishlist",
        wishlist: {
          id: wishlist._id,
          user: wishlist.user,
          properties: wishlist.properties.map((prop) => ({
            id: prop._id,
            title: prop.title,
            location: prop.location,
            rent: prop.rent,
            listingType: prop.listingType,
            price: prop.price,
            images: prop.images,
          })),
          totalItems: wishlist.properties.length,
        },
        isNewProperty,
      },
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Book site visit
const bookSiteVisit = async (req, res) => {
  const { propertyId, visitDate, message } = req.body;

  try {
    if (!propertyId || !visitDate) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Property ID and visit date are required",
        },
        data: null,
      });
    }

    const property = await Property.findById(propertyId);
    if (!property || property.status !== PROPERTY_STATUS.PUBLISHED) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Property not found or not available for booking",
        },
        data: null,
      });
    }

    // Check if user already has a pending booking for this property
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      property: propertyId,
      status: BOOKING_STATUS.PENDING,
    });

    if (existingBooking) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message:
            "You already have a pending site visit request for this property",
        },
        data: null,
      });
    }

    const booking = new Booking({
      user: req.user._id,
      property: propertyId,
      visitDate,
      message: message || "",
      status: BOOKING_STATUS.PENDING,
    });

    await booking.save();
    await booking.populate(["user", "property"]);

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: {
        message: "Site visit booked successfully",
        booking: {
          id: booking._id,
          user: {
            id: booking.user._id,
            name: booking.user.name,
            email: booking.user.email,
          },
          property: {
            id: booking.property._id,
            title: booking.property.title,
            location: booking.property.location,
          },
          visitDate: booking.visitDate,
          status: booking.status,
          message: booking.message,
          createdAt: booking.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Book site visit error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Unlock owner contact
const unlockOwnerContact = async (req, res) => {
  const { propertyId } = req.body;

  try {
    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Property ID is required",
        },
        data: null,
      });
    }

    const property = await Property.findById(propertyId).populate({
      path: "owner",
      populate: {
        path: "user",
        select: "name email phone",
      },
    });

    if (!property) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Property not found",
        },
        data: null,
      });
    }

    if (property.status !== PROPERTY_STATUS.PUBLISHED) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Property is not available",
        },
        data: null,
      });
    }

    // Mock payment processing
    // In a real app, you would integrate with a payment gateway here
    const paymentSuccessful = true; // Mock payment success

    if (paymentSuccessful) {
      res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          message: "Owner contact unlocked successfully",
          ownerContact: {
            name: property.owner.user.name,
            email: property.owner.user.email,
            phone: property.owner.user.phone || property.owner.phone,
          },
          property: {
            id: property._id,
            title: property.title,
            location: property.location,
          },
        },
      });
    } else {
      res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Payment processing failed. Please try again.",
        },
        data: null,
      });
    }
  } catch (error) {
    console.error("Unlock owner contact error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("property")
      .sort({ createdAt: -1 });

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Bookings retrieved successfully",
        bookings: bookings.map((booking) => ({
          id: booking._id,
          property: {
            id: booking.property._id,
            title: booking.property.title,
            location: booking.property.location,
            rent: booking.property.rent,
            images: booking.property.images,
          },
          visitDate: booking.visitDate,
          status: booking.status,
          message: booking.message,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        })),
        totalBookings: bookings.length,
        statusBreakdown: {
          pending: bookings.filter((b) => b.status === BOOKING_STATUS.PENDING)
            .length,
          approved: bookings.filter((b) => b.status === BOOKING_STATUS.APPROVED)
            .length,
          rejected: bookings.filter((b) => b.status === BOOKING_STATUS.REJECTED)
            .length,
          completed: bookings.filter(
            (b) => b.status === BOOKING_STATUS.COMPLETED
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Get user wishlist
const getUserWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "properties"
    );

    const wishlistData = wishlist
      ? {
          id: wishlist._id,
          user: wishlist.user,
          properties: wishlist.properties.map((property) => ({
            id: property._id,
            title: property.title,
            description: property.description,
            location: property.location,
            rent: property.rent,
            deposit: property.deposit,
            listingType: property.listingType,
            price: property.price,
            propertyType: property.propertyType,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            amenities: property.amenities,
            images: property.images,
            status: property.status,
            createdAt: property.createdAt,
          })),
          totalItems: wishlist.properties.length,
          createdAt: wishlist.createdAt,
          updatedAt: wishlist.updatedAt,
        }
      : {
          properties: [],
          totalItems: 0,
        };

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Wishlist retrieved successfully",
        wishlist: wishlistData,
      },
    });
  } catch (error) {
    console.error("Get user wishlist error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Remove property from wishlist
const removeFromWishlist = async (req, res) => {
  const { propertyId } = req.body;

  try {
    if (!propertyId) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Property ID is required",
        },
        data: null,
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Wishlist not found",
        },
        data: null,
      });
    }

    const propertyIndex = wishlist.properties.indexOf(propertyId);
    if (propertyIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Property not found in wishlist",
        },
        data: null,
      });
    }

    wishlist.properties.splice(propertyIndex, 1);
    await wishlist.save();
    await wishlist.populate("properties");

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Property removed from wishlist successfully",
        wishlist: {
          id: wishlist._id,
          user: wishlist.user,
          properties: wishlist.properties.map((prop) => ({
            id: prop._id,
            title: prop.title,
            location: prop.location,
            rent: prop.rent,
            listingType: prop.listingType,
            price: prop.price,
            images: prop.images,
          })),
          totalItems: wishlist.properties.length,
        },
      },
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

module.exports = {
  getAllProperties,
  addToWishlist,
  removeFromWishlist,
  bookSiteVisit,
  unlockOwnerContact,
  getUserBookings,
  getUserWishlist,
  getPropertyById,
};
