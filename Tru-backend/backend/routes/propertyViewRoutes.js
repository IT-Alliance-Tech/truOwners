const express = require('express');
const router = express.Router();
const propertyViewController = require('../controllers/propertyViewController');
const protect = require('../middlewares/auth');

router.post('/view-owner', protect, propertyViewController.viewOwnerDetails);
router.get('/viewed', protect, propertyViewController.getViewedProperties);

module.exports = router;
