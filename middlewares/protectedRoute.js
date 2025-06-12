const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protectedRoute = async (req, res, next) => {
  try {
    const token = req?.headers["authorization"]?.trim() || null;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, status: 401, message: "Unauthorized - Access" });
    }

    // Check if token is expired
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, status: 401, message: "Invalid token format" });
    }

    const exp = decoded.exp;
    if (exp && exp < Math.floor(Date.now() / 1000)) {
      return res
        .status(401)
        .json({ success: false, status: 401, message: "Session expired, please log in again" });
    }

    // Verify token
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!verifiedToken) {
      return res
        .status(401)
        .json({ success: false, status: 401, message: "Unauthorized - Access" });
    }

    // Find user by email (adjust based on your token structure)
    const user = await User.findOne({
      email: verifiedToken?.userEmail || verifiedToken?.email,
    }).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No such user exist unauthorised access",
      });
    }

    // Add user info to request object
    req.user = user;
    req.userRole = user.role; // Add role for easy access
    req.userId = user._id;
    
    // If user is customer, add customer_id
    if (user.role === 'customer') {
      // Assuming you have customer_id stored in user document or need to fetch it
      req.customer_id = user.customer_id || user._id; // Adjust based on your schema
    }

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Add role-based middleware
exports.authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};