const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    subscriptionType: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"VisitType",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min:0,
    },
    duration: {
      type: Number,
      min:0,
      default:null,
    },
    numberOfGroomings:{
      type:Number,
      min:0,
      default:null,
    }
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

module.exports = SubscriptionPlan;
