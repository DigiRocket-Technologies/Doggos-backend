const express =require('express');
const {createOrder, verifyPayment, verifyPendingPayment  } = require('../controllers/paymentController');
const {protectedRoute}=require("../middlewares/protectedRoute")
const router=express.Router();

router.post("/create-order",protectedRoute,createOrder);
router.post('/verify-payment',protectedRoute,verifyPayment);
router.post('/verify-pending-payment',protectedRoute,verifyPendingPayment);

module.exports=router