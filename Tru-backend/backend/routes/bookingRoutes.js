const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth'); // JWT verification
const { userAuth, adminAuth } = require('../middlewares/roleCheck');

// All booking routes require authentication
router.use(auth);

// ---------- USER ROUTES ----------
// Create booking
router.post('/', userAuth, bookingController.createBooking);

// Get bookings (User sees own, Admin sees all)
router.get('/', userAuth, bookingController.getBookings);

// Update booking time (resets to pending)
router.put('/:id/update-time', userAuth, bookingController.updateBookingTime);

// User responds to time change request
router.put('/:id/respond-time-change', userAuth, bookingController.respondToTimeChange);

// Get bookings with pending time change requests
router.get('/pending-time-changes', userAuth, bookingController.getPendingTimeChangeRequests);

// ---------- ADMIN ROUTES ----------
router.put('/:id/status', adminAuth, bookingController.updateBookingStatus);

// Get all bookings (Admin only)
router.get('/all', adminAuth, bookingController.getAllBookings);

router.get('/analytics', adminAuth, bookingController.getBookingAnalytics);

// Admin requests time change
router.put('/:id/request-time-change', adminAuth, bookingController.requestTimeChange);

module.exports = router;
