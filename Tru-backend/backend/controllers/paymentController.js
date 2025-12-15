const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo } = require('pg-sdk-node');
const { randomUUID } = require('crypto');
const Payment = require('../models/Payment');
const UserSubscription = require('../models/UserSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// PhonePe SDK Configuration
const clientId = process.env.CLIENT_ID || process.env.PHONEPE_MERCHANT_ID;
const clientSecret = process.env.CLIENT_SECRET || process.env.PHONEPE_SALT_KEY;
const clientVersion = parseInt(process.env.CLIENT_VERSION || '1');
const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;

// Initialize PhonePe Client (singleton)
let phonePeClient = null;

const getPhonePeClient = () => {
  if (!phonePeClient) {
    console.log('Initializing PhonePe SDK Client...');
    console.log('Client ID:', clientId);
    console.log('Client Version:', clientVersion);
    console.log('Environment:', env);
    
    phonePeClient = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      clientVersion,
      env
    );
  }
  return phonePeClient;
};

// Initiate Payment
const initiatePayment = async (req, res) => {
  const userId = req.user._id;
  const { planId } = req.body;

  try {
    // Fetch plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: { message: 'Plan not found' } 
      });
    }

    // Calculate amounts
    const amount = plan.price;
    const gstAmount = Math.round(amount * 0.18); // 18% GST
    const totalAmount = amount + gstAmount;

    // Generate unique merchant transaction ID
    const merchantTransactionId = `TRU_${Date.now()}_${userId.toString().slice(-6)}`;

    // Create payment record
    const payment = new Payment({
      user: userId,
      plan: planId,
      amount,
      gstAmount,
      totalAmount,
      merchantTransactionId,
      status: 'pending'
    });

    await payment.save();

    // Create pending subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.validityDays);

    // Cancel any existing active subscriptions
    await UserSubscription.updateMany(
      { user: userId, status: 'active' },
      { status: 'cancelled', endDate: new Date() }
    );

    const subscription = new UserSubscription({
      user: userId,
      plan: planId,
      startDate,
      endDate,
      status: 'pending',
      payment: payment._id,
      contactsViewed: 0
    });

    await subscription.save();

    // Update payment with subscription reference
    payment.subscription = subscription._id;
    await payment.save();

    // Prepare redirect URL
    const redirectUrl = `${process.env.PHONEPE_REDIRECT_URL || 'http://localhost:3000/payment/callback'}?merchantTransactionId=${merchantTransactionId}`;

    // Create meta info
    const metaInfo = MetaInfo.builder()
      .udf1(userId.toString())
      .udf2(planId.toString())
      .udf3(subscription._id.toString())
      .build();

    // Create PhonePe payment request using SDK
    const paymentRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(totalAmount * 100) // Amount in paise
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    console.log('Initiating PhonePe payment with SDK...');
    console.log('Merchant Order ID:', merchantTransactionId);
    console.log('Amount (paise):', totalAmount * 100);

    // Get PhonePe client and initiate payment
    const client = getPhonePeClient();
    const phonepeResponse = await client.pay(paymentRequest);

    console.log('PhonePe Response:', phonepeResponse);

    if (phonepeResponse && phonepeResponse.redirectUrl) {
      return res.status(200).json({
        success: true,
        data: {
          paymentUrl: phonepeResponse.redirectUrl,
          merchantTransactionId: merchantTransactionId,
          orderId: phonepeResponse.orderId
        }
      });
    } else {
      // Payment initiation failed
      payment.status = 'failed';
      payment.responseMessage = 'Failed to get redirect URL from PhonePe';
      await payment.save();

      subscription.status = 'cancelled';
      await subscription.save();

      return res.status(400).json({
        success: false,
        error: { 
          message: 'Payment initiation failed', 
          details: 'No redirect URL received from PhonePe'
        }
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    
    // Log PhonePe specific error details
    if (error.data) {
      console.error('PhonePe SDK Error:', JSON.stringify(error.data, null, 2));
    }
    
    return res.status(500).json({
      success: false,
      error: { 
        message: 'Internal server error', 
        details: error.message,
        phonepeError: error.data
      }
    });
  }
};

// Handle PhonePe Callback (simplified for sandbox)
const handleCallback = async (req, res) => {
  try {
    console.log('Received PhonePe callback/redirect');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Query:', req.query);

    // For sandbox, PhonePe might redirect with query params instead of POST callback
    // Try to get merchant transaction ID from various sources
    let merchantOrderId = req.body?.merchantOrderId || 
                          req.query?.merchantTransactionId || 
                          req.body?.originalMerchantOrderId;

    if (!merchantOrderId) {
      console.error('No merchant order ID found in callback');
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Missing merchant order ID' } 
      });
    }

    console.log('Processing callback for order:', merchantOrderId);

    // Find payment record
    const payment = await Payment.findOne({ merchantTransactionId: merchantOrderId });
    if (!payment) {
      console.error('Payment not found:', merchantOrderId);
      return res.status(404).json({ 
        success: false, 
        error: { message: 'Payment not found' } 
      });
    }

    // Check status with PhonePe SDK
    try {
      const client = getPhonePeClient();
      const orderStatus = await client.getOrderStatus(merchantOrderId);

      console.log('PhonePe Order Status from callback:', orderStatus);

      // Update payment record
      payment.phonepeTransactionId = orderStatus.orderId;
      payment.callbackData = orderStatus;

      if (orderStatus.state === 'COMPLETED') {
        payment.status = 'success';
        payment.responseCode = 'SUCCESS';
        payment.responseMessage = 'Payment completed successfully';

        // Activate subscription
        const subscription = await UserSubscription.findById(payment.subscription);
        if (subscription) {
          subscription.status = 'active';
          subscription.paymentId = orderStatus.orderId;
          await subscription.save();
          console.log('Subscription activated:', subscription._id);
        }
      } else if (orderStatus.state === 'FAILED') {
        payment.status = 'failed';
        payment.responseCode = 'FAILED';
        payment.responseMessage = 'Payment failed';

        // Cancel subscription
        const subscription = await UserSubscription.findById(payment.subscription);
        if (subscription) {
          subscription.status = 'cancelled';
          await subscription.save();
        }
      } else {
        // Still pending
        payment.status = 'pending';
      }

      await payment.save();

      return res.status(200).json({ 
        success: true,
        message: 'Callback processed',
        status: payment.status
      });

    } catch (sdkError) {
      console.error('Error checking status in callback:', sdkError);
      
      // If SDK fails, just acknowledge the callback
      return res.status(200).json({ 
        success: true,
        message: 'Callback received, status will be checked later'
      });
    }

  } catch (error) {
    console.error('Callback handling error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', details: error.message }
    });
  }
};

