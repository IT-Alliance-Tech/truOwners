const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, "Please provide your phone number"],
  },
  message: {
    type: String,
    required: [true, "Please provide a message"],
  },
  interestedIn: {
    type: String,
    enum: ["SELL", "RENT", "LEASE", "COMMERCIAL", "OTHER"],
    default: "OTHER",
  },
  status: {
    type: String,
    enum: ["NEW", "REVIEWED", "CONTACTED", "CLOSED"],
    default: "NEW",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Inquiry", inquirySchema);
