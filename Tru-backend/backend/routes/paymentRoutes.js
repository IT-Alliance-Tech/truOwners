const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');

// Payment routes
router.post('/initiate', auth, paymentController.initiatePayment);
router.post('/callback', paymentController.handleCallback);
router.get('/status/:merchantTransactionId', auth, paymentController.checkPaymentStatus);
router.get('/history', auth, paymentController.getPaymentHistory);

// Test endpoint for sandbox - simulate payment completion (NO AUTH for testing)
router.post('/test/complete/:merchantTransactionId', async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const { status } = req.body; // 'success' or 'failed'
    
    const Payment = require('../models/Payment');
    const UserSubscription = require('../models/UserSubscription');
    
    const payment = await Payment.findOne({ merchantTransactionId });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (status === 'success') {
      payment.status = 'success';
      payment.responseCode = 'SUCCESS';
      payment.responseMessage = 'Test payment completed';
      payment.phonepeTransactionId = 'TEST_' + Date.now();
      
      const subscription = await UserSubscription.findById(payment.subscription);
      if (subscription) {
        subscription.status = 'active';
        subscription.paymentId = payment.phonepeTransactionId;
        await subscription.save();
      }
    } else {
      payment.status = 'failed';
      payment.responseCode = 'FAILED';
      payment.responseMessage = 'Test payment failed';
      
      const subscription = await UserSubscription.findById(payment.subscription);
      if (subscription) {
        subscription.status = 'cancelled';
        await subscription.save();
      }
    }
    
    await payment.save();
    
    res.json({ success: true, payment, message: 'Test payment completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;