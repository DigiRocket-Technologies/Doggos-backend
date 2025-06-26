const SubscriptionPlan = require("../models/subscriptionPlan");
const Subscription = require("../models/subscription");
const Visit = require("../models/Visit");
const mongoose = require("mongoose");
const User = require('./../models/user');
const Pet = require('./../models/pet');
const Owner = require('./../models/Owner');



exports.getPetsSubscription=async(req,res)=>{
try {
  console.log("controller called");
    const {petId}=req.params;

      if (!petId) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID is required'
      });
    }

     const subscriptions = await Subscription.find({ petId: petId })
  .populate({
    path: 'planId',
    populate: {
      path: 'subscriptionType'
    }
  });

     console.log(subscriptions);

     if(!subscriptions){
      return res.status(400).json({
        success: false,
        message: 'Pet has no subscription'
      });
     }

      res.status(200).json({
      success: true,
      message: 'Pet subscriptions fetched successfully',
      data: subscriptions,
      count: subscriptions.length
    });


} catch (error) {
     console.error('Error fetching pet subscriptions:', error);
   res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
}
}

exports.getCustomerSubscriptions = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    // Find the owner by email and populate pets
    const owner = await Owner.findOne({ email: email }).populate('pets');
    
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    if (!owner.pets || owner.pets.length === 0) {
      return res.status(200).json({
        success: true,
        subscriptions: [],
        message: 'No pets found for this owner'
      });
    }

    const petIds = owner.pets.map(pet => pet._id);

    // Find all subscriptions for these pets
    const subscriptions = await Subscription.find({
      petId: { $in: petIds }
    })
    .populate({
      path: 'planId',
      select: 'subscriptionType duration price numberOfGroomings',
      populate: {
        path: 'subscriptionType',
        select: 'purpose'
      }
    })
    .populate({
      path: 'petId',
      select: 'name breed species sex color owner'
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subscriptions: subscriptions
    });

  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


exports.buySubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { petId, visitType,planId, details:details_new } = req.body;


    const { payment}=details_new;
    
    if (!petId || !planId) {
      return res.status(400).json({
        success: false,
        message: "Please provide all details",
      });
    }

    const subscription = await Subscription.findOne({ petId, planId });
    const PlanDetails = await SubscriptionPlan.findOne({ _id: planId });

    let days = PlanDetails?.duration || 0;
    
    console.log(PlanDetails);
    
    if (!subscription) {
      const newSubscription = new Subscription({
        planId,
        petId,
        daysLeft: PlanDetails?.duration || null,
        numberOfGroomings: PlanDetails?.numberOfGroomings || null,
        firstPaymentDate: new Date(),
        lastPaymentDate: new Date(),
      });
      await newSubscription.save({ session });
    } else {
      if (PlanDetails?.duration) subscription.daysLeft += days;
      else subscription.numberOfGroomings += PlanDetails?.numberOfGroomings;
      subscription.lastPaymentDate = new Date();
      subscription.active=true
      await subscription.save({ session });
    }

    const details = {};
    (details.purpose = subscription
      ? "Renew Subscription"
      : "Buy Subscription"),
      (details.subscriptionPlan =planId);
    details.price = PlanDetails.price;
    price = PlanDetails.price;
    details.payment=payment;

    const visit = new Visit({
      pet: petId,
      visitType,
      details,
    });

    await visit.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Subscription bought successfully",
    });
  } catch (error) {
    console.log("Error in buy subscription controller", error.message);
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    session.endSession();
  }
};

exports.getSubscriptionDetails = async (req, res) => {
  try {
    const { petId, visitType } = req.query;
    
    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "Pet must be selected to get subscription details",
      });
    }

    let subscriptions = await Subscription.find({
      petId: petId,
      active:true,
    }).populate([
      {
        path: "planId",
      },
      {
        path: "petId",
        populate: {
          path: "owner", // Populate owner within petId
          select: "name phone", // Only include name and phone fields from User
        },
      },
    ])

  
    
    subscriptions=subscriptions.filter((sub)=>sub.planId?.subscriptionType?.toString() === visitType.toString());

    return res.status(200).json({
      success: true,
      message: "Subscription details fetched successfully",
      subscription: subscriptions.length>0?subscriptions[0]:null,
    });

  } catch (error) {
    console.log("Error in get subscription details controller", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptionPlans = await SubscriptionPlan.find({}).populate({
      path: "subscriptionType",
      select: "purpose",
    });
    return res.status(200).json({
      success: true,
      message: "Plans fetched successfully",
      subscriptionPlans,
    });
  } catch (error) {
    console.log("Error in getallsubscription controller", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
