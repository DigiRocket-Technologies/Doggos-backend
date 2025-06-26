const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  
  itemName: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  stockUnit: {
    type: String,
    enum: ["ml", "item", "tablet", "mg"], 
    required: true,
  },
  itemType: {
    type: String,
    enum: ["disposable", "syringe", "medicine", "vaccine"], 
    required: true,
  },
  unitCostPrice: {
    type: Number,
    required: true
  },
  unitMinRetailPriceNGO: {
    type: Number,
    required: true
  },
  unitMaxRetailPriceCustomer: {
    type: Number,
    required: true
  },
}, {
  timestamps: true 
});

module.exports = mongoose.model("Inventory", inventorySchema);