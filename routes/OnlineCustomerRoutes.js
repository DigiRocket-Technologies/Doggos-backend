
const express = require('express');
const router = express.Router();
const { getAppointments, updateAppointmentStatus } = require('../controllers/Onlinecustomerappointment');
const {protectedRoute}=require("../middlewares/protectedRoute")


// const checkStaffRole = (req, res, next) => {
  
//   if (req.user.role !== 'staff' && req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Access denied. Staff role required.' });
//   }
//   next();
// };

router.get('/onlineappointments', protectedRoute, getAppointments);
router.patch('/onlineappointments/:id/status', protectedRoute, updateAppointmentStatus);

module.exports = router;