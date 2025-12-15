const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  properties: [{ type: Schema.Types.ObjectId, ref: 'Property' }]
});

module.exports = mongoose.model('Wishlist', wishlistSchema);