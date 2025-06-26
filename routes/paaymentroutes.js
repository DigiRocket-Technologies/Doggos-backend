const express =require('express');
const {createOrder, verifyPayment, verifyPendingPayment,verifyPayment2  } = require('../controllers/paymentController');
const {protectedRoute}=require("../middlewares/protectedRoute")
const router=express.Router();

router.post("/create-order",protectedRoute,createOrder);
router.post('/verify-payment',protectedRoute,verifyPayment);
router.post('/verify-pending-payment',protectedRoute,verifyPendingPayment);
router.post('/verify-payment2',protectedRoute,verifyPayment2);

module.exports=router