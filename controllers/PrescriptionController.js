const express = require("express");
const mongoose = require("mongoose");
const Prescription = require("./../models/Prescription");
const Inventory = require("./../models/inventory");
const Pet = require("./../models/pet");
const scheduledVisit = require("../models/scheduledVisit");

exports.addPrescription = async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();

  try {
    const {
      petId,
      followUpPurpose,
      nextFollowUp,
      followUpTime,
      customerType,
      diagnosis,
      items,
      ml,
      mg,
      tablets,
    } = req.body;

  
    if(!petId || !customerType){
        return res.json({
            success:false,
            message:"pet id or customertype not found"
        })
    }

    if (
      items?.length === 0 &&
      tablets?.length === 0 &&
      ml?.length === 0 &&
      mg?.length === 0
    ) {
      return res.json({
        success: false,
        message: "select atleast any to save the prescription",
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
       }else if(nextFollowUp && followUpPurpose && followUpTime){

    }
     else {
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

    const prescription = new Prescription({
      petId,
      customerType,
      items,
      ml,
      mg,
      tablets,
      followUpPurpose,
      nextFollowUp,
      followUpTime,
      diagnosis,
      price:totalPrice
    });

 console.log("hiii4");
    await prescription.save({session});

    const itemIds = items.map((item) => item.id);
    const tabletIds = items.map((item) => item.id);
    const mlIds = items.map((item) => item.id);
    const mgIds = items.map((item) => item.id);

    const medicationIds = [...itemIds, ...tabletIds, ...mlIds, ...mgIds];

    const vaccineItems = await Inventory.find({ _id: { $in: medicationIds } })
      .session(session)
      .lean();

    const pet = await Pet.findOne({ _id: petId });

    console.log("he", vaccineItems);

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
     console.log("hiii5");

    pet.vaccinations = [...updatedVaccinations];
    await pet.save({ session });

    
    await session.commitTransaction();

console.log("hi5")
     return res.json({
      success: true,
      message: "Prescription saved successfully",
    });
  } catch (error) {
    await session.abortTransaction();
 
    return res.status(500).json({
      success: false,
      message: "Internal Server Error in prescription",
    });
  }
};

exports.getPetPrescriptions=async(req,res)=>{
try {
  console.log("controller called");
    const {petId}=req.params;

      if (!petId) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID is required'
      });
    }

       const prescriptions = await Prescription.find({ petId })
      .populate('items.id', 'itemName') 
      .populate('tablets.id', 'itemName') 
      .populate('mg.id', 'itemName') 
      .populate('ml.id', 'itemName') 
      .sort({ createdAt: -1 });


     console.log(prescriptions);

     if(!prescriptions){
      return res.status(400).json({
        success: false,
        message: 'Pet has no prescriptions'
      });
     }

      res.status(200).json({
      success: true,
      message: 'Pet prescriptions fetched successfully',
      data: prescriptions,
      count: prescriptions.length
    });


} catch (error) {
     console.error('Error fetching pet prescriptions:', error);
   res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
}
}
