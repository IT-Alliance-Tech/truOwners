const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { adminAuth } = require("../middlewares/roleCheck");
const adminController = require("../controllers/adminController");
const inquiryController = require("../controllers/inquiryController");

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminAuth);

// Inquiry management
router.get("/inquiries", inquiryController.getAllInquiries);
router.patch("/inquiries/:id/status", inquiryController.updateInquiryStatus);

// Property management
router.get("/check-owner", adminController.checkOwnerExists);
router.post("/properties", adminController.createPropertyWithOwner);
router.patch("/properties/:id/review", adminController.reviewProperty);
router.put("/properties/:id/status", adminController.updatePropertyStatus);
router.get("/properties/:id", adminController.getPropertyByIdForAdmin);
router.put("/properties/:id", adminController.updatePropertyForAdmin);

// Booking management
router.patch("/bookings/:id", adminController.manageSiteVisit);

// User management
router.get("/users", adminController.getAllUsers);
router.get(
  "/users-with-subscriptions",
  adminController.getUsersWithSubscriptions
);
router.get("/users/:userId/history", adminController.getUserHistory);

// Data views
router.get("/properties", adminController.getAllPropertiesForAdmin);
router.get("/bookings", adminController.getAllBookings);
router.get("/payments", adminController.getAllPayments);

module.exports = router;
