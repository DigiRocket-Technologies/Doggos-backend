// Updated backend payment controller for handling all payment types correctly

const Visit = require("../models/Visit");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

const createOrder = async (req, res) => {
  try {
    console.log(req.body);
    const { amount, receipt, notes } = req.body;

    console.log("Creating order with amount:", amount, "receipt:", receipt);

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt,
      notes,
      payment_capture: 1,
    });
    console.log("hehehe1")
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create order",
      error: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    // console.log("visit", req.body.visitData);
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      visitData,
    } = req.body;

    // console.log('Payment verification data received:', {
    //   razorpay_payment_id,
    //   razorpay_order_id,
    //   paymentType: visitData.details.payment.paymentType,
    //   amount: visitData.details.payment.amount,
    //   remainingAmount: visitData.details.payment.remainingAmount
    // });

        console.log("hehehe2")

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

         console.log("hehehe3")

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

       console.log("hehehe4")
    const { paymentType, amount, remainingAmount } = visitData.details.payment;

    return res.status(200).json({
      success: true,
      message: "Payment verified and visit saved successfully",
    });
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

const verifyPayment2 = async (req, res) => {
  try {
    const { razorpay_payment_id } = req.body;

    
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    console.log(payment);

    

    if (payment.status === "captured") {
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentDetails: payment,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment not captured",
      });
    }
  } catch (error) {
    console.error("Error in verifyPayment2:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

const verifyPendingPayment = async (req, res) => {
  try {
   
    const { razorpay_payment_id, visitId  } = req.body;

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status === "captured") {
      const visitDetails = await Visit.findOne({
        _id: visitId,
      }).populate({
        path: "visitType",
        select: "price",
      });
      
      const details = visitDetails.details;
      details.payment.remainingAmount=0;
      details.payment.isRemainingPaid=true;
      details.payment.remainingAmountRazorpayId=razorpay_payment_id
      visitDetails.details ;
      visitDetails.markModified("details");
      await visitDetails.save();
    } else {

      res.status(400).json({ success: false, message: "Payment not captured" });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and visit updated successfully",
    });
  } catch (error) {
    console.error("Error in verify-Pending-Payment:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying pending payment",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  verifyPayment2,
  verifyPendingPayment
};




