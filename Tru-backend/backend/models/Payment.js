const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subscription: { 
    type: Schema.Types.ObjectId, 
    ref: 'UserSubscription'
  },
  plan: { 
    type: Schema.Types.ObjectId, 
    ref: 'SubscriptionPlan', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  gstAmount: { 
    type: Number, 
    required: true 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  merchantTransactionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phonepeTransactionId: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String 
  },
  responseCode: { 
    type: String 
  },
  responseMessage: { 
    type: String 
  },
  callbackData: { 
    type: Schema.Types.Mixed 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ merchantTransactionId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
