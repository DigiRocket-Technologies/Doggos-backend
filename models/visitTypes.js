const mongoose = require("mongoose");

const visitTypeSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: null,
    },
    halfdayprice: {
      type: Number,
      default: null,
    },
    isSubscriptionAvailable: {
      type: Boolean,
      default: false,
    },
    consultationPricePvt: {
      type: Number,
      default: null,
    },
    consultationPriceNgo: {
      type: Number,
      default: null,
    },
    consultationPriceNGOEmergency: {
      type: Number,
      default: null,
    },
    consultationPricePvt: {
      type: Number,
      default: null,
    },
    isBoardingAvailable: {
      type: Boolean,
      default: false,
    }, 
  },
  { timestamps: true }
);

const visitType = mongoose.model("VisitType", visitTypeSchema);

module.exports = visitType;
