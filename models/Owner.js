const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true
  },
  address: {
    type:String,
    required:false,
  },
  segment: {
    type: String,
    enum: ['Day Care', 'Veterinary'],
    required: false
  },
  pets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);