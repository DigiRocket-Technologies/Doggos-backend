const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    daysLeft: {
      type: Number,
      min: 0,
      default: null,
    },
    numberOfGroomings: {
      type: Number,
      min: 0,
      default: null,
    },
    firstPaymentDate: {
      type: Date,
      required: true,
    },
    lastPaymentDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default:true,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
