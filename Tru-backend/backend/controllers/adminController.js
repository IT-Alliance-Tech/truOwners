const mongoose = require("mongoose");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Owner = require("../models/Owner");
const { PROPERTY_STATUS, BOOKING_STATUS } = require("../utils/constants");
const UserSubscription = require("../models/UserSubscription");
const PropertyView = require("../models/PropertyView");

// Approve/reject property
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
// Publish property
const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Check if status is allowed
    if (!isValidStatus(status)) {
      return sendError(res, 400, "Invalid status update");
    }

    // Find property
    const property = await findProperty(req.params.id);
    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    // Prevent redundant updates
    if (isSameStatus(property, status)) {
      return sendSuccess(
        res,
        200,
        `Property is already marked as ${status}`,
        property
      );
    }

    // Status transition validation
    const transitionError = validateStatusTransition(property.status, status);
    if (transitionError) {
      return sendError(res, 400, transitionError);
    }

    // NEW: Check owner contact details before publishing
    if (status === PROPERTY_STATUS.PUBLISHED) {
      const publishError = validatePublishOwnerContact(property);
      if (publishError) {
        return sendError(res, 400, publishError);
      }
    }

    // Update status
    property.status = status;
    await property.save();

    return sendSuccess(
      res,
      200,
      `Property marked as ${status} successfully`,
      property
    );

  } catch (error) {
    console.error("Update property status error:", error);
    return sendError(res, 500, "Internal server error: " + error.message);
  }
};


// Small helpers – one job each

const isValidStatus = (status) => {
  if (!status) return false;
  const allowed = [
    PROPERTY_STATUS.PUBLISHED,
    PROPERTY_STATUS.SOLD,
    PROPERTY_STATUS.REJECTED,
  ];
  return allowed.includes(status);
};

const sendError = (res, httpCode, message) => {
  return res.status(httpCode).json({
    statusCode: httpCode,
    success: false,
    error: { message },
    data: null,
  });
};

const sendSuccess = (res, httpCode, message, property) => {
  return res.status(httpCode).json({
    statusCode: httpCode,
    success: true,
    error: null,
    data: { message, property },
  });
};

const findProperty = async (id) => {
  return Property.findById(id);
};

const isSameStatus = (property, status) => {
  return property.status === status;
};

const validateStatusTransition = (currentStatus, nextStatus) => {
  if (
    nextStatus === PROPERTY_STATUS.PUBLISHED &&
    currentStatus !== PROPERTY_STATUS.APPROVED
  ) {
    return "Only approved properties can be published";
  }

  if (
    nextStatus === PROPERTY_STATUS.SOLD &&
    currentStatus !== PROPERTY_STATUS.PUBLISHED
  ) {
    return "Only published properties can be marked as sold";
  }

  // REJECTED is always allowed
  return null;
};

const hasOwnerContact = (property) => {
  return Boolean(
    property.ownername &&
      property.email &&
      property.mobile
  );
};

