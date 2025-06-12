const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  segment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'petSegment',
    required: true,
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
  quantitySold: {
    type: Number,
    required: true,
  },
  saleDate: {
    type: Date,
    default: Date.now,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Sales', salesSchema);
