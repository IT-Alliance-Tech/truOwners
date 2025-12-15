const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ownerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null,
  },
  name: {
    type: String,
    required: false,
    default: null,
  },
  email: {
    type: String,
    required: false,
    default: null,
  },
  phone: {
    type: String,
    required: false,
    default: null,
  },
  idProofType: {
    type: String,
    required: false,
    default: "pending",
  },
  idProofNumber: {
    type: String,
    required: false,
    default: "pending",
  },
  idProofImageUrl: {
    type: String,
    required: false,
    default: "pending",
  },
  electricityBill: {
    type: String,
    required: true,
    default: "pending",
  },
  electricityBillImageUrl: {
    type: String,
    required: true,
    default: "pending",
  },
  properties: [{ type: Schema.Types.ObjectId, ref: "Property" }],
  verified: { type: Boolean, default: false },
});

module.exports = mongoose.model("Owner", ownerSchema);