const validatePublishOwnerContact = (property) => {
  if (!hasOwnerContact(property)) {
    return (
      "Please add owner name, email and mobile before publishing."
    );
  }
  return null;
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
    const users = await User.find({}).select("-password");

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

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Cap at 100
    const skip = (pageNum - 1) * limitNum;

    // Validate sort parameters
    const allowedSortFields = ["createdAt", "updatedAt", "rent", "title"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Build property filters
    let propertyFilters = {};

    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      propertyFilters._id = propertyId;
    }
    if (status && Object.values(PROPERTY_STATUS).includes(status)) {
      propertyFilters.status = status;
    }
    if (propertyType) {
      propertyFilters.propertyType = new RegExp(propertyType, "i");
    }
    if (title) {
      propertyFilters.title = new RegExp(title, "i");
    }
    if (minRent || maxRent) {
      propertyFilters.rent = {};
      if (minRent && !isNaN(minRent)) {
        propertyFilters.rent.$gte = parseInt(minRent);
      }
      if (maxRent && !isNaN(maxRent)) {
        propertyFilters.rent.$lte = parseInt(maxRent);
      }
    }
    if (bedrooms && !isNaN(bedrooms)) {
      propertyFilters.bedrooms = parseInt(bedrooms);
    }
    if (bathrooms && !isNaN(bathrooms)) {
      propertyFilters.bathrooms = parseInt(bathrooms);
    }

    // Build user filters for aggregation
    let userMatchStage = {};
    if (customerEmail) {
      userMatchStage.email = new RegExp(customerEmail, "i");
    }
    if (customerPhone) {
      userMatchStage.phone = new RegExp(customerPhone, "i");
    }
    if (customerName) {
      userMatchStage.$or = [
        { "userData.firstName": new RegExp(customerName, "i") },
        { "userData.lastName": new RegExp(customerName, "i") },
        { "userData.name": new RegExp(customerName, "i") },
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: ["$userData.firstName", " ", "$userData.lastName"],
              },
              regex: customerName,
              options: "i",
            },
          },
        },
      ];
    }

    const hasUserFilters = customerEmail || customerPhone || customerName;

    let properties, totalCount;

    if (hasUserFilters) {
      // Aggregation pipeline when filtering by user data
      const pipeline = [
        { $match: propertyFilters },
        {
          $lookup: {
            from: "owners",
            localField: "owner",
            foreignField: "_id",
            as: "ownerData",
          },
        },
        { $unwind: { path: "$ownerData", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "ownerData.user",
            foreignField: "_id",
            as: "userData",
          },
        },
        { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
        ...(Object.keys(userMatchStage).length > 0
          ? [{ $match: userMatchStage }]
          : []),
        { $sort: { [sortField]: sortDirection } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limitNum }],
            totalCount: [{ $count: "count" }],
          },
        },
      ];

      const result = await Property.aggregate(pipeline);
      properties = result[0].data;
      totalCount = result[0].totalCount[0]?.count || 0;

      properties = properties.map((prop) => ({
        ...prop,
        owner: prop.ownerData
          ? {
              ...prop.ownerData,
              user: prop.userData || null,
            }
          : null,
      }));
    } else {
      // Normal find when no user filters
      const countPromise = Property.countDocuments(propertyFilters);
      const propertiesPromise = Property.find(propertyFilters)
        .populate({
          path: "owner",
          populate: {
            path: "user",
            model: "User",
            select: "firstName lastName name email phone verified role",
          },
        })
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum);

      [totalCount, properties] = await Promise.all([
        countPromise,
        propertiesPromise,
      ]);
    }

    // Status breakdown
    const statusBreakdownPipeline = [
      { $match: hasUserFilters ? {} : propertyFilters },
      ...(hasUserFilters
        ? [
            {
              $lookup: {
                from: "owners",
                localField: "owner",
                foreignField: "_id",
                as: "ownerData",
              },
            },
            {
              $unwind: { path: "$ownerData", preserveNullAndEmptyArrays: true },
            },
            {
              $lookup: {
                from: "users",
                localField: "ownerData.user",
                foreignField: "_id",
                as: "userData",
              },
            },
            {
              $unwind: { path: "$userData", preserveNullAndEmptyArrays: true },
            },
            ...(Object.keys(userMatchStage).length > 0
              ? [{ $match: userMatchStage }]
              : []),
          ]
        : []),
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ];

    const statusBreakdownResult = await Property.aggregate(
      statusBreakdownPipeline
    );
    const statusBreakdown = statusBreakdownResult.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {
        [PROPERTY_STATUS.PENDING]: 0,
        [PROPERTY_STATUS.APPROVED]: 0,
        [PROPERTY_STATUS.PUBLISHED]: 0,
        [PROPERTY_STATUS.REJECTED]: 0,
      }
    );

    // Format response
    const formattedProperties = properties.map((property) => ({
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
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      owner:
        property.owner && property.owner.user
          ? {
              id: property.owner.user._id,
              firstName: property.owner.user.firstName,
              lastName: property.owner.user.lastName,
              name: property.owner.user.name,
              email: property.owner.user.email,
              phone: property.owner.user.phone,
              verified: property.owner.user.verified,
              role: property.owner.user.role,
            }
          : null,
    }));

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Properties retrieved successfully",
        properties: formattedProperties,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProperties: totalCount,
          propertiesPerPage: limitNum,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          propertyId: propertyId || null,
          customerEmail: customerEmail || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          status: status || null,
          propertyType: propertyType || null,
          rentRange: { min: minRent || null, max: maxRent || null },
          bedrooms: bedrooms || null,
          bathrooms: bathrooms || null,
        },
        sorting: {
          sortBy: sortField,
          sortOrder: sortOrder,
        },
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("Get all properties for admin error:", error);
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

// Get all bookings for admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
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
          user: {
            id: booking.user._id,
            name: booking.user.name,
            email: booking.user.email,
          },
          property: {
            id: booking.property._id,
            title: booking.property.title,
            location: booking.property.location,
            rent: booking.property.rent,
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
    const users = await User.find({}).select("-password");

    // Fetch active subscriptions for all users
    // This could be optimized with aggregation, but loop is fine for reasonable user count
    const usersWithSubs = await Promise.all(
      users.map(async (user) => {
        const activeSub = await UserSubscription.findOne({
          user: user._id,
          status: "active",
        }).populate("plan");
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
      .sort({ createdAt: -1 });

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
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });
    }

    // 1. Subscription History
    const subscriptions = await UserSubscription.find({ user: userId })
      .populate("plan")
      .sort({ startDate: -1 });

    // 2. Property View History
    const propertyViews = await PropertyView.find({ user: userId })
      .populate("property", "title location rent propertyType")
      .populate("subscription")
      .sort({ viewedAt: -1 });

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

//add property by admin

const uploadProperty = async (req, res) => {
  const {
    ownername,
    email,
    mobile,
    title,
    description,
    location,
    rent,
    deposit,
    propertyType,
    bedrooms,
    bathrooms,
    area,
    amenities,
    images,
  } = req.body;

  try {
    // Find owner profile
    const owner = await Owner.findOne({ email });
    if (!owner) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: {
          message: "Owner profile not found",
        },
        data: null,
      });
    }

    // Create a new Property object with the extracted properties and the owner ID
    const property = new Property({
      owner: owner._id,
      ownername,
      email,
      mobile,
      title,
      description,
      location,
      rent,
      deposit,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      amenities: amenities || [],
      images: images || [],
      status: PROPERTY_STATUS.PENDING,
    });

    // Save the property to the database
    const response = await property.save();

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: {
        message: "Property added successfully",
        property: response,
      },
    });
  } catch (error) {
    console.error("Add property error:", error);
    return res.status(500).json({
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
  reviewProperty,
  updatePropertyStatus,
  manageSiteVisit,
  uploadProperty,
  getAllUsers,
  getAllPropertiesForAdmin,
  getAllBookings,
  getUsersWithSubscriptions,
  getUserHistory,
  getAllPayments,
};
