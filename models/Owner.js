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
  pets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);