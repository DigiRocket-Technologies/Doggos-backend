const mongoose = require("mongoose");

const ScheduledVisit = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time:{
      type:String,
      required:true,
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
    },
    purpose: {
      type: String,
      required:true,
    },
    present: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScheduledVisit", ScheduledVisit);
