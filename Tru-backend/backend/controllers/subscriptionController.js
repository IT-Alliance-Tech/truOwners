const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const User = require("../models/User");

// Seed Plans (Helper for initial setup)
const seedPlans = async (req, res) => {
  try {
    const plans = [
      {
        name: "Silver Plan",
        price: 599,
        contactLimit: 6,
        validityDays: 15,
        description: "Includes: Contact numbers of 6 houses",
      },
      {
        name: "Gold Plan",
        price: 1199,
        contactLimit: 19,
        validityDays: 15,
        description: "Includes: Contact numbers of 19 houses",
      },
      {
        name: "Diamond Plan",
        price: 1799,
        contactLimit: 25,
        validityDays: 15,
        description: "Includes: Contact numbers of 25 houses",
      },
    ];

    for (const plan of plans) {
      await SubscriptionPlan.findOneAndUpdate({ name: plan.name }, plan, {
        upsert: true,
        new: true,
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Plans seeded successfully" });
  } catch (error) {
    console.error("Seed plans error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: { message: "Internal server error", details: error.message },
      });
  }
};

// Get all plans
const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error("Get plans error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

// Subscribe to a plan
const subscribe = async (req, res) => {
  const userId = req.user._id;
  const { planId } = req.body;

  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Plan not found" } });
    }

    // Deactivate any existing active subscription
    await UserSubscription.updateMany(
      { user: userId, status: "active" },
      { status: "cancelled", endDate: new Date() } // Or keep it active until expiry? Requirement says "upgrade... even if active". Simplest is to cancel old and start new.
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.validityDays);

    const newSubscription = new UserSubscription({
      user: userId,
      plan: plan._id,
      startDate,
      endDate,
      status: "active",
      contactsViewed: 0,
    });

    await newSubscription.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Subscribed successfully",
        data: newSubscription,
      });
  } catch (error) {
    console.error("Subscribe error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

// Get my subscription
const getMySubscription = async (req, res) => {
  const userId = req.user._id;

  try {
    const subscription = await UserSubscription.findOne({
      user: userId,
      status: "active",
    })
      .populate("plan")
      .sort({ startDate: -1 });

    if (!subscription) {
      return res
        .status(200)
        .json({ success: true, data: null, message: "No active subscription" });
    }

    // Check expiry
    if (new Date() > subscription.endDate) {
      subscription.status = "expired";
      await subscription.save();
      return res
        .status(200)
        .json({ success: true, data: null, message: "Subscription expired" });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Get my subscription error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  const userId = req.user._id;

  try {
    const subscription = await UserSubscription.findOneAndUpdate(
      { user: userId, status: "active" },
      { status: "cancelled", endDate: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res
        .status(404)
        .json({
          success: false,
          error: { message: "No active subscription found" },
        });
    }

    res
      .status(200)
      .json({ success: true, message: "Subscription cancelled successfully" });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Internal server error" } });
  }
};

module.exports = {
  seedPlans,
  getPlans,
  subscribe,
  getMySubscription,
  cancelSubscription,
};
