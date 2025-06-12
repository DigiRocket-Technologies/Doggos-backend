// routes/services.js
const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService
} = require('../controllers/Customerservicescontroller');


router.get('/getallservices', getAllServices);


router.get('/getservicesbyid/:id', getServiceById);


router.post('/createservice', createService);

module.exports = router;