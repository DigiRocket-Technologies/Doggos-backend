const express =require('express');
const { buySubscription, getSubscriptionDetails, getAllSubscriptions, getCustomerSubscriptions } = require('../controllers/subscriptionController');
const {protectedRoute} =require("../middlewares/protectedRoute")
const router=express.Router();

router.post("/buysubscription",protectedRoute,buySubscription);
router.get("/getsubscriptiondetails",protectedRoute,getSubscriptionDetails);
router.get('/getallsubscription',protectedRoute,getAllSubscriptions);
router.get('/customer-subscriptions', getCustomerSubscriptions);

module.exports=router