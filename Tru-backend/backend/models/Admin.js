const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  permissions: { type: [String], default: ['manage_users', 'manage_properties'] }
});

module.exports = mongoose.model('Admin', adminSchema);