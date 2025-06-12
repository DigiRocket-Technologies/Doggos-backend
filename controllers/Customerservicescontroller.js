// controllers/serviceController.js
const Service = require('../models/customerservice');

// Get all services
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.status(200).json({
      success: true,
      data: services,
      message: 'Services fetched successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service,
      message: 'Service fetched successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

// Create new service (admin only)
const createService = async (req, res) => {
  try {
    const { name, description, price, duration, category } = req.body;

    const service = new Service({
      name,
      description,
      price,
      duration,
      category
    });

    await service.save();

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating service',
      error: error.message
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService
};