const mongoose = require("mongoose");

const boardingSchema = new mongoose.Schema(
  {
    boardingType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisitType",
      required: true,
    },
    visitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
      required: true,
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Pet",
    },
    isSubscriptionAvailed: {
      type: Boolean,
      required: true,
      default: false,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      default: null,
    },
    entryTime: {
      type: Date,
      required: true,
    },
    numberOfDays: {
      type: Number,
      default: 1,
    },
    isBoarded: {
      type: Boolean,
      required: true,
      default: true,
    },
    exitTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Boarding = mongoose.model("Boarding", boardingSchema);

module.exports = Boarding;
