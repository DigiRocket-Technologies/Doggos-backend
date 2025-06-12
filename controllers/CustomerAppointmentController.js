const Appointment = require('../models/Customerapointment');
const Service = require('../models/customerservice');
const User = require('../models/user');
const Pet = require('../models/pet');
const Owner = require('../models/Owner');



const getCustomerPetss = async (req, res) => {
  try {
    console.log("hey ");
    // const { email } = req.body; 
    const { email } = req.query;
    
    console.log(email);
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Customer email is required'
      });
    }
    
    // Find customer by email and populate pets in one query
    const customer = await Owner.findOne({ email: email }).populate('pets');
    
    console.log(typeof customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if no pets are registered for this customer
    if (!customer.pets || customer.pets.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pets registered for this customer',
        pets: []
      });
    }
    
    // Return pets if found
    res.status(200).json({
      success: true,
      message: `Found ${customer.pets.length} pet(s) for this customer`,
      pets: customer.pets
    });
    
  } catch (error) {
    console.error('Error fetching customer pets:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pets',
      error: error.message
    });
  }
};

const createAppointment = async (req, res) => {
  try {
    const {
      customerId,
      serviceId,
      serviceName,
      servicePrice,
      appointmentDate,
      appointmentTime,
      petName,
      petBreed,
      petAge,
      notes,
      totalAmount
    } = req.body;

    
    if (!customerId || !appointmentDate || !appointmentTime || !petName || !petAge) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all hii required fields'
      });
    }

    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    
    const existingAppointment = await Appointment.findOne({
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }

    const appointment = new Appointment({
      customerId,
      serviceId: serviceId || null,
      serviceName: serviceName || 'Service',
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      petName: petName.trim(),
      petBreed: petBreed ? petBreed.trim() : '',
      petAge: petAge.trim(),
      notes: notes ? notes.trim() : '',
      totalAmount: totalAmount || servicePrice || 0,
      status: 'pending'
    });

    await appointment.save();

    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name price duration category');

    res.status(201).json({
      success: true,
      data: populatedAppointment,
      message: 'Appointment booked successfully'
    });
  } catch (error) {

   console.log('Full error object:', error);
  console.log('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
};




const getCustomerAppointments = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Validate customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const appointments = await Appointment.find({ customerId })
      .populate('serviceId', 'name price duration category')
      .populate('customerId', 'name email phone')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      data: appointments,
      message: 'Appointments fetched successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// Get all appointments (admin)
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('serviceId', 'name price duration category')
      .populate('customerId', 'name email phone')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      data: appointments,
      message: 'All appointments fetched successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled'
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('serviceId', 'name price duration category')
     .populate('customerId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: error.message
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('serviceId', 'name price duration category')
      .populate('customerId', 'name email phone');

    res.status(200).json({
      success: true,
      data: populatedAppointment,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
};

// Get appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('serviceId', 'name price duration category')
      .populate('customerId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment fetched successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
};

module.exports = {
  createAppointment,
  getCustomerAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentById,
  getCustomerPetss
};