const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  ownerInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: true,
  },
  dogInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    required: true,
  },
  purposeOfVisit: {
    type: String,
    required: true,
  },
  medicineGiven: [
    {
      medicineName: {
        type: String,
        required: true,
      },
      quantityGiven: {
        type: Number,
        required: true,
      },
    },
  ],
  nextFollowUpDate: {
    type: Date,
  },
  alertReminder: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("appointment", appointmentSchema);
