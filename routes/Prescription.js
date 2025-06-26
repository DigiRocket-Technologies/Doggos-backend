const express=require("express");
const { addPrescription, getPetPrescriptions }=require("./../controllers/PrescriptionController");
const {protectedRoute}=require("../middlewares/protectedRoute")
const router=express.Router();

router.post('/addprescription',protectedRoute, addPrescription);
router.get('/getprescription/:petId', getPetPrescriptions);

module.exports=router

