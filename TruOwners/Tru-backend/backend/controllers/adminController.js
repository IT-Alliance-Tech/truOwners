const mongoose = require("mongoose");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Owner = require("../models/Owner");
const { PROPERTY_STATUS, BOOKING_STATUS } = require("../utils/constants");
const UserSubscription = require("../models/UserSubscription");
const PropertyView = require("../models/PropertyView");

// ------------------------
// COMMON HELPERS
// ------------------------

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isFilled = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  value.trim().toLowerCase() !== "pending";

const getUserFullName = (user) => {
  if (!user) return null;
  if (user.name) return user.name;
  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return null;
};

const formatBasicOwner = (owner) => {
  if (!owner) return null;
  const user = owner.user || {};
  const name = owner.name || getUserFullName(user) || null;
  const email = owner.email || user.email || null;
  const phone = owner.phone || user.phone || owner.mobile || null;
  const verified =
    typeof owner.verified === "boolean" ? owner.verified : !!user.verified;
  return {
    id: owner._id,
    name,
    email,
    phone,
    verified,
  };
};

const formatOwnerWithIdProof = (property) => {
  const owner = property.owner || null;
  const user = owner?.user || {};

  const details = property.ownerDetails || {};

  const name = isFilled(details.name)
    ? details.name
    : owner?.name || getUserFullName(user) || "";

  const email = isFilled(details.email)
    ? details.email
    : owner?.email || user.email || "";

  const phone = isFilled(details.phone)
    ? details.phone
    : owner?.phone || user.phone || "";

  return {
    name,
    email,
    phone,
    idProofType: details.idProofType || owner?.idProofType || "",
    idProofNumber: details.idProofNumber || owner?.idProofNumber || "",
    idProofImageUrl: details.idProofImageUrl || owner?.idProofImageUrl || "",
    electricityBill: details.electricityBill || owner?.electricityBill || "",
    electricityBillImageUrl:
      details.electricityBillImageUrl || owner?.electricityBillImageUrl || "",
  };
};

const formatAdminProperty = (property) => {
  if (!property) return null;

  return {
    id: property._id,
    title: property.title,
    description: property.description,
    location: property.location,
    rent: property.rent === undefined ? null : property.rent,
    deposit: property.deposit === undefined ? null : property.deposit,
    listingType: property.listingType,
    price: property.price === undefined ? null : property.price,
    propertyType:
      property.propertyType === undefined ? null : property.propertyType,
    bedrooms: property.bedrooms === undefined ? null : property.bedrooms,
    bathrooms: property.bathrooms === undefined ? null : property.bathrooms,
    area: property.area === undefined ? null : property.area,
    amenities: property.amenities,
    images: property.images,
    status: property.status,
    createdAt: property.createdAt,
    owner: formatOwnerWithIdProof(property),
  };
};

const buildPropertyFiltersForAdmin = (query) => {
  const {
    title,
    propertyId,
    status,
    propertyType,
    minRent,
    maxRent,
    bedrooms,
    bathrooms,
    createdAfter,
    createdBefore,
  } = query;

  const filters = {};

  // property id (only if valid ObjectId)
  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    filters._id = mongoose.Types.ObjectId(propertyId);
  }

  // status - allow case-insensitive match (accept 'published' or 'PUBLISHED')
  if (status && isNonEmptyString(status)) {
    // exact match case-insensitive
    filters.status = new RegExp(`^${status}$`, "i");
  }

  // propertyType (case-insensitive substring match)
  if (propertyType && isNonEmptyString(propertyType)) {
    filters.propertyType = new RegExp(propertyType, "i");
  }

  // title (search)
  if (title && isNonEmptyString(title)) {
    filters.title = new RegExp(title, "i");
  }

  // rent range
  if (minRent || maxRent) {
    filters.rent = {};
    if (minRent) filters.rent.$gte = parseInt(minRent, 10);
    if (maxRent) filters.rent.$lte = parseInt(maxRent, 10);
  }

  // numeric fields
  if (bedrooms) {
    const b = parseInt(bedrooms, 10);
    if (!isNaN(b)) filters.bedrooms = b;
  }

  if (bathrooms) {
    const b = parseInt(bathrooms, 10);
    if (!isNaN(b)) filters.bathrooms = b;
  }

  // createdAt date range (optional)
  if (createdAfter || createdBefore) {
    filters.createdAt = {};
    if (createdAfter) {
      const d = new Date(createdAfter);
      if (!isNaN(d)) filters.createdAt.$gte = d;
    }
    if (createdBefore) {
      const d = new Date(createdBefore);
      if (!isNaN(d)) filters.createdAt.$lte = d;
    }

    if (Object.keys(filters.createdAt).length === 0) delete filters.createdAt;
  }

  return filters;
};
const getPaginationMeta = (pageNum, limitNum, totalCount) => {
  const totalPages = Math.ceil(totalCount / limitNum);

  return {
    currentPage: pageNum,
    totalPages,
    totalProperties: totalCount,
    propertiesPerPage: limitNum,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };
};

