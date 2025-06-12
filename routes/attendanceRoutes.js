const express =require('express');

const { getAttendanceList, updateAttendanceList } = require('../controllers/attendanceController');
const {protectedRoute} =require("../middlewares/protectedRoute");
const { getScheduledVisit } = require('../controllers/VisitController');
const router=express.Router();

router.get("/getattendancelist/:date",protectedRoute,getScheduledVisit);
router.post("/editattendancelist",protectedRoute,updateAttendanceList);
router.post("/updateattendancelist",protectedRoute,updateAttendanceList);

module.exports=router