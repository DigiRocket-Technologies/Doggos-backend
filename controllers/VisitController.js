const express = require("express");
const mongoose = require("mongoose");
const Pet = require("../models/pet");
const Visit = require("../models/Visit");
const Inventory = require("../models/inventory");
const Attendance = require("../models/attendance");
const Boarding = require("../models/boarding");
const Subscription = require("../models/subscription");
const Price = require("../models/price");
const scheduledVisit = require("../models/scheduledVisit");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const VisitType = require("../models/visitTypes");
const SubscriptionPlan = require("../models/subscriptionPlan");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.addVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { petId, visitForm, totalPrice } = req.body;
    const {
      purpose,
      itemDetails,
      nextFollowUp,
      followUpTime,
      followUpPurpose,
      customerType,
    } = visitForm;

    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new Error("Invalid pet ID");
    }

    // Validate each item in itemDetails
    for (const itemDetail of itemDetails) {
      const { item, dose, volumeML } = itemDetail;

      const inventoryItem = await Inventory.findById(item);
      if (!inventoryItem) {
        throw new Error(`Inventory item with ID ${item} not found`);
      }

      if (inventoryItem.totalVolume < volumeML) {
        throw new Error(
          `Insufficient volume for item ${inventoryItem.itemName}`
        );
      }

      // Update inventory
      const stockused = volumeML / inventoryItem.volumeML;

      inventoryItem.stockUnit -= stockused;

      if (inventoryItem.totalVolume) {
        inventoryItem.totalVolume -= volumeML;
      }

      await inventoryItem.save({ session });

      const petobtain = await Pet.findById(petId).session(session);
      if (!petobtain) throw new Error("Pet not found");

      const it = {};

      it["name"] = inventoryItem.itemName;
      it["numberOfDose"] = dose;

      const existingVaccination = petobtain.vaccinations.find(
        (vac) => vac.name === inventoryItem.itemName
      );

      if (existingVaccination) {
        existingVaccination.numberOfDose = dose;
      } else {
        petobtain.vaccinations.push(it);
      }

      await petobtain.save({ session });
    }
    // Create a new visit record
    const visit = new Visit({
      pet: petId,
      purpose,
      itemDetails,
      nextFollowUp: new Date(`${nextFollowUp}T${followUpTime}`),
      followUpPurpose,
      customerType,
      price: totalPrice,
    });

    await visit.save({ session });

    const date = new Date(nextFollowUp);

    const attendance = await Attendance.findOne({
      date,
    });

    if (attendance) {
      attendance.List.push({ petId, purpose: followUpPurpose });
      await attendance.save();
    } else {
      const attendance = new Attendance({
        date,
      });
      await attendance.save();
      attendance.List.push({ petId, purpose: followUpPurpose });
      await attendance.save();
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Visit saved successfully",
    });
  } catch (error) {
    console.log("error in addvisit controllere", error);
    await session.abortTransaction();
    console.log("Error in addvisit controller ", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getVisit = async (req, res) => {
  try {
    const { type } = req.query;
    const today = new Date();

    let nextDate = new Date();

    if (type === "today") {
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 2);
    } else {
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 7);
    }

    nextDate.setHours(0, 0, 0, 0);
    const endOfNextDate = new Date(nextDate);
    endOfNextDate.setHours(23, 59, 59, 999);

    const List = await Visit.find({
      nextFollowUp: {
        $gte: nextDate,
        $lt: endOfNextDate,
      },
    }).populate({
      path: "pet",
      populate: {
        path: "owner",
      },
    });

    if (List) {
      return res.status(200).json({
        success: true,
        message: "List fetched successfully",
        List,
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "Invalid data",
      });
    }
  } catch (error) {
    console.log("Error in getVisitController", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.buyy = async (req, res) => {
  try {
    const VisitId = req.params.id;
    if (!VisitId) {
      return res.status(400).json({
        success: false,
        message: "please choose a visit to get its detail",
      });
    }

    const VisitSaved = await Visit.findOne({ _id: VisitId });

    if (!VisitSaved) {
      return res.status(400).json({
        success: false,
        message: "VisitSaved not found",
      });
    }

    console.log(VisitSaved);

    const PlanDetails = await SubscriptionPlan.findOne({
      _id: VisitSaved?.details?.subscriptionPlan,
    }).populate({ path: "subscriptionType" });

    console.log(PlanDetails);

    if (!PlanDetails) {
      return res.status(400).json({
        success: false,
        message: "subscription id not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "subscription type found",
      data: PlanDetails,
    });
  } catch (error) {
    console.log("error in buy subscription detail controller", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong in buysbscriptionvisitdetail",
    });
  }
};

exports.getVisitDetails = async (req, res) => {
  try {
    console.log("Fetching visit with ID:", req.params.id);

    let Visit, Inventory;

    try {
      Visit = require("../models/Visit");
      console.log("Visit model loaded successfully");
    } catch (error) {
      console.error("Failed to load Visit model:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Visit model not found",
        error: error.message,
      });
    }

    try {
      Inventory = require("../models/inventory");
      console.log("Inventory model loaded successfully");
    } catch (error) {
      console.error("Failed to load Inventory model:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Inventory model not found",
        error: error.message,
      });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    console.log("Attempting to find visit in database...");
    let visit;
    try {
      visit = await Visit.findById(req.params.id)
        .populate("pet")
        .populate("visitType")
        .populate({
          path: "pet",
          populate: {
            path: "owner",
            model: "Owner",
          },
        });

      console.log("Database query completed");
    } catch (dbError) {
      console.error("Database error when finding visit:", dbError.message);
      return res.status(500).json({
        success: false,
        message: "Database error when finding visit",
        error: dbError.message,
      });
    }

    if (!visit) {
      console.log("Visit not found with ID:", req.params.id);
      return res
        .status(404)
        .json({ success: false, message: "Visit not found" });
    }

    const details = visit.details || {};

    const medicines = Array.isArray(details.medicines) ? details.medicines : [];
    const vaccines = Array.isArray(details.vaccines) ? details.vaccines : [];

    const medicineIds = medicines
      .map((med) => {
        if (!med || typeof med !== "object") {
          console.log("Invalid medicine entry:", med);
          return null;
        }
        const id = med.id || med.medicineId;
        if (!id) {
          console.log("Medicine with no ID:", med);
          return null;
        }
        const finalId = typeof id === "object" ? id.toString() : id;
        console.log("Extracted medicine ID:", finalId);
        return finalId;
      })
      .filter(Boolean);

    const vaccineIds = vaccines
      .map((vac) => {
        if (!vac || typeof vac !== "object") {
          console.log("Invalid vaccine entry:", vac);
          return null;
        }
        const id = vac.id || vac.vaccineId;
        if (!id) {
          console.log("Vaccine with no ID:", vac);
          return null;
        }
        const finalId = typeof id === "object" ? id.toString() : id;
        console.log("Extracted vaccine ID:", finalId);
        return finalId;
      })
      .filter(Boolean);

    console.log("Final medicine IDs:", medicineIds);
    console.log("Final vaccine IDs:", vaccineIds);

    const allIds = [...medicineIds, ...vaccineIds];
    console.log("All inventory IDs to find:", allIds);

    let inventoryItems = [];
    if (allIds.length) {
      try {
        console.log("Querying inventory items...");
        inventoryItems = await Inventory.find({ _id: { $in: allIds } });
        console.log("Found inventory items:", inventoryItems.length);
        console.log("Inventory items:", JSON.stringify(inventoryItems));
      } catch (inventoryError) {
        console.error("Error finding inventory items:", inventoryError.message);
      }
    }

    console.log("Processing visit data...");
    const visitData = JSON.parse(JSON.stringify(visit));

    if (!visitData.details) visitData.details = {};

    if (
      Array.isArray(visitData.details.medicines) &&
      visitData.details.medicines.length
    ) {
      visitData.details.medicines = visitData.details.medicines.map((med) => {
        if (!med || typeof med !== "object") {
          console.log("Skipping invalid medicine object");
          return { name: "Invalid Medicine Data" };
        }

        const id = med.id || med.medicineId;
        if (!id) {
          console.log("Medicine missing ID");
          return { ...med, name: "Medicine ID Missing" };
        }

        const idStr = typeof id === "object" ? id.toString() : id;
        const medicineInfo = inventoryItems.find(
          (m) => m._id.toString() === idStr
        );

        if (medicineInfo) {
          console.log(
            `Found inventory item for medicine ID ${idStr}: ${medicineInfo.itemName}`
          );
          return {
            ...med,
            name: medicineInfo.itemName,
            unit: medicineInfo.stockUnit || "units",
            category: medicineInfo.itemType,
            manufacturer: medicineInfo.manufacturer || "Unknown",
          };
        } else {
          console.log(`No inventory item found for medicine ID ${idStr}`);
          return { ...med, name: "Unknown Medicine" };
        }
      });
    } else {
      visitData.details.medicines = [];
    }

    if (
      Array.isArray(visitData.details.vaccines) &&
      visitData.details.vaccines.length
    ) {
      visitData.details.vaccines = visitData.details.vaccines.map((vac) => {
        if (!vac || typeof vac !== "object") {
          console.log("Skipping invalid vaccine object");
          return { name: "Invalid Vaccine Data" };
        }

        const id = vac.id || vac.vaccineId;
        if (!id) {
          console.log("Vaccine missing ID");
          return { ...vac, name: "Vaccine ID Missing" };
        }

        const idStr = typeof id === "object" ? id.toString() : id;
        const vaccineInfo = inventoryItems.find(
          (v) => v._id.toString() === idStr
        );

        if (vaccineInfo) {
          console.log(
            `Found inventory item for vaccine ID ${idStr}: ${vaccineInfo.itemName}`
          );
          return {
            ...vac,
            name: vaccineInfo.itemName,
            manufacturer: vaccineInfo.manufacturer || "Unknown",
            target: vaccineInfo.target || "General",
            type: vaccineInfo.itemType,
          };
        } else {
          console.log(`No inventory item found for vaccine ID ${idStr}`);
          return { ...vac, name: "Unknown Vaccine" };
        }
      });
    } else {
      visitData.details.vaccines = [];
    }

    console.log("Sending successful response");
    return res.status(200).json({
      success: true,
      data: visitData,
    });
  } catch (error) {
    console.error("Unhandled error in getVisitDetails:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Error fetching visit details",
      error: error.message,
    });
  }
};

exports.addInquiryVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      petId,
      visitType,
      note,
      followUpPurpose,
      nextFollowUp,
      followUpTime,
    } = req.body;

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

    if (!note) {
      return res.json({
        success: false,
        message: "Enter notes to save an inquiry  visit",
      });
    }

    if (nextFollowUp && followUpPurpose && followUpTime) {
      const newscheduledVisit = new scheduledVisit({
        date: new Date(nextFollowUp),
        time: followUpTime,
        petId,
        purpose: followUpPurpose,
      });

      await newscheduledVisit.save({ session });
    }
    // ... your code here ...}
    else if (!nextFollowUp && !followUpPurpose && !followUpTime) {
      // All three variables have falsy values.
      // ... your code here ...
    } else {
      return res.json({
        succes: false,
        message: "Please fill all followup details",
      });
    }

    // Create a new visit record
    const details = {};
    details.note = note;
    details.price = 0;
    const visit = new Visit({
      pet: petId,
      visitType,
      details,
      nextFollowUp:
        nextFollowUp && followUpTime
          ? new Date(`${nextFollowUp}T${followUpTime}`)
          : null,
    });

    await visit.save({ session });

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Inquiry visit saved successfully",
    });
  } catch (error) {
    console.log("error in addInquiryVisit controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.addDogParkVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { petId, discount = 0, visitType, details: details_new,
    } = req.body;

    const {payment}=details_new;

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

    const visitDetails = await VisitType.findOne({ _id: visitType });

    if (discount < 0)
      return res.json({
        success: false,
        message: "Discount cannot be negative",
      });

    if (discount >= visitDetails?.price) {
      return res.json({
        success: false,
        message: "Discount must be less than original price",
      });
    }

    // Create a new visit record
    const details = {};
    details.price = visitDetails.price - discount;
    details.payment=payment;

    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    const boardingDetails = await Boarding.findOne({
      petId,
      isBoarded: true,
    }).populate({ path: "boardingType", select: "purpose" });

    if (boardingDetails) {
      return res.json({
        success: false,
        message: `Pet has already been boarded in ${boardingDetails?.boardingType?.purpose}`,
      });
    }

    const boarding = new Boarding({
      boardingType: visitType,
      visitId: visit?._id,
      petId,
      entryTime: new Date(),
    });

    await boarding.save({ session });

    await session.commitTransaction();

    return res.json({
      success: true,
      message: `Pet has been boarded in ${visitDetails?.purpose} successfully`,
    });
  } catch (error) {
    console.log("error in addDogParkVisit controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

exports.addVeterinaryVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      petId,
      visitType,
      followUpPurpose,
      nextFollowUp,
      followUpTime,
      customerType,
      details:details_new,
    } = req.body;

    const {payment,
       items,
      tablets,
      ml,
      mg}=details_new

    console.log(items);
    

    if (items?.length === 0 && tablets?.length === 0 && ml?.length === 0 && mg?.length === 0) {
      return res.json({
        success: false,
        message: "select atleast any to save the visit",
      });
    }

    if (nextFollowUp && followUpPurpose && followUpTime) {
      const newscheduledVisit = new scheduledVisit({
        date: new Date(nextFollowUp),
        time: followUpTime,
        petId,
        purpose: followUpPurpose,
      });

      await newscheduledVisit.save({ session });
    }
    
    else if (!nextFollowUp && !followUpPurpose && !followUpTime) {
    
    } else {
      return res.json({
        succes: false,
        message: "Please fill all followup details",
      });
    }

    const calculateTotalPriceAndUpdateStock = async () => {
      const itemIds = items.map((it) => it.id);
      const TabIds = tablets.map((tb) => tb.id);
      const MlIds = ml.map((m) => m.id);
      const MgIds = mg.map((g) => g.id);
      const allIds = [...new Set([...itemIds, ...TabIds, ...MlIds, ...MgIds])]; 

      
      const inventoryItems = await Inventory.find({ _id: { $in: allIds } })
        .session(session)
        .lean();

    
      const inventoryMap = inventoryItems.reduce((map, item) => {
        map[item._id.toString()] = item;
        return map;
      }, {});

      //items k liy
      let itemTotal = 0;
      for (const med of items) {
        const item = inventoryMap[med.id];
        if (!item) {
          throw new Error(`Inventory item with ID ${med.id} not found`);
        }
        if (!med.id || !med.quantity || med.quantity <= 0) {
          throw new Error(
            "Each item must have a valid ID and positive quantity"
          );
        }
        if (item.stock < med.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }
        const price =
          customerType === "NGO"
            ? item.unitMinRetailPriceNGO
            : item.unitMaxRetailPriceCustomer;
        itemTotal += price * med.quantity;
      }

// tablets k liy
       let tabletsTotal = 0;
      for (const tb of tablets) {
        const tablet = inventoryMap[tb.id];
        if (!tablet) {
          throw new Error(`Inventory item with ID ${tb.id} not found`);
        }
        if (!tb.id || !tb.quantity || tb.quantity <= 0) {
          throw new Error(
            "Each item must have a valid ID and positive quantity"
          );
        }
        if (tablet.stock < tb.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }
        const price =
          customerType === "NGO"
            ? tablet.unitMinRetailPriceNGO
            : tablet.unitMaxRetailPriceCustomer;
        tabletsTotal += price * tb.quantity;
      }

// ml k liy
       let MlTotal = 0;
      for (const m of ml) {
        const mll = inventoryMap[m.id];
        if (!mll) {
          throw new Error(`Inventory item with ID ${m.id} not found`);
        }
        if (!m.id || !m.quantity || m.quantity <= 0) {
          throw new Error(
            "Each item must have a valid ID and positive quantity"
          );
        }
        if (mll.stock < m.quantity) {
          throw new Error(`Insufficient stock for ${mll.name}`);
        }
        const price =
          customerType === "NGO"
            ? mll.unitMinRetailPriceNGO
            : mll.unitMaxRetailPriceCustomer;
        MlTotal += price * m.quantity;
      }


      // mg k liy
       let mgTotal = 0;
      for (const g of mg) {
        const mgg = inventoryMap[g.id];
        if (!mgg) {
          throw new Error(`Inventory mgg with ID ${g.id} not found`);
        }
        if (!g.id || !g.quantity || g.quantity <= 0) {
          throw new Error(
            "Each mgg must have a valid ID and positive quantity"
          );
        }
        if (mgg.stock < g.quantity) {
          throw new Error(`Insufficient stock for ${mgg.name}`);
        }
        const price =
          customerType === "NGO"
            ? mgg.unitMinRetailPriceNGO
            : mgg.unitMaxRetailPriceCustomer;
        mgTotal += price * g.quantity;
      }


      // Validate and calculate vaccine total
      // let tabletsTotal = 0;
      // for (const vac of tablets) {
      //   const Tablet = inventoryMap[vac.id];
      //   if (!Tablet) {
      //     throw new Error(`Inventory item with ID ${vac.id} not found`);
      //   }
      //   if (!vac.id || !vac.volume || vac.volume <= 0) {
      //     throw new Error(
      //       "Each vaccine must have a valid ID and positive volume"
      //     );
      //   }
      //   const requiredStock = vac.volume / Tablet.volumeML;
      //   if (vaccine.stockUnit < requiredStock) {
      //     throw new Error(`Insufficient stock for ${vaccine.name}`);
      //   }
      //   if (vaccine.totalVolume < vac.volume) {
      //     throw new Error(`Insufficient volume for vaccine: ${vaccine.name}`);
      //   }
      //   const price =
      //     customerType === "NGO"
      //       ? vaccine.unitMinRetailPriceNGO
      //       : vaccine.unitMaxRetailPriceCustomer;
      //   vaccineTotal += price * vac.volume;
      // }

      // Prepare bulk updates
      const bulkOps = [];

      // Update medicine stock
      
      for (const med of items) {
         const item = inventoryMap[med.id];
         bulkOps.push({
          updateOne: {
            filter: { _id: item._id },
            update: { $inc: { stock: -med.quantity } },
          },
        });
      }

       for (const med of tablets) {
        const item = inventoryMap[med.id];
        bulkOps.push({
          updateOne: {
            filter: { _id: item._id },
            update: { $inc: { stock: -med.quantity } },
          },
        });
      }

       for (const med of ml) {
        const item = inventoryMap[med.id];
        bulkOps.push({
          updateOne: {
            filter: { _id: item._id },
            update: { $inc: { stock: -med.quantity } },
          },
        });
      }

       for (const med of mg) {
        const item = inventoryMap[med.id];
        bulkOps.push({
          updateOne: {
            filter: { _id: item._id },
            update: { $inc: { stock: -med.quantity } },
          },
        });
      }

      // Update vaccine stock and volume
      // for (const vac of vaccines) {
      //   const vaccine = inventoryMap[vac.id];
      //   const requiredStock = vac.volume / vaccine.volumeML;
      //   bulkOps.push({
      //     updateOne: {
      //       filter: { _id: vaccine._id },
      //       update: {
      //         $inc: {
      //           stockUnit: -requiredStock,
      //           totalVolume: -vac.volume,
      //         },
      //         $set: {
      //           stockUnit:
      //             vaccine.totalVolume - vac.volume <= 0 ? 0 : undefined,
      //         },
      //       },
      //     },
      //   });
      // }

      // Execute bulk updates
      if (bulkOps.length > 0) {
        await Inventory.bulkWrite(bulkOps, { session });
      }

      // Return total price
      return itemTotal + tabletsTotal + MlTotal + mgTotal;
    };

    const totalPrice = await calculateTotalPriceAndUpdateStock();

    // Create a new visit record
    const details = {};
    details.items = items.length ? items : null;
    details.tablets = tablets.length ? tablets : null;
    details.ml = ml.length ? ml : null;
    details.mg = mg.length ? mg : null;

    details.nextFollowUp =
      nextFollowUp && followUpTime
        ? new Date(`${nextFollowUp}T${followUpTime}`)
        : null;
    details.followUpPurpose = followUpPurpose ? followUpPurpose : "";
    details.customerType = customerType;
    details.price = totalPrice;
    details.payment=payment
    

    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    console.log("visit saved");

    const itemIds = items.map((item) => item.id);
    const tabletIds = items.map((item) => item.id);
    const mlIds = items.map((item) => item.id);
    const mgIds = items.map((item) => item.id);

    const medicationIds=[...itemIds,...tabletIds,...mlIds,...mgIds]

    const vaccineItems = await Inventory.find({ _id: { $in: medicationIds } })
      .session(session)
      .lean();

    const pet = await Pet.findOne({ _id: petId });

    console.log("he",vaccineItems);
    
    const updatedVaccinations = [...pet.vaccinations]; 

  
  vaccineItems.forEach((item) => {
          const vaccineIndex = updatedVaccinations.findIndex(
            (vac) => vac.name === item.itemName
          );
          
          if (vaccineIndex !== -1) {
            
            updatedVaccinations[vaccineIndex] = {
              name: item.itemName,
            };
          } else {
            
            updatedVaccinations.push({
              name: item.itemName,
            });
          }
        });
 
  
    
    pet.vaccinations=[...updatedVaccinations];
    await pet.save({session});

    await session.commitTransaction();
    return res.json({
      success: true,
      message: "Veterinary visit saved successfully",
    });
  } catch (error) {
    console.log("error in addVeterinaryVisit controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

exports.addHostelVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      petId,
      discount,
      numberOfDays,
      isSubscriptionAvailed,
      planId,
      price,
      visitType,
       details: details_new,
    } = req.body;


    const {payment}=details_new;

    let pricee = price;

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }
       

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

    if (isSubscriptionAvailed) {
      const subscription = Subscription.find({ planId, petId });
      if (!subscription) {
        return res.json({
          success: false,
          message: "The pet has no subscription for given plan",
        });
      }
      pricee = 0;
    } else if (discount) {
      const Hostel = await VisitType.findOne({ _id: visitType });

      if (discount >= Hostel?.price) {
        return res.json({
          success: false,
          message: "Discount must be less than original price",
        });
      }

      pricee = (Hostel?.price - discount) * numberOfDays;
    }
    //  else {
    //   console.log("hii")
    //   return res.json({
    //     success: false,
    //     message: "Either avail subscription or buy for some days",
    //   });
    // }
     

    const details = {};

    details["isSubscriptionAvailed"] = isSubscriptionAvailed;
    details["price"] = pricee;
    details["numberOfDays"] = numberOfDays;
    details["discount"] = discount;

    details.payment=payment;


    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    const boarding = new Boarding({
      boardingType: visitType,
      visitId: visit._id,
      isSubscriptionAvailed: isSubscriptionAvailed,
      planId: isSubscriptionAvailed ? planId : null,
      petId,
      entryTime: new Date(),
      numberOfDays,
    });

    await boarding.save({ session });
    await session.commitTransaction();

    const timeRightNow = dayjs(boarding.entryTime)
      .tz("Asia/Kolkata")
      .format("DD MM YYYY HH:mm:ss");
    return res.json({
      success: true,
      timeRightNow,
      message: "Hostel visit saved successfully",
    });
  } catch (error) {
    console.log("error in HostelVisit controller", error);
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.addDayCareVisit = async (req, res) => {
  console.log(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { petId, discount = 0, visitType, details} = req.body;

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

    const visitDetails = await VisitType.findOne({ _id: visitType });

    if (discount < 0)
      return res.json({
        success: false,
        message: "Discount cannot be negative",
      });

    if (discount >= visitDetails?.price) {
      return res.json({
        success: false,
        message: "Discount must be less than original price",
      });
    }

  
    details.price = visitDetails?.price - discount;
   

    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    const boarding = new Boarding({
      boardingType: visitType,
      visitId: visit?._id,
      petId,
      entryTime: new Date(),
    });

    await boarding.save({ session });

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Day Care visit saved successfully",
    });
  } catch (error) {
    console.log("error in addDayCareVisit controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.addDaySchoolVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      petId,
      discount = 0,
      isSubscriptionAvailed,
      planId,
      visitType,
      details: details_new,
    } = req.body;

    const {payment}=details_new;

    let price = 0;

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

    const visitDetails = await VisitType.findOne({ _id: visitType });

    if (isSubscriptionAvailed) {
      const subscription = Subscription.findOne({ planId, petId });
      if (!subscription) {
        return res.json({
          success: false,
          message: "No subscription exist for given pet",
        });
      }
      price = 0;
    } else {
      if (discount >= visitDetails?.price) {
        return res.json({
          success: false,
          message: "Discount must be less than original price",
        });
      }
      price = visitDetails?.price - discount;
    }

    details = {};
    details.price = price;
    details.payment=payment;

    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    const boarding = new Boarding({
      boardingType: visitType,
      visitId: visit._id,
      isSubscriptionAvailed: isSubscriptionAvailed,
      planId: isSubscriptionAvailed ? planId : null,
      petId,
      entryTime: new Date(),
    });

    await boarding.save({ session });
    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Day School visit saved successfully",
    });
  } catch (error) {
    console.log("error in Day School visit controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.addPlaySchoolVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      petId,
      discount = 0,
      isSubscriptionAvailed,
      planId,
      visitType,
      details: details_new,
    } = req.body;

    const {payment}=details_new;

    console.log(planId)

    let price = 0;

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

    const visitDetails = await VisitType.findOne({ _id: visitType });

    if (isSubscriptionAvailed) {
      const subscription = Subscription.findOne({ planId, petId });
      if (!subscription) {
        return res.json({
          success: false,
          message: "No subscription exist for given pet",
        });
      }
      price = 0;
    } else {
      if (discount >= visitDetails?.price) {
        return res.json({
          success: false,
          message: "Discount must be less than original price",
        });
      }
      price = visitDetails?.price - discount;
    }

    details = {};
    details.price = price;
     details.payment=payment;

     console.log("hi");

    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    const boarding = new Boarding({
      boardingType: visitType,
      visitId: visit._id,
      isSubscriptionAvailed: isSubscriptionAvailed,
      petId,
      planId,
      entryTime: new Date(),
    });

    await boarding.save({ session });
    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Day School visit saved successfully",
    });
  } catch (error) {
    console.log("error in Day School visit controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getAllVisitPrices = async (req, res) => {
  try {
    const prices = await Price.find({});

    return res.status(200).json({
      success: true,
      message: "Prices fetched successfully",
      prices,
    });
  } catch (error) {
    console.log("Error in get all prices controller", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getVisitList = async (req, res) => {
  try {
    // const { date } = req.body;

    // if (!date) {
    //   return res.json({
    //     success: false,
    //     message: "Please provide a date to see corresponding visit",
    //   });
    // }

    // const targetDate = new Date(date);

    // const nextDate = new Date(targetDate);
    // nextDate.setDate(targetDate.getDate() + 1);

    // const List = await Visit.find({
    //   createdAt: {
    //     $gte: targetDate,
    //     $lt: nextDate,
    //   },
    // }).populate(
    //   [  {

    //     path: "pet",
    //     populate: {

    //       path: "owner",
    //     },
    //   }, {path:"visitType",select:"purpose"}]
    // );

    const { date, purpose, name } = req.query;

    const query = {};

    // Date filter
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(targetDate.getDate() + 1);

      query.createdAt = {
        $gte: targetDate,
        $lt: nextDate,
      };
    }

    const aggregatePipeline = [
      {
        $lookup: {
          from: "visittypes",
          localField: "visitType",
          foreignField: "_id",
          as: "visitType",
        },
      },
      { $unwind: "$visitType" },
      {
        $lookup: {
          from: "pets",
          localField: "pet",
          foreignField: "_id",
          as: "pet",
        },
      },
      { $unwind: "$pet" },
      {
        $lookup: {
          from: "owners",
          localField: "pet.owner",
          foreignField: "_id",
          as: "pet.owner",
        },
      },
      { $unwind: "$pet.owner" },
      {
        $match: {
          ...query,
          ...(purpose
            ? { "visitType.purpose": { $regex: purpose, $options: "i" } }
            : {}),
          ...(name ? { "pet.name": { $regex: name, $options: "i" } } : {}),
        },
      },
    ];

    const List = await Visit.aggregate(aggregatePipeline);

    return res.json({
      success: true,
      List,
      message: "List fetched successfullly",
    });
  } catch (error) {
    console.log("error in get visit list controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getScheduledVisit = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.json({
        success: false,
        message: "Please provide a date to see corresponding visit",
      });
    }

    const targetDate = new Date(date);

    const List = await scheduledVisit
      .find({
        date: targetDate,
      })
      .populate({
        path: "petId",
        populate: {
          path: "owner",
        },
      });

    return res.json({
      success: true,
      List,
      message: "List fetched successfullly",
    });
  } catch (error) {
    console.log("error in get scheduled visit controller", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addGroomingVisit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
 

  try {
    const {
      petId,
      discount = 0,
      isSubscriptionAvailed,
      planId,
      visitType,
     details : details_new, 
    } = req.body;

    const {payment}=details_new;
    console.log("payment",payment);

    let price = 0;

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

     console.log("hi2");

    const visitDetails = await VisitType.findOne({ _id: visitType });
    details = {};

    if (isSubscriptionAvailed) {
      const subscription = await Subscription.findOne({ planId, petId });
      if (!subscription) {
        return res.json({
          success: false,
          message: "No subscription exist for given pet",
        });
      }

      const temp = subscription.numberOfGroomings;

      subscription.numberOfGroomings = temp - 1 >= 0 ? temp - 1 : 0;

      if (temp - 1 <= 0) subscription.active = false;

      await subscription.save({ session });
      details.subscriptionAvailed = "Yes";
      price = 0;
    } else {
      if (discount >= visitDetails?.price) {
        return res.json({
          success: false,
          message: "Discount must be less than original price",
        });
      }
      price = visitDetails?.price - discount;
    }

     console.log("hi3");

    details.price = price;
    details.payment=payment;

     console.log("hi4");
     
    console.log(details);
    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    await session.commitTransaction();
    return res.json({
      success: true,
      message: "Grooming visit saved successfully",
    });
  } catch (error) {
    console.log("error in Grooming Visit controller", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getAllVisitType = async (req, res) => {
  try {
    const visitTypes = await VisitType.find({});

    return res.json({
      success: true,
      visitTypes,
      message: "Visit Type fetched successfully",
    });
  } catch (error) {
    console.log("error in getallvisittype controller", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBoardingCategoryList = async (req, res) => {
  try {
    const visitTypes = await VisitType.find({ isBoardingAvailable: true });

    return res.json({
      success: true,
      visitTypes,
      message: "Visit Type fetched successfully",
    });
  } catch (error) {
    console.log("error in getallvisittype controller", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addShoppingVisit = async (req, res) => {
  try {
    const { items, petId, visitType, details:details_new } = req.body;
    const {payment} =details_new

    if (!petId) {
      return res.json({
        success: false,
        message: "A pet must be selected to save a visit",
      });
    }

    if (!visitType) {
      return res.json({
        success: false,
        message: "A visittype must be selected to save visit",
      });
    }

    let price = 0;

    for (let i = 0; i < items.length; i++) {
      console.log(typeof items[i].price);
      if (!items[i].name) {
        return res.json({
          success: false,
          message: "Enter valid item name",
        });
      }

      if (!items[i].price || items[i]?.price <= 0) {
        return res.json({
          success: false,
          message: "Enter valid item price",
        });
      }
      price += items[i].price;
    }

    details = {};
    details.price = price;
    details.items = items;
    details.payment=payment

    const newVisit = new Visit({
      visitType,
      details,
      pet: petId,
    });

    await newVisit.save();

    return res.json({
      success: true,
      message: "Visit saved successfully",
    });
  } catch (error) {
    console.log("error in addshoppingvisit controller", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


