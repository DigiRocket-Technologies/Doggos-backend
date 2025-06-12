const Pet = require("../models/pet");
const Owner = require("../models/Owner");
const mongoose = require("mongoose");
const Visit = require("../models/Visit");
const { DateTime } = require("luxon");
const Boarding = require("../models/boarding");

exports.addPet = async (req, res) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { pets, ownerName, phone, email, address, segment } = req.body;

    // First, create or find the owner
    let owner = await Owner.findOne({ email });

    if (!owner) {
      owner = await Owner.create(
        [
          {
            name: ownerName,
            phone,
            email,
            address,
            segment,
            pets: [],
          },
        ],
        { session }
      );
      owner = owner[0]; // Because create returns an array
    }

    // Create pet documents with owner reference
    const petDocuments = pets.map((pet) => ({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      color: pet.color,
      dob: pet.dob,
      owner: owner._id,
      vaccinations: pet.vaccinations || [],
      neutered: pet.neutered,
      registrationDate: pet.registrationDate,
    }));

    console.log(petDocuments);
    // Save all pets
    const savedPets = await Pet.create(petDocuments, { session });

    // Add pet references to owner
    owner.pets.push(...savedPets.map((pet) => pet._id));
    await owner.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // Fetch the complete owner data with populated pets
    const populatedOwner = await Owner.findById(owner._id).populate("pets");

    res.status(200).json({
      success: true,
      message: "Pet information saved successfully",
      owner: populatedOwner,
    });
  } catch (error) {
    // If there's an error, abort the transaction
    await session.abortTransaction();
    console.error("Error saving information:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save information",
      details: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getPetList = async (req, res) => {
  try {
    const list = await Pet.find({})
      .populate("owner", "name") // Populate owner only with the 'name' field
      .exec();
    return res
      .status(200)
      .json({ success: true, message: "List fetched successfully", list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getPetById = async (req, res) => {
  try {
    const petId = req.params.id;
    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      return res.status(400).json({ error: "Invalid pet ID format" });
    }

    // Fetch the pet details and populate the owner reference
    const pet = await Pet.findById(petId).populate("owner");
    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }

    // Send the pet data back to the client
    return res.status(200).json({
      success: true,
      pet,
      message: "Pet details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching pet by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.filterPetsByBreedAndSpecies = async (req, res) => {
  try {
    const { breed, species } = req.query;
    let query = {};

    if (breed) {
      query.breed = breed;
    }
    if (species) {
      query.species = species;
    }

    const pets = await Pet.find(query)
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pets",
      error: error.message,
    });
  }
};

exports.getFilteredPetsByNameAndPhone = async (req, res) => {
  try {
    const { name, phone } = req.query;

    // if (name && phone) {
    //   list = await Pet.find({
    //     name: { $regex: new RegExp(name, "i") },
    //   }).populate({
    //     path: "owner",
    //     match: { phone: phone },
    //     select: "name",
    //   });
    // } else {
    //   list = await Pet.find({}).populate({
    //     path: "owner",
    //     select: "name",
    //   });
    // }
    const pipeline = [
      // Optional name filter
      ...(name
        ? [
            {
              $match: {
                name: { $regex: new RegExp(name, "i") },
              },
            },
          ]
        : []),

      // Join with owner
      {
        $lookup: {
          from: "owners", // replace with your actual collection name
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true, // include pets with no owner
        },
      },

      // Optional phone filter on joined owner
      ...(phone
        ? [
            {
              $match: {
                "owner.phone": phone,
              },
            },
          ]
        : []),

      // Optional projection to include only what you need
      {
        $project: {
          name: 1,
          owner: { name: 1 }, // include owner name only
        },
      },
    ];

    const list = await Pet.aggregate(pipeline);

    if (!list) {
      return res
        .status(404)
        .json({ success: false, message: "Pet doesn't exist" });
    }

    return res.status(200).json({
      success: true,
      message: "Pets fetched successfully",
      list,
    });
  } catch (error) {
    console.error("Error in fetching pets", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getPetDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    // Ensure valid date
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Create start and end of day in UTC to match MongoDB storage
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const pets = await Pet.find({
      registrationDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate("owner");

    res.json({ pets });
  } catch (error) {
    console.error("Error in getPetDate:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPetVisitHistory = async (req, res) => {
  try {
    const visits = await Visit.find({ pet: req.params.petId })
      .populate({
        path: "itemDetails",
        populate: { path: "item", select: "itemName" },
      })
      .sort("-createdAt");
    res.json({ visits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPetByBirthday = async (req, res) => {
  try {
    const today = DateTime.now().setZone("Asia/Kolkata");
    const todayMonth = today.month;
    const todayDay = today.day;

    const List = await Pet.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dob" }, todayMonth] },
          { $eq: [{ $dayOfMonth: "$dob" }, todayDay] },
        ],
      },
    }).populate({
      path: "owner",
      select: "name phone email",
    });

    return res.status(200).json({
      success: true,
      List,
    });
  } catch (err) {
    console.log("Error in get pet by birthday controller ", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getPetByBirthday = async (req, res) => {
  try {
    const today = DateTime.now().setZone("Asia/Kolkata");
    const todayMonth = today.month;
    const todayDay = today.day;

    const List = await Pet.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dob" }, todayMonth] },
          { $eq: [{ $dayOfMonth: "$dob" }, todayDay] },
        ],
      },
    }).populate({
      path: "owner",
      select: "name phone email",
    });

    return res.status(200).json({
      success: true,
      List,
    });
  } catch (err) {
    console.log("Error in get pet by birthday controller ", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getBoardedPetList = async (req, res) => {
  try {
    const { type } = req.query;
    const boardedPetList = await Boarding.find({
      boardingType: type,
      isBoarded: true,
    }).populate({
      path: "petId",
      select: "name",
      populate: {
        path: "owner",
        select: "name phone",
      },
    });

    return res.status(200).json({
      success: true,
      boardedPetList,
      message: "List fetched successfully",
    });
  } catch (err) {
    console.log("Error in get boarded pet list", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.editPetDetails = async (req, res) => {
  
  try {
    const {
      name,
      species,
      breed,
      color,
      customBreed,
      dob,
      registrationDate,
      sex,
      vaccinations,
      neutered,
      id,
    } = req.body;

    if (
      !name ||
      !species ||
      !color ||
      !dob ||
      !registrationDate ||
      !sex ||
      neutered===null
    ) {
      return res.json({
        success: false,
        message: "Please provide all details",
      });
    }

    if (!breed && !customBreed) {
      return res.json({
        success: false,
        message: "Please provide breed details",
      });
    }

    // Save all pets
    const savedPet = await Pet.findByIdAndUpdate(id, {
      name,
      species,
      breed: customBreed ? customBreed : breed,
      color,
      sex,
      dob,
      registrationDate,
      neutered,
      vaccinations,
    },{ new: true, runValidators: true });


    return res.status(200).json({
      success: true,
      message: "Pet information saved successfully",
    });
  } catch (error) {
    // If there's an error, abort the transaction
  
    console.log("Error in editpetinfo controller", error);
    res.status(500).json({
      success: false,
      message: "Failed to save information",
    });
  } 
};

exports.editOwnerDetails = async (req, res) => {
  
  try {
    const {
      name,
      phone,
      email,
      address,
      segment,
      id
    } = req.body;

    if (
      !name ||
      !phone ||
      !email ||
      !address ||
      !segment 
    ) {
      return res.json({
        success: false,
        message: "Please provide all details",
      });
    }

    // Save all pets
    const savedOwner = await Owner.findByIdAndUpdate(id, {
      name,
      phone,
      email,
      address,
      segment
    },{ new: true, runValidators: true });


    return res.status(200).json({
      success: true,
      message: "Pet information saved successfully",
    });
  } catch (error) {
    // If there's an error, abort the transaction
  
    console.log("Error in editpetinfo controller", error);
    res.status(500).json({
      success: false,
      message: "Failed to save information",
    });
  } 
};
