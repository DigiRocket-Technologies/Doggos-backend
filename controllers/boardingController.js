const Pet = require("../models/pet");
const Visit = require("../models/Visit");
const Inventory = require("../models/inventory");
const Attendance = require("../models/attendance");
const Boarding = require("../models/boarding");
const Subscription = require("../models/subscription");
const Price = require("../models/price");
const mongoose=require("mongoose")

exports.dogParkDeboarding = async (req, res) => {
  try {
    const { boardingid } = req.body;

    const boardingDetails = await Boarding.findOne({
      _id: boardingid,
      isBoarded: true,
    });

    if (!boardingDetails)
      return res.status(400).json({
        success: false,
        message: "The given pet is not boarded in dog park",
      });

    boardingDetails.exitTime = new Date();
    boardingDetails.isBoarded = false;
    await boardingDetails.save();

    return res.json({
      success: true,
      message: "Pet Deboarded Successfully",
    });
  } catch (error) {
    console.log("Error in dog park deboarding controlller",error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.dayCareDeboarding = async (req, res) => {
  try {
    const { boardingid } = req.body;

    const boardingDetails = await Boarding.findOne({
      _id: boardingid,
      isBoarded: true,
    });

    if (!boardingDetails)
      return res.status(400).json({
        success: false,
        message: "The given pet is not boarded in day care",
      });

    boardingDetails.exitTime = new Date();
    boardingDetails.isBoarded = false;
    await boardingDetails.save();

    return res.json({
      success: true,
      message: "Pet Deboarded Successfully",
    });
  } catch (error) {
    console.log("Error in day care deboarding controlller",error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.daySchoolDeboarding = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { boardingid } = req.body;

    const boardingDetails = await Boarding.findOne({
      _id: boardingid,
      isBoarded: true,
    });

    if (!boardingDetails) {
      return res.status(400).json({
        success: false,
        message: "The given pet is not boarded in day school",
      });
    }

    if (boardingDetails?.isSubscriptionAvailed) {
      const subscriptionDetails = await Subscription.findOne({
        planId:boardingDetails?.planId,
        petId: boardingDetails?.petId,
      });
      
      const temp=subscriptionDetails?.daysLeft;
      subscriptionDetails.daysLeft =temp-1>=0?temp-1:0; 

      if(temp-1<=0)
      subscriptionDetails.active=false  
      await subscriptionDetails.save({session});
    }

    boardingDetails.exitTime = new Date();
    boardingDetails.isBoarded = false;

    await boardingDetails.save({ session });

    await session.commitTransaction();

    return res.json({
      success: true,
      message: `Pet Deboarded usccessfully`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Error in day school deboarding controlller",error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.playSchoolDeboarding = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { boardingid } = req.body;

    const boardingDetails = await Boarding.findOne({
      _id: boardingid,
      isBoarded: true,
    });

    if (!boardingDetails) {
      return res.status(400).json({
        success: false,
        message: "The given pet is not boarded in play school",
      });
    }

    if (boardingDetails?.isSubscriptionAvailed) {
      const subscriptionDetails = await Subscription.findOne({
        planId:boardingDetails?.planId,
        petId: boardingDetails?.petId,
      });
      
      const temp=subscriptionDetails?.daysLeft;
      subscriptionDetails.daysLeft =temp-1>=0?temp-1:0; 
      if(temp-1<=0)
      subscriptionDetails.active=false  
      await subscriptionDetails.save({session});
    }

    boardingDetails.exitTime = new Date();
    boardingDetails.isBoarded = false;

    await boardingDetails.save({ session });

    await session.commitTransaction();

    return res.json({
      success: true,
      message: `Pet Deboarded usccessfully`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Error in play school deboarding controlller",error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.HostelDeboarding = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { boardingid } = req.body;
    const boardingDetails = await Boarding.findOne({
      _id: boardingid,
      isBoarded: true,
    });

    if (!boardingDetails) {
      return res.status(400).json({
        success: false,
        message: "The given pet is not boarded in hostel",
      });
    }

    boardingDetails.isBoarded = false;
    boardingDetails.exitTime = new Date();
    
    await boardingDetails.save({session});

    if (boardingDetails?.isSubscriptionAvailed) {
      const subscriptionDetails = await Subscription.findOne({
        planId:boardingDetails?.planId,
        petId: boardingDetails?.petId,
      });

      const diffInMs = Math.abs(
        new Date().setHours(0, 0, 0, 0) -
          new Date(boardingDetails.entryTime).setHours(0, 0, 0, 0)
      );
  
      const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
      const actualnumberOfDays = diffInDays + 1;

      const temp=subscriptionDetails?.daysLeft;
      subscriptionDetails.daysLeft = temp-actualnumberOfDays>=0?temp-actualnumberOfDays:0; 
      if(temp-actualnumberOfDays<=0)
      subscriptionDetails.active=false  
  
      await subscriptionDetails.save({session});
    }

    await session.commitTransaction();
    return res.json({
      success: true,
      message: "Deboarded successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Error in hostel deboarding controlller", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getBoardingDetails = async (req, res) => {
  try {
    const { _id } = req.body;

    const boardingDetails = await Boarding.findOne({
      _id,
    }).populate([{ path: "boardingType" }, { path: "visitId" }]);

    if (!boardingDetails) {
      return res.status(400).json({
        success: false,
        message: "There is no such boarding available",
      });
    }

    const diffInMs = Math.abs(
      new Date().setHours(0, 0, 0, 0) -
        new Date(boardingDetails.entryTime).setHours(0, 0, 0, 0)
    );

    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    const actualnumberOfDays = diffInDays + 1;

    return res.json({
      boardingDetails,
      actualnumberOfDays,
      success: true,
      message: "Boarding Details fetched successfully",
    });
  } catch (error) {
    console.log("Error in boarding details controlller", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateHostelVisit = async (req, res) => {
  try {
    const { visitId, days, discount } = req.body;

    const visitDetails = await Visit.findOne({
      _id: visitId,
    }).populate({
      path: "visitType",
      select: "price",
    });

    if (discount < 0)
      return res.json({
        success: false,
        message: "Discount cannot be negative",
      });

    if (discount >= visitDetails?.visitType?.price) {
      return res.json({
        success: false,
        message: "Discount must be less than original price",
      });
    }

    const extradaysPrice = days * (visitDetails?.visitType?.price - discount);

    const details = visitDetails.details;

    details.extradays = days;
    details.extradaysprice = extradaysPrice;

    visitDetails.details = details;

    visitDetails.markModified("details");

    await visitDetails.save();

    return res.json({
      success: true,
      message: "Visit Details updated successfully",
    });
  } catch (error) {
    console.log("Error in visit details update controlller", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
