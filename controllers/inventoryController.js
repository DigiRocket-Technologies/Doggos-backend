const Inventory = require("../models/inventory");
exports.addinventory = async (req, res) => {
  try {
    const {
      itemName,
      stock,
      stockUnit,
      itemType,
      unitCostPrice,
      unitMinRetailPriceNGO,
      unitMaxRetailPriceCustomer,
    } = req.body;

    // Validate all required fields
    if (
      !itemName ||
      !stock ||
      !stockUnit ||
      !itemType ||
      !unitCostPrice ||
      !unitMinRetailPriceNGO ||
      !unitMaxRetailPriceCustomer
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate numeric fields
    if (
      stock < 0 ||
      unitCostPrice < 0 ||
      unitMinRetailPriceNGO < 0 ||
      unitMaxRetailPriceCustomer < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Numeric fields must be non-negative",
      });
    }

    // Validate enum values
    const validStockUnits = ["ml", "item", "tablet", "mg"];
    const validItemTypes = ["disposable", "syringe", "medicine", "vaccine"];

    if (!validStockUnits.includes(stockUnit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock unit. Must be one of: ml, item, tablet, mg",
      });
    }

    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid item type. Must be one of: disposable, syringe, medicine, vaccine",
      });
    }

    // Validate pricing logic (optional business rule)
    if (unitMinRetailPriceNGO > unitMaxRetailPriceCustomer) {
      return res.status(400).json({
        success: false,
        message: "NGO price cannot be higher than customer price",
      });
    }

    // Create new inventory item
    const newItem = new Inventory({
      itemName,
      stock: Number(stock),
      stockUnit,
      itemType,
      unitCostPrice: Number(unitCostPrice),
      unitMinRetailPriceNGO: Number(unitMinRetailPriceNGO),
      unitMaxRetailPriceCustomer: Number(unitMaxRetailPriceCustomer),
    });

    const savedItem = await newItem.save();

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      item: savedItem,
    });
  } catch (error) {
    console.log("Error in add inventory controller:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle duplicate key errors (if you have unique constraints)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Item with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error creating inventory item",
      error: error.message,
    });
  }
};

exports.getInventoryList = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ itemName: 1 });
    return res.status(200).json({
      success: true,
      message: "Items fetched successfully",
      items,
    });
  } catch (error) {
    console.log("Error in getInventoryList Controller");
    res.status(500).json({
      success: false,
      message: "Error fetching inventory items",
      error: error.message,
    });
  }
};

exports.editInventory = async (req, res) => {
  try {
    const {
      _id,
      itemName,
      stock,
      stockUnit,
      itemType,
      unitCostPrice,
      unitMinRetailPriceNGO,
      unitMaxRetailPriceCustomer,
    } = req.body;

    // Validate required fields
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required",
      });
    }

    if (!itemName || !stockUnit || !itemType) {
      return res.status(400).json({
        success: false,
        message: "Item name, stock unit, and item type are required fields",
      });
    }

    // Validate enum values
    const validStockUnits = ["ml", "item", "tablet", "mg"];
    const validItemTypes = ["disposable", "syringe", "medicine", "vaccine"];

    if (!validStockUnits.includes(stockUnit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock unit. Must be one of: ml, item, tablet, mg",
      });
    }

    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid item type. Must be one of: disposable, syringe, medicine, vaccine",
      });
    }

    // Validate numeric fields if provided
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be non-negative",
      });
    }

    if (unitCostPrice !== undefined && unitCostPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Unit cost price must be non-negative",
      });
    }

    if (unitMinRetailPriceNGO !== undefined && unitMinRetailPriceNGO < 0) {
      return res.status(400).json({
        success: false,
        message: "NGO price must be non-negative",
      });
    }

    if (
      unitMaxRetailPriceCustomer !== undefined &&
      unitMaxRetailPriceCustomer < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer price must be non-negative",
      });
    }

    // Validate pricing logic if both prices are provided
    if (
      unitMinRetailPriceNGO !== undefined &&
      unitMaxRetailPriceCustomer !== undefined &&
      unitMinRetailPriceNGO > unitMaxRetailPriceCustomer
    ) {
      return res.status(400).json({
        success: false,
        message: "NGO price cannot be higher than customer price",
      });
    }

    // Prepare update data - only include fields that are provided
    const updateData = {
      itemName,
      stockUnit,
      itemType,
    };

    // Only add numeric fields if they are provided
    if (stock !== undefined) {
      updateData.stock = Number(stock);
    }
    if (unitCostPrice !== undefined) {
      updateData.unitCostPrice = Number(unitCostPrice);
    }
    if (unitMinRetailPriceNGO !== undefined) {
      updateData.unitMinRetailPriceNGO = Number(unitMinRetailPriceNGO);
    }
    if (unitMaxRetailPriceCustomer !== undefined) {
      updateData.unitMaxRetailPriceCustomer = Number(
        unitMaxRetailPriceCustomer
      );
    }

    // Check if item exists before updating
    const existingItem = await Inventory.findById(_id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Update the inventory item
    const updatedItem = await Inventory.findByIdAndUpdate(_id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Run mongoose validators
    });

    return res.status(200).json({
      success: true,
      message: "Inventory details updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error in editInventory:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle invalid ObjectId
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID format",
      });
    }

    // Handle duplicate key errors (if you have unique constraints)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Item with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the inventory item by ID
    const inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Delete the inventory item
    await Inventory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inventory item",
      error: error.message,
    });
  }
};

exports.getInventoryItemDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findById(id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Item Details fetched successfully",
      item,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching inventory item", error: error.message });
  }
};

exports.getAlertListOfInventory = async (req, res) => {
  try {
    const items = await Inventory.find({ totalVolume: { $lte: 100 } }).sort({
      itemName: 1,
    });
    return res.status(200).json({
      success: true,
      message: "Items fetched successfully",
      items,
    });
  } catch (error) {
    console.log("Error in getInventoryList Controller");
    res.status(500).json({
      success: false,
      message: "Error fetching inventory items",
      error: error.message,
    });
  }
};
