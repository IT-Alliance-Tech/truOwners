const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { userAuth } = require('../middlewares/roleCheck');
const userController = require('../controllers/userController');

router.get('/properties', userController.getAllProperties);

// Apply auth middleware to all user routes
router.use(auth);
router.use(userAuth);

// Property routes
router.get('/properties/:id', userController.getPropertyById);

// Wishlist routes
router.post('/wishlist', userController.addToWishlist);
router.get('/wishlist', userController.getUserWishlist);
router.delete('/wishlist', userController.removeFromWishlist);

// Booking routes
router.post('/bookings', userController.bookSiteVisit);
router.get('/bookings', userController.getUserBookings);

// Payment routes
router.post('/unlock-contact', userController.unlockOwnerContact);

module.exports = router;