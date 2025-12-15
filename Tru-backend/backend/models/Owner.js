const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ownerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  idProofNumber: { type: String, required: true },
  idProofType: { type: String, required: true }, // e.g., 'Aadhar', 'Passport'
  idProofImageUrl: { type: String, required: true },
  properties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model('Owner', ownerSchema);
