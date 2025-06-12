
const jwt = require('jsonwebtoken');

const generateToken = (email, role, userId) => {
  return jwt.sign(
    {
      userEmail: email,
      email: email,
      role: role,
      userId: userId,
      user_type: role 
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;