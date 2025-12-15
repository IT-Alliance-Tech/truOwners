const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'Owner', default: null },
  title: { type: String, required: true },
  description: { type: String },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  ownerDetails: {
    phone: String,
    idProofType: String,
    idProofNumber: String,
    idProofImageUrl: String,
    name: String,
    email: String,
    electricityBill: String,
    electricityBillImageUrl: String,
  },
  rent: { type: Number },
  price: { type: Number },
  deposit: { type: Number },
  listingType: {
    type: String,
    enum: ['rent', 'sell', 'lease', 'commercial'],
    default: 'rent'
  },
  category: {
    type: String,
    enum: ['residential', 'commercial'],
    default: 'residential'
  },
  propertyType: { type: String, enum: ['apartment', 'house', 'villa', 'condo', 'office', 'shop', 'warehouse', 'plot'] },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  area: { type: Number },
  amenities: [String],
  images: [String], // Array of image URLs
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'published', 'sold'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Property', propertySchema);