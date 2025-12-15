const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertyViewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  subscription: { type: Schema.Types.ObjectId, ref: 'UserSubscription', required: true },
  viewedAt: { type: Date, default: Date.now }
});

// Ensure a user views a property only once per subscription (logically handled in controller, but index helps)
propertyViewSchema.index({ user: 1, property: 1, subscription: 1 }, { unique: true });

module.exports = mongoose.model('PropertyView', propertyViewSchema);
