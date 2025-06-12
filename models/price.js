const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    consultationFees: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Price = mongoose.model("Price", priceSchema);

module.exports = Price;
