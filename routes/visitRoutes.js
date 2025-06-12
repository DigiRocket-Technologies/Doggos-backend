const express =require('express');
const { addVisit, getVisit, addHostelVisit, addInquiryVisit, addDogParkVisit, getAllVisitPrices, addVeterinaryVisit, addDayCareVisit,getVisitList, addGroomingVisit, getAllVisitType, getBoardingCategoryList, addDaySchoolVisit, getVisitDetails, addShoppingVisit, addPlaySchoolVisit, buyy } = require('../controllers/VisitController');
const {protectedRoute}=require("../middlewares/protectedRoute");
const { updateHostelVisit } = require('../controllers/boardingController');
const router=express.Router();

router.post("/addvisit",protectedRoute,addVisit);
router.get("/getvisits",protectedRoute,getVisit)
router.post("/addhostelvisit",protectedRoute,addHostelVisit);
router.post("/addinquiryvisit",protectedRoute,addInquiryVisit);
router.post("/adddogparkvisit",protectedRoute,addDogParkVisit);
router.get("/getallvisitprices",protectedRoute,getAllVisitPrices);
router.post("/addveterinaryvisit",protectedRoute,addVeterinaryVisit);
router.post("/addhostelvisit",protectedRoute,addHostelVisit);
router.post("/adddayschoolvisit",protectedRoute,addDaySchoolVisit);
router.post("/addplayschoolvisit",protectedRoute,addPlaySchoolVisit);
router.post("/adddaycarevisit",protectedRoute,addDayCareVisit);
router.post("/addgroomingvisit",protectedRoute,addGroomingVisit);
router.post("/addshoppingvisit",protectedRoute,addShoppingVisit);
router.post("/getvisitlist",protectedRoute,getVisitList);
router.get("/getallvisittypes",protectedRoute,getAllVisitType);
router.get("/getboardingcategories",protectedRoute,getBoardingCategoryList);
router.post("/updatehostelvisit",protectedRoute,updateHostelVisit);
router.get("/getvisitdetails/:id",protectedRoute,getVisitDetails);
router.get("/buyy/:id",protectedRoute,buyy);

module.exports=router
