const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionPlanSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    enum: ['Silver Plan', 'Gold Plan', 'Diamond Plan'],
    unique: true 
  },
  price: { type: Number, required: true },
  contactLimit: { type: Number, required: true },
  validityDays: { type: Number, required: true, default: 15 },
  description: { type: String },
  features: [String],
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
