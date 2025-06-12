const Appointment = require('../models/Customerapointment');
const User = require('../models/user');


const getAppointments = async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

  
    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.appointmentDate = {
        $gte: selectedDate,
        $lt: nextDay
      };
    }

    const appointments = await Appointment.find(query)
      .populate('customerId', 'fullName email')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching appointments' 
    });
  }
};


const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, visitNotes } = req.body;

  
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = { status };
    
    
    if (visitNotes && visitNotes.trim()) {
      updateData.notes = visitNotes.trim();
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customerId', 'fullName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status'
    });
  }
};

module.exports = {
  getAppointments,
  updateAppointmentStatus
};