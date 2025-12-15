const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authController = require('../controllers/authController');

// Register new user
router.post('/register', authController.register);

// Login with password
router.post('/login/password', authController.loginWithPassword);

// Login with OTP
router.post('/login/otp', authController.loginWithOTP);

// Send OTP
router.post('/send-otp', authController.sendOTP);

// Validate OTP
router.post('/validate-otp', authController.validateOTP);

// Forgot Password - Request OTP
router.post('/forgot-password', authController.forgotPasswordRequest);

// Forgot Password - Verify OTP
router.post('/forgot-password/verify', authController.verifyForgotPasswordOTP);

// Forgot Password - Reset Password
router.post('/reset-password', authController.resetPassword);

// User profile routes
router.use(auth);
router.put('/update',auth, authController.updateUser);
router.delete('/delete',auth, authController.deleteUser);

module.exports = router;
