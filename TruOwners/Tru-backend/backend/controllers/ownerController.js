// ownercontroller.js
const Property = require("../models/Property");
const Owner = require("../models/Owner");
const { PROPERTY_STATUS } = require("../utils/constants");

// Upload new property
const uploadProperty = async (req, res) => {
  try {
    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { message: "Owner profile not found" },
        data: null,
      });
    }

    const {
      title,
      description,
      location,
      listingType,
      rent,
      deposit,
      price,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      amenities,
      images,
      ownerPhone,
      ownerIdProofType,
      ownerIdProofNumber,
      ownerIdProofImageUrl,
      ownerElectricityBill,
      ownerElectricityBillImageUrl,
    } = req.body;

    const normalizedListingType = (listingType || "").toLowerCase();

    // -----------------------------
    // 🔐 ENFORCE COMMERCIAL RULE
    // -----------------------------
    let finalPropertyType = propertyType || "apartment";
    let finalBedrooms = bedrooms ?? 0;
    let finalBathrooms = bathrooms ?? 0;
    let finalRent = rent ?? null;
    let finalDeposit = deposit ?? null;
    let finalPrice = price ?? null;

    if (normalizedListingType === "commercial") {
      finalPropertyType = "office"; // ✅ VALID ENUM
      finalBedrooms = 0;
      finalBathrooms = 0;
      finalRent = null;
      finalDeposit = null;

      if (finalPrice === null) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Price is required for commercial property" },
          data: null,
        });
      }
    }

    if (normalizedListingType === "rent") {
      finalPrice = null;
    }

    if (["sell", "lease"].includes(normalizedListingType)) {
      finalRent = null;
      finalDeposit = null;
    }

    const property = await Property.create({
      owner: owner._id,
      title,
      description,
      location,
      listingType: normalizedListingType,
      propertyType: finalPropertyType,
      rent: finalRent,
      deposit: finalDeposit,
      price: finalPrice,
      bedrooms: finalBedrooms,
      bathrooms: finalBathrooms,
      area,
      amenities: amenities || [],
      images: images || [],
      ownerDetails: {
        phone: ownerPhone,
        idProofType: ownerIdProofType,
        idProofNumber: ownerIdProofNumber,
        idProofImageUrl: ownerIdProofImageUrl,
        electricityBill: ownerElectricityBill || null,
        electricityBillImageUrl: ownerElectricityBillImageUrl || null,
      },
      status: PROPERTY_STATUS.PENDING,
    });

    owner.properties.push(property._id);
    await owner.save();

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: {
        message: "Property uploaded successfully",
        property,
      },
    });
  } catch (error) {
    console.error("Upload property error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Get owner's properties
const getOwnerProperties = async (req, res) => {
  try {
    const owner = await Owner.findOne({ user: req.user._id }).populate(
      "properties"
    );
    if (!owner) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Owner profile not found",
        },
        data: null,
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Properties retrieved successfully",
        properties: owner.properties.map((property) => ({
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
          bathrooms:
            property.bathrooms === undefined ? null : property.bathrooms,
          area: property.area === undefined ? null : property.area,
          amenities: property.amenities,
          images: property.images,
          status: property.status,
          ownerDetails: property.ownerDetails || {},
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        })),
        totalProperties: owner.properties.length,
      },
    });
  } catch (error) {
    console.error("Get owner properties error:", error);
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

const getProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id }).populate({
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
        error: {
          message: "Property not found",
        },
        data: null,
      });
    }

    // Build owner object for response (prefer property.ownerDetails then owner model then user fields)
    let ownerObj = null;
    if (property.owner) {
      const owner = property.owner;
      const user = owner.user || {};
      const perProp = property.ownerDetails || {};

      ownerObj = {
        id: owner._id,
        name: perProp.name || user.name || owner.name || null,
        email: perProp.email || user.email || owner.email || null,
        phone:
          perProp.phone ||
          (user && user.phone) ||
          owner.phone ||
          owner.mobile ||
          null,
        idProofType: perProp.idProofType || owner.idProofType || null,
        idProofNumber: perProp.idProofNumber || owner.idProofNumber || null,
        idProofImageUrl:
          perProp.idProofImageUrl || owner.idProofImageUrl || null,
        electricityBill:
          perProp.electricityBill || owner.electricityBill || null,
        electricityBillImageUrl:
          perProp.electricityBillImageUrl ||
          owner.electricityBillImageUrl ||
          null,
        verified: owner.verified || false,
      };
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Property retrieved successfully",
        property: {
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
          bathrooms:
            property.bathrooms === undefined ? null : property.bathrooms,
          area: property.area === undefined ? null : property.area,
          amenities: property.amenities,
          images: property.images,
          status: property.status,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
          owner: ownerObj,
          ownerDetails: property.ownerDetails || {},
        },
      },
    });
  } catch (error) {
    console.error("Get property error:", error);
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

// Update property
const updateProperty = async (req, res) => {
  const {
    title,
    description,
    location,
    rent,
    deposit,
    listingType,
    price,
    propertyType,
    bedrooms,
    bathrooms,
    area,
    amenities,
    images,
    ownerDetails,
  } = req.body;

  const allowedUpdates = [
    "title",
    "description",
    "location",
    "rent",
    "deposit",
    "listingType",
    "price",
    "propertyType",
    "bedrooms",
    "bathrooms",
    "area",
    "amenities",
    "images",
    "ownerDetails",
  ];

  const isValidOperation = Object.keys(req.body).every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      error: {
        message:
          "Invalid updates! Allowed fields: " + allowedUpdates.join(", "),
      },
      data: null,
    });
  }

  try {
    // 1️⃣ Find owner
    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { message: "Owner profile not found" },
        data: null,
      });
    }

    // 2️⃣ Find property
    const property = await Property.findOne({
      _id: req.params.id,
      owner: owner._id,
    });

    if (!property) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message:
            "Property not found or you do not have permission to update this property",
        },
        data: null,
      });
    }

    // 3️⃣ If approved/published → reset to pending
    if (
      property.status === PROPERTY_STATUS.APPROVED ||
      property.status === PROPERTY_STATUS.PUBLISHED
    ) {
      property.status = PROPERTY_STATUS.PENDING;
    }

    // 4️⃣ Apply raw updates first
    if (title !== undefined) property.title = title;
    if (description !== undefined) property.description = description;
    if (location !== undefined) property.location = location;
    if (listingType !== undefined) property.listingType = listingType;
    if (area !== undefined) property.area = area;
    if (amenities !== undefined) property.amenities = amenities || [];
    if (images !== undefined) property.images = images || [];

    const normalizedListingType = (property.listingType || "").toLowerCase();

    // ------------------------------------------------
    // 🔐 ENFORCE LISTING TYPE RULES (MAIN FIX)
    // ------------------------------------------------
    if (normalizedListingType === "commercial") {
      property.propertyType = "office"; // ✅ VALID ENUM
      property.bedrooms = 0;
      property.bathrooms = 0;
      property.rent = null;
      property.deposit = null;
      property.price = price ?? property.price ?? null;

      if (property.price === null) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Price is required for commercial property" },
          data: null,
        });
      }
    } else if (normalizedListingType === "rent") {
      property.propertyType =
        propertyType || property.propertyType || "apartment";
      property.bedrooms = bedrooms ?? property.bedrooms ?? 0;
      property.bathrooms = bathrooms ?? property.bathrooms ?? 0;
      property.rent = rent ?? property.rent ?? null;
      property.deposit = deposit ?? property.deposit ?? null;
      property.price = null;
    } else {
      // sell / lease
      property.propertyType =
        propertyType || property.propertyType || "apartment";
      property.bedrooms = bedrooms ?? property.bedrooms ?? 0;
      property.bathrooms = bathrooms ?? property.bathrooms ?? 0;
      property.price = price ?? property.price ?? null;
      property.rent = null;
      property.deposit = null;
    }

    // 5️⃣ Owner details merge
    if (ownerDetails) {
      property.ownerDetails = {
        ...property.ownerDetails,
        ...ownerDetails,
      };
    }

    property.updatedAt = new Date();
    await property.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Property updated successfully",
        property,
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

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id });
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

    await Property.deleteOne({ _id: req.params.id });

    // Also remove from owner's list if it exists
    if (property.owner) {
      try {
        await Owner.updateOne(
          { _id: property.owner },
          { $pull: { properties: property._id } }
        );
      } catch (err) {
        console.warn("Failed to remove property from owner list:", err);
      }
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Property deleted successfully",
      },
    });
  } catch (error) {
    console.error("Delete property error:", error);
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
  uploadProperty,
  getOwnerProperties,
  updateProperty,
  getProperty,
  deleteProperty,
};
