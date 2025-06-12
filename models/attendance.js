const mongoose = require("mongoose");

const Attendance = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    List: [
      {
        petId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Pet",
        },
        purpose:{
          type:String
        },
        present: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", Attendance);
