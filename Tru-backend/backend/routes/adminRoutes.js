const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/roleCheck');
const adminController = require('../controllers/adminController');

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminAuth);

// Property management
router.patch('/properties/:id/review', adminController.reviewProperty);
router.put('/properties/:id', adminController.updatePropertyStatus);

// Booking management
router.patch('/bookings/:id', adminController.manageSiteVisit);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users-with-subscriptions', adminController.getUsersWithSubscriptions);
router.get('/users/:userId/history', adminController.getUserHistory);

// Data views
router.get('/properties', adminController.getAllPropertiesForAdmin);
router.get('/bookings', adminController.getAllBookings);
router.get('/payments', adminController.getAllPayments);

// Property upload
router.post('/properties', adminController.uploadProperty);

module.exports = router;
// End of file