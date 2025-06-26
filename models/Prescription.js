const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
 
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },

  customerType: {
    type: String,
    enum: ['pvtltd', 'NGO'],
    required: true
  },


  items: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],


  tablets: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],


  mg: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],


  ml: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],

 
  nextFollowUp: {
    type: Date
  },


  followUpTime: {
    type: String
  },

  followUpPurpose: {
    type: String
  },

  diagnosis: {
    type: String
  },

  price: {
    type: Number,
    required:true,
    min : 0
  }

}, {
  timestamps: true
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;