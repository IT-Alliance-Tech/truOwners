const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { ownerAuth } = require('../middlewares/roleCheck');
const ownerController = require('../controllers/ownerController');

// Apply auth middleware to all owner routes
router.use(auth);
router.use(ownerAuth);

// Property routes
router.post('/properties', ownerController.uploadProperty);
router.get('/properties', ownerController.getOwnerProperties);
router.get('/properties/:id', ownerController.getProperty);
router.patch('/properties/:id', ownerController.updateProperty);
router.delete('/properties/:id', ownerController.deleteProperty);

module.exports = router;