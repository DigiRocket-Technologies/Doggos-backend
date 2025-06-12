const User = require("../models/user");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");

// exports. = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
    
//    const exitingUser=await User.findOne({email});
   
//     if(exitingUser){
//       return res.status(400).json({
//         success:false,
//         message:"User already exists",
//       });
//     }

//     const hashedPassword=await bcrypt.hash(password,10);

//     const user= await User.create({
//       fullName:name,
//       email:email,
//       password:hashedPassword,
//       role:'staff'
//     });

//     return res.status(200).json({
//       success:true,
//       message:"user created successfully",
//       user:{
//         fullName:user.fullName,
//         email:user.email,
//         password:user.password,
//         role:user.role
    
//       }
//     });


//   } catch (error) {
//     console.log("Error in signup controller", error.message);
//     res.status(500).json({success:false, message: "Internal Server Error" });
//   }
// };

exports.signUp = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required"
      });
    }

    // Only allow customer role for registration
    if (role !== 'customer') {
      return res.status(400).json({
        success: false,
        message: "Only customer registration is allowed"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'customer', // Fixed role
      isActive: true,
      createdAt: new Date()
    });

    // Create customer profile if needed (optional)
    // const customer = await Customer.create({
    //   user_id: user._id,
    //   wallet_balance: 0,
    //   total_pets: 0
    // });

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.log("Error in register controller:", error.message);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    // console.log(email, password, role);


    // Find user with email and role
    const user = await User.findOne({ email, role });

    // console.log(user);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found with this role" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    // Generate token with role information
    const token = generateToken(user?.email, user?.role, user?._id);

    // Prepare response data
    let responseData = {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      id: user._id
    };

    // If user is customer, add customer_id
    if (user.role === 'customer') {
      responseData.customer_id = user.customer_id || user._id; 
    }

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: responseData,
      token
    });

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
