const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../utils/constants');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // renamed for clarity
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  timeChangeRequest: {
    requested: { type: Boolean, default: false },
    reason: String,
    suggestedSlots: [String], // Array of available time slots
    requestedAt: Date
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);