//create a minimal/placeholder owner so property.owner is not null
const createPlaceholderOwner = async () => {
  const owner = new Owner({
    name: "",
    email: "",
    phone: "",
    idProofType: "pending",
    idProofNumber: "pending",
    idProofImageUrl: "pending",
    electricityBill: "pending",
    electricityBillImageUrl: "pending",
    verified: false,
    properties: [],
  });
  await owner.save();
  return owner;
};

// Create property with owner details (Admin only)
const createPropertyWithOwner = async (req, res) => {
  try {
    const { owner: ownerData = null, property: propertyData } = req.body;

    if (!propertyData) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Property data is required" },
        data: null,
      });
    }

    const requiredFields = ["title", "location"];
    for (const field of requiredFields) {
      if (!propertyData[field]) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: `Property ${field} is required` },
          data: null,
        });
      }
    }

    const listingType = (propertyData.listingType || "rent").toString();

    if (listingType === "rent" && !propertyData.rent) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Property rent is required for rent listing" },
        data: null,
      });
    }

    if (
      listingType !== "rent" &&
      (propertyData.price === undefined || propertyData.price === null)
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: `Property price is required for ${listingType}` },
        data: null,
      });
    }

    if (
      listingType === "commercial" &&
      (propertyData.area === undefined || propertyData.area === null)
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Area is required for commercial listing" },
        data: null,
      });
    }

    let propertyTypeVal;
    if (listingType === "commercial") {
      propertyTypeVal = "office"; // ✅ FIX
    } else {
      propertyTypeVal = propertyData.propertyType || "apartment";
    }

    const bedroomsVal =
      listingType === "commercial" ? 0 : propertyData.bedrooms || 0;
    const bathroomsVal =
      listingType === "commercial" ? 0 : propertyData.bathrooms || 0;

    const rentVal = listingType === "rent" ? propertyData.rent || 0 : null;
    const depositVal =
      listingType === "rent" ? propertyData.deposit || 0 : null;
    const priceVal = listingType !== "rent" ? propertyData.price || null : null;

    const property = await Property.create({
      owner: null,

      ownerDetails:
        ownerData && Object.keys(ownerData).length > 0
          ? {
              name: ownerData.name || "",
              email: ownerData.email || "",
              phone: ownerData.phone || "",
              idProofType: ownerData.idProofType || "",
              idProofNumber: ownerData.idProofNumber || "",
              idProofImageUrl: ownerData.idProofImageUrl || "",
              electricityBill: ownerData.electricityBill || "",
              electricityBillImageUrl: ownerData.electricityBillImageUrl || "",
            }
          : undefined,

      title: propertyData.title,
      description: propertyData.description || "",
      location: propertyData.location,
      listingType,
      category: listingType === "commercial" ? "commercial" : "residential",
      propertyType: propertyTypeVal,
      rent: rentVal,
      deposit: depositVal,
      price: priceVal,
      bedrooms: bedroomsVal,
      bathrooms: bathroomsVal,
      area: propertyData.area || 0,
      amenities: propertyData.amenities || [],
      images: propertyData.images || [],
      status: PROPERTY_STATUS.PENDING,
    });

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: {
        message: "Property created successfully",
        property: formatAdminProperty(property),
      },
    });
  } catch (error) {
    console.error("Create property error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

const checkOwnerExists = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Email is required" },
        data: null,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          exists: false,
          message: "Owner not found",
        },
      });
    }

    if (user.role !== "owner") {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          exists: false,
          message: "User exists but is not an owner",
        },
      });
    }

    const owner = await Owner.findOne({ user: user._id });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        exists: true,
        owner: {
          id: owner?._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          electricityBill: owner?.electricityBill || "pending",
          electricityBillImageUrl: owner?.electricityBillImageUrl || "pending",
          verified: owner?.verified || false,
        },
      },
    });
  } catch (error) {
    console.error("Check owner exists error:", error);
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

const reviewProperty = async (req, res) => {
  const { status } = req.body;

  try {
    if (
      ![PROPERTY_STATUS.APPROVED, PROPERTY_STATUS.REJECTED].includes(status)
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Invalid status. Must be either APPROVED or REJECTED",
        },
        data: null,
      });
    }

    const property = await Property.findById(req.params.id).populate("owner");
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

    property.status = status;
    await property.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: `Property ${status.toLowerCase()} successfully`,
        property: {
          id: property._id,
          title: property.title,
          description: property.description,
          location: property.location,
          rent: property.rent,
          deposit: property.deposit,
          propertyType: property.propertyType,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          amenities: property.amenities,
          images: property.images,
          status: property.status,
          owner: property.owner,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Review property error:", error);
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

// Publish / update property status
const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !status ||
      ![
        PROPERTY_STATUS.PUBLISHED,
        PROPERTY_STATUS.SOLD,
        PROPERTY_STATUS.REJECTED,
      ].includes(status)
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid status update" },
        data: null,
      });
    }

    const property = await Property.findById(req.params.id).populate({
      path: "owner",
      populate: {
        path: "user",
        model: "User",
        select: "name firstName lastName email phone verified",
      },
    });

    if (!property) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Property not found" },
        data: null,
      });
    }

    if (property.status === status) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          message: `Property is already marked as ${status.toLowerCase()}`,
          property,
        },
      });
    }

    if (status === PROPERTY_STATUS.PUBLISHED) {
      const owner = property.owner;
      const ownerVerified =
        !!owner && (owner.verified === true || !!owner.user?.verified === true);

      const isFirstTimePublish = property.status === PROPERTY_STATUS.APPROVED;

      if (isFirstTimePublish) {
        if (!hasOwnerDetails(property)) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            error: {
              message:
                "First-time publish requires complete owner details and ID proof.",
            },
            data: null,
          });
        }
      } else {
        const allowedPreviousStatuses = [
          PROPERTY_STATUS.PUBLISHED,
          PROPERTY_STATUS.SOLD,
          PROPERTY_STATUS.APPROVED,
        ];
        const wasPreviouslyAllowed = allowedPreviousStatuses.includes(
          property.status
        );

        if (!ownerVerified && !wasPreviouslyAllowed) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            error: {
              message:
                "Only approved or previously published properties can be published",
            },
            data: null,
          });
        }

        if (ownerVerified) {
          const email = owner.email || owner.user?.email;
          const phone = owner.phone || owner.user?.phone || owner.mobile;
          if (!isFilled(email) || !isFilled(phone)) {
            return res.status(400).json({
              statusCode: 400,
              success: false,
              error: {
                message: "Owner email/phone must be present for publish",
              },
              data: null,
            });
          }
        } else {
          if (!hasOwnerDetails(property)) {
            return res.status(400).json({
              statusCode: 400,
              success: false,
              error: { message: "Owner contact information not updated" },
              data: null,
            });
          }
        }
      }
    }
    if (
      status === PROPERTY_STATUS.SOLD &&
      property.status !== PROPERTY_STATUS.PUBLISHED
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Only published properties can be marked as sold" },
        data: null,
      });
    }
    property.status = status;
    await property.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: `Property marked as ${status.toLowerCase()} successfully`,
        property,
      },
    });
  } catch (error) {
    console.error("Update property status error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Helper: check if owner details are complete
const hasOwnerDetails = (property) => {
  const details = property.ownerDetails;
  if (!details) return false;

  return (
    isFilled(details.name) &&
    isFilled(details.email) &&
    isFilled(details.phone) &&
    isFilled(details.idProofType) &&
    isFilled(details.idProofNumber) &&
    isFilled(details.idProofImageUrl) & isFilled(details.electricityBill)
  );
};

// Manage site visit requests
const manageSiteVisit = async (req, res) => {
  const { status } = req.body;

  try {
    if (![BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Invalid status. Must be either APPROVED or REJECTED",
        },
        data: null,
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("user")
      .populate("property");

    if (!booking) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Booking not found",
        },
        data: null,
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: `Site visit ${status.toLowerCase()} successfully`,
        booking: {
          id: booking._id,
          user: booking.user,
          property: booking.property,
          visitDate: booking.visitDate,
          status: booking.status,
          message: booking.message,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Manage site visit error:", error);
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

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").lean();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Users retrieved successfully",
        users: users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.verified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        totalUsers: users.length,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
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

// Get all properties for admin
const getAllPropertiesForAdmin = async (req, res) => {
  try {
    const {
      title,
      propertyId,
      customerEmail,
      customerName,
      customerPhone,
      status,
      propertyType,
      minRent,
      maxRent,
      bedrooms,
      bathrooms,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ["createdAt", "updatedAt", "rent", "title"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // build base property filters (owner-specific filters handled next)
    const propertyFilters = buildPropertyFiltersForAdmin({
      title,
      propertyId,
      status,
      propertyType,
      minRent,
      maxRent,
      bedrooms,
      bathrooms,
      createdAfter: req.query.createdAfter,
      createdBefore: req.query.createdBefore,
    });

    const ownerFilterCriteria = {};
    if (customerEmail && isNonEmptyString(customerEmail)) {
      ownerFilterCriteria.email = new RegExp(`^${customerEmail}$`, "i");
    }
    if (customerName && isNonEmptyString(customerName)) {
      ownerFilterCriteria.$or = ownerFilterCriteria.$or || [];
      ownerFilterCriteria.$or.push({ name: new RegExp(customerName, "i") });
      ownerFilterCriteria.$or.push({
        "user.name": new RegExp(customerName, "i"),
      });
      ownerFilterCriteria.$or.push({
        "user.firstName": new RegExp(customerName, "i"),
      });
      ownerFilterCriteria.$or.push({
        "user.lastName": new RegExp(customerName, "i"),
      });
    }
    if (customerPhone && isNonEmptyString(customerPhone)) {
      ownerFilterCriteria.$or = ownerFilterCriteria.$or || [];
      ownerFilterCriteria.$or.push({ phone: new RegExp(customerPhone, "i") });
      ownerFilterCriteria.$or.push({ mobile: new RegExp(customerPhone, "i") });
      ownerFilterCriteria.$or.push({
        "user.phone": new RegExp(customerPhone, "i"),
      });
    }

    if (Object.keys(ownerFilterCriteria).length > 0) {
      // find matching owner ids
      const matchingOwners = await Owner.find(ownerFilterCriteria)
        .select("_id")
        .lean();
      const ownerIds = matchingOwners.map((o) => o._id).filter(Boolean);

      // if no owners found, result should be empty
      if (ownerIds.length === 0) {
        return res.status(200).json({
          statusCode: 200,
          success: true,
          error: null,
          data: {
            message: "Properties retrieved successfully",
            properties: [],
            pagination: getPaginationMeta(pageNum, limitNum, 0),
          },
        });
      }

      propertyFilters.owner = { $in: ownerIds };
    }

    // run count and query (apply sort properly)
    const [totalCount, properties] = await Promise.all([
      Property.countDocuments(propertyFilters),
      Property.find(propertyFilters)
        .populate({
          path: "owner",
          populate: {
            path: "user",
            model: "User",
            select: "name email phone verified firstName lastName",
          },
        })
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const formattedProperties = properties.map((property) => ({
      id: property._id,
      title: property.title,
      description: property.description,
      location: property.location,
      rent: property.rent === undefined ? null : property.rent,
      deposit: property.deposit === undefined ? null : property.deposit,
      listingType: property.listingType,
      price: property.price === undefined ? null : property.price,
      propertyType:
        property.propertyType === undefined ? null : property.propertyType,
      bedrooms: property.bedrooms === undefined ? null : property.bedrooms,
      bathrooms: property.bathrooms === undefined ? null : property.bathrooms,
      area: property.area === undefined ? null : property.area,
      amenities: property.amenities,
      images: property.images,
      status: property.status,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      owner: property.owner ? formatOwnerWithIdProof(property) : null,
    }));

    const pagination = getPaginationMeta(pageNum, limitNum, totalCount);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Properties retrieved successfully",
        properties: formattedProperties,
        pagination,
      },
    });
  } catch (error) {
    console.error("ERROR in getAllPropertiesForAdmin:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};
// Get single property for admin (for edit screen)
const getPropertyByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id).populate({
      path: "owner",
      populate: {
        path: "user",
        model: "User",
        select: "name email phone",
      },
    });

    if (!property) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Property not found" },
        data: null,
      });
    }

   return res.status(200).json({
  statusCode: 200,
  success: true,
  error: null,
  data: {
    message: "Property retrieved successfully",
    property: {
      ...formatAdminProperty(property),
      owner: formatOwnerWithIdProof(property),
    },
  },
});

  } catch (error) {
    console.error("Get property by id for admin error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Update property details for admin
const updatePropertyForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { property: propertyData = {}, owner: ownerData = {} } = req.body;

    let property = await Property.findById(id).populate("owner");

    if (!property) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Property not found" },
        data: null,
      });
    }
    const updatableFields = [
      "title",
      "description",
      "location",
      "rent",
      "deposit",
      "listingType",
      "bedrooms",
      "bathrooms",
      "area",
      "amenities",
      "images",
      "price",
    ];

    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(propertyData, field)) {
        property[field] = propertyData[field];
      }
    });

    if (property.listingType === "commercial") {
      property.bedrooms = 0;
      property.bathrooms = 0;
      property.rent = null;
      property.deposit = null;

      property.propertyType = "office"; // ✅ FIX
      property.category = "commercial";
    } else {
      property.propertyType =
        property.propertyType && property.propertyType !== "commercial"
          ? property.propertyType
          : "apartment";

      property.category = "residential";

      if (property.listingType === "rent") {
        property.price = null;
      }
    }
    if (ownerData && Object.keys(ownerData).length > 0) {
      property.ownerDetails = {
        ...(property.ownerDetails || {}),
      };

      const ownerFields = [
        "name",
        "email",
        "phone",
        "idProofType",
        "idProofNumber",
        "idProofImageUrl",
        "electricityBill",
        "electricityBillImageUrl",
      ];

      ownerFields.forEach((field) => {
        if (ownerData[field] !== undefined && ownerData[field] !== "") {
          property.ownerDetails[field] = ownerData[field];
        }
      });
    }

    await property.save();

    property = await Property.findById(id).populate("owner");

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Property updated successfully",
        property: {
          ...formatAdminProperty(property),

          owner: property.ownerDetails
            ? {
                name: property.ownerDetails.name || "",
                email: property.ownerDetails.email || "",
                phone: property.ownerDetails.phone || "",
                idProofType: property.ownerDetails.idProofType || "",
                idProofNumber: property.ownerDetails.idProofNumber || "",
                idProofImageUrl: property.ownerDetails.idProofImageUrl || "",
                electricityBill: property.ownerDetails.electricityBill || "",
                electricityBillImageUrl:
                  property.ownerDetails.electricityBillImageUrl || "",
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Update property error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Get all bookings for admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .populate("property")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Bookings retrieved successfully",
        bookings: bookings.map((booking) => ({
          id: booking._id,
          user: booking.user
            ? {
                id: booking.user._id,
                name: booking.user.name,
                email: booking.user.email,
              }
            : null,
          property: booking.property
            ? {
                id: booking.property._id,
                title: booking.property.title,
                location: booking.property.location,
                rent: booking.property.rent,
              }
            : null,
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
    console.error("Get all bookings error:", error);
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

// Get users with subscription details
const getUsersWithSubscriptions = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").lean();

    const usersWithSubs = await Promise.all(
      users.map(async (user) => {
        const activeSub = await UserSubscription.findOne({
          user: user._id,
          status: "active",
        })
          .populate("plan")
          .lean();

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.verified,
          createdAt: user.createdAt,
          activeSubscription: activeSub
            ? {
                planName: activeSub.plan.name,
                startDate: activeSub.startDate,
                endDate: activeSub.endDate,
                contactsViewed: activeSub.contactsViewed,
                contactLimit: activeSub.plan.contactLimit,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersWithSubs,
        totalUsers: users.length,
      },
    });
  } catch (error) {
    console.error("Get users with subscriptions error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const Payment = require("../models/Payment");
    const payments = await Payment.find({})
      .populate("user", "name email phone")
      .populate("plan", "name price")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        payments: payments.map((payment) => ({
          id: payment._id,
          merchantTransactionId: payment.merchantTransactionId,
          phonepeTransactionId: payment.phonepeTransactionId,
          amount: payment.amount,
          gstAmount: payment.gstAmount,
          totalAmount: payment.totalAmount,
          status: payment.status,
          user: payment.user
            ? {
                id: payment.user._id,
                name: payment.user.name,
                email: payment.user.email,
                phone: payment.user.phone,
              }
            : null,
          plan: payment.plan
            ? {
                name: payment.plan.name,
                price: payment.plan.price,
              }
            : null,
          createdAt: payment.createdAt,
        })),
        totalPayments: payments.length,
      },
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

// Get user complete history
const getUserHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });
    }

    const subscriptions = await UserSubscription.find({ user: userId })
      .populate("plan")
      .sort({ startDate: -1 })
      .lean();

    const propertyViews = await PropertyView.find({ user: userId })
      .populate("property", "title location rent propertyType")
      .populate("subscription")
      .sort({ viewedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
        subscriptions: subscriptions.map((sub) => ({
          id: sub._id,
          planName: sub.plan ? sub.plan.name : "Unknown Plan",
          startDate: sub.startDate,
          endDate: sub.endDate,
          status: sub.status,
          contactsViewed: sub.contactsViewed,
          contactLimit: sub.plan ? sub.plan.contactLimit : 0,
          paymentId: sub.payment,
        })),
        propertyViews: propertyViews.map((view) => ({
          id: view._id,
          property: view.property,
          viewedAt: view.viewedAt,
          subscriptionId: view.subscription ? view.subscription._id : null,
        })),
      },
    });
  } catch (error) {
    console.error("Get user history error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

module.exports = {
  createPropertyWithOwner,
  checkOwnerExists,
  reviewProperty,
  updatePropertyStatus,
  manageSiteVisit,
  getAllUsers,
  getAllPropertiesForAdmin,
  getPropertyByIdForAdmin,
  updatePropertyForAdmin,
  getAllBookings,
  getUsersWithSubscriptions,
  getUserHistory,
  getAllPayments,
};
