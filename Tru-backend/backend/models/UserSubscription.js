const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSubscriptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  contactsViewed: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'expired', 'cancelled'], 
    default: 'pending' 
  },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment' }, // Reference to Payment model
  paymentId: { type: String }, // PhonePe transaction ID for backward compatibility
  createdAt: { type: Date, default: Date.now }
});

// Index to easily find active subscription for a user
userSubscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
