const express = require("express");
const {
  addPet,
  getPetList,
  getPetById,
  getPetDate,
  filterPetsByBreedAndSpecies,
  getFilteredPetsByNameAndPhone,
  getPetVisitHistory,
  getPetByBirthday,
  getBoardedPetList,
  editPetDetails,
  editOwnerDetails
} = require("../controllers/petController");
const router = express.Router();
const {protectedRoute}=require("../middlewares/protectedRoute")

router.post("/addpet",protectedRoute, addPet);
router.get("/getallpets",protectedRoute, getPetList);
router.get("/getpetdetails/:id",protectedRoute, getPetById);
router.get("/getpetsbyregistrationdate/:date",protectedRoute, getPetDate);
router.get("/getfilteredpetsbybreedandspecies",protectedRoute, filterPetsByBreedAndSpecies);
router.get("/getfilteredpetsbynameandphone",protectedRoute, getFilteredPetsByNameAndPhone);
router.get("/getpethistory/:petId",protectedRoute, getPetVisitHistory);
router.get("/getpetsbybirthday",protectedRoute,getPetByBirthday);
router.get("/getboardedpetslist",protectedRoute,getBoardedPetList);
router.post("/editpetdetails",protectedRoute,editPetDetails);
router.post("/editownerdetails",protectedRoute,editOwnerDetails)
module.exports = router;
