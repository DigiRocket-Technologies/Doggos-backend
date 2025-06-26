const express =require('express');
const { buySubscription, getSubscriptionDetails, getAllSubscriptions, getCustomerSubscriptions,getPetsSubscription } = require('../controllers/subscriptionController');
const {protectedRoute} =require("../middlewares/protectedRoute")
const router=express.Router();

router.post("/buysubscription",protectedRoute,buySubscription);
router.get("/getsubscriptiondetails",protectedRoute,getSubscriptionDetails);
router.get('/getallsubscription',protectedRoute,getAllSubscriptions);
router.get('/customer-subscriptions', getCustomerSubscriptions);
router.get('/petssubscription/:petId', getPetsSubscription);

module.exports=router