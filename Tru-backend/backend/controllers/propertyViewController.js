const PropertyView = require("../models/PropertyView");
const UserSubscription = require("../models/UserSubscription");
const Property = require("../models/Property");
const Owner = require("../models/Owner");

// View Owner Details
const viewOwnerDetails = async (req, res) => {
  const userId = req.user._id;
  const { propertyId } = req.body;

  try {
    // 1. Check for active subscription
    const subscription = await UserSubscription.findOne({
      user: userId,
      status: "active",
    }).populate("plan");

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: {
          message:
            "No active subscription. Please subscribe to view owner details.",
        },
      });
    }

    // Check if subscription is expired (double check)
    if (new Date() > subscription.endDate) {
      subscription.status = "expired";
      await subscription.save();
      return res.status(403).json({
        success: false,
        error: { message: "Subscription expired. Please renew." },
      });
    }

    // 2. Check if already viewed in THIS subscription
    const existingView = await PropertyView.findOne({
      user: userId,
      property: propertyId,
      subscription: subscription._id,
    });

    if (existingView) {
      // Already viewed, just return owner details
      const property = await Property.findById(propertyId).populate("owner");
      if (!property)
        return res
          .status(404)
          .json({ success: false, error: { message: "Property not found" } });

      // Fetch owner user details
      const ownerProfile = await Owner.findById(property.owner).populate(
        "user",
        "name email phone"
      );

      return res.status(200).json({
        success: true,
        data: {
          owner: ownerProfile.user,
          message: "Owner details retrieved (already viewed)",
        },
      });
    }

    // 3. Check credit limit
    if (subscription.contactsViewed >= subscription.plan.contactLimit) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Contact view limit reached for this subscription plan.",
        },
      });
    }

    // 4. Record view and increment count
    const newView = new PropertyView({
      user: userId,
      property: propertyId,
      subscription: subscription._id,
    });
    await newView.save();

    subscription.contactsViewed += 1;
    await subscription.save();

    // Return owner details
    const property = await Property.findById(propertyId).populate("owner");
    const ownerProfile = await Owner.findById(property.owner).populate(
      "user",
      "name email phone"
    );

    res.status(200).json({
      success: true,
      data: {
        owner: ownerProfile.user,
        remainingContacts:
          subscription.plan.contactLimit - subscription.contactsViewed,
        message: "Owner details retrieved successfully",
      },
    });
  } catch (error) {
    console.error("View owner details error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

// Get Viewed Properties
const getViewedProperties = async (req, res) => {
  const userId = req.user._id;

  try {
    // Get views from active subscription? Or all history?
    // Requirement: "api which gives subscription details and propeties he has viewed"
    // Requirement: "once subscriptions has ended user losses his data" -> imply only current subscription views

    const subscription = await UserSubscription.findOne({
      user: userId,
      status: "active",
    });

    if (!subscription) {
      return res
        .status(200)
        .json({
          success: true,
          data: [],
          message: "No active subscription, no viewed properties available.",
        });
    }

    const views = await PropertyView.find({ subscription: subscription._id })
      .populate({
        path: "property",
        select: "title location rent propertyType images",
      })
      .sort({ viewedAt: -1 });

    res.status(200).json({ success: true, data: views });
  } catch (error) {
    console.error("Get viewed properties error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

module.exports = {
  viewOwnerDetails,
  getViewedProperties,
};
