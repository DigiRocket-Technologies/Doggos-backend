const express =require('express');
const { sendReminders, sendBirthdayReminders, sendOverdueReminders, getRemindersList, sendRemindersNew } = require('../controllers/remindersController');
const {protectedRoute}=require("../middlewares/protectedRoute")
const router=express.Router();

router.get("/sendreminders/:date",protectedRoute,sendRemindersNew);
router.post("/sendbirthdayreminders",protectedRoute,sendBirthdayReminders);
router.post('/sendoverduereminders',protectedRoute,sendOverdueReminders);
router.get("/getreminderslist/:date",protectedRoute,getRemindersList);
module.exports=router