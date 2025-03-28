const jwt = require('jsonwebtoken');
const Register = require('../models/register');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await Register.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Set user in request
    req.user = {
      id: user._id,
      walletAddress: user.walletAddress,
      deviceId: decoded.deviceId,
      sessionId: decoded.sessionId
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