// Check Payment Status (using SDK)
const checkPaymentStatus = async (req, res) => {
  const { merchantTransactionId } = req.params;

  try {
    // First check in database
    const payment = await Payment.findOne({ merchantTransactionId })
      .populate('plan')
      .populate('subscription');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found' }
      });
    }

    // If payment is still pending, check with PhonePe using SDK
    if (payment.status === 'pending') {
      try {
        const client = getPhonePeClient();
        const orderStatus = await client.getOrderStatus(merchantTransactionId);

        console.log('PhonePe Order Status:', orderStatus);

        payment.callbackData = orderStatus;

        if (orderStatus.state === 'COMPLETED') {
          payment.status = 'success';
          payment.phonepeTransactionId = orderStatus.orderId;
          
          // Activate subscription
          const subscription = await UserSubscription.findById(payment.subscription);
          if (subscription) {
            subscription.status = 'active';
            subscription.paymentId = orderStatus.orderId;
            await subscription.save();
          }
        } else if (orderStatus.state === 'FAILED') {
          payment.status = 'failed';
          
          // Cancel subscription
          const subscription = await UserSubscription.findById(payment.subscription);
          if (subscription) {
            subscription.status = 'cancelled';
            await subscription.save();
          }
        }

        await payment.save();
      } catch (sdkError) {
        console.error('Error checking status with PhonePe SDK:', sdkError);
        // Continue with database status if SDK call fails
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        payment: {
          merchantTransactionId: payment.merchantTransactionId,
          phonepeTransactionId: payment.phonepeTransactionId,
          status: payment.status,
          amount: payment.amount,
          gstAmount: payment.gstAmount,
          totalAmount: payment.totalAmount,
          createdAt: payment.createdAt
        },
        subscription: payment.subscription ? {
          status: payment.subscription.status,
          plan: payment.plan
        } : null
      }
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', details: error.message }
    });
  }
};

// Get Payment History
const getPaymentHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const payments = await Payment.find({ user: userId })
      .populate('plan')
      .populate('subscription')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', details: error.message }
    });
  }
};

module.exports = {
  initiatePayment,
  handleCallback,
  checkPaymentStatus,
  getPaymentHistory
};