const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const protect = require('../middlewares/auth'); // Fixed path

// Public routes
router.get('/plans', subscriptionController.getPlans);
router.post('/seed', subscriptionController.seedPlans); // Should be admin only in prod, but keeping open for setup

// Protected routes
router.post('/subscribe', protect, subscriptionController.subscribe);
router.get('/me', protect, subscriptionController.getMySubscription);
router.post('/cancel', protect, subscriptionController.cancelSubscription);
router.post('/upgrade', protect, subscriptionController.subscribe); // Upgrade is essentially same as subscribe logic (replace old with new)

module.exports = router;
