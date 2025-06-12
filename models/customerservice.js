const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Service duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: {
      values: ['grooming', 'hostel', 'veterinary', 'dayschool', 'playschool', 'daycare'],
      message: 'Category must be one of: grooming, hostel, veterinary, dayschool, playschool, daycare'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String // URLs to service images
  }],
  features: [{
    type: String // List of service features
  }]
}, {
  timestamps: true
});

// Index for faster queries
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ price: 1 });

module.exports = mongoose.model('Service', serviceSchema);