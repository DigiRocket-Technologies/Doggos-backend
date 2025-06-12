const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertType: {
    type: String,
    enum: ['inventoryStock', 'vaccinationDue'],
    required: true,
  },
  itemName: {
    type: String, 
  },
  stockUnit: {
    type: Number, 
  },
  threshold: {
    type: Number, 
    default: 100,
  },
  petInfo: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet',
  },
  alertDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Alert', alertSchema);
