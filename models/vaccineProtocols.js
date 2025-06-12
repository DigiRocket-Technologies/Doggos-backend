const mongoose = require('mongoose');


const vaccineSchema = new mongoose.Schema({
  vaccineName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  recommendedDay: {
    type: Number,
    required: true,
  },
  isMandatory: {
    type: Boolean,
    default: true,
  },
  boosterSchedule: [
    {
      boosterName: {
        type: String,
        required: true,
      },
      dayFromPrevious: {
        type: Number,
        required: true, 
      },
      isAnnual: {
        type: Boolean,
        default: false, 
      },
    },
  ],
});


const vaccinationProtocolSchema = new mongoose.Schema({
  species: {
    type: String,
    required: true, 
  },
  defaultVaccines: [vaccineSchema], 
  additionalNotes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('VaccinationProtocol', vaccinationProtocolSchema);
