const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'worker') {
      req.user = await Worker.findById(decoded.id).select('-password');
    } else {
      req.user = await Employer.findById(decoded.id).select('-password');
    }
    
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const workerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'worker') return next();
  res.status(403).json({ message: 'Access denied: Workers only' });
};

const employerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'employer') return next();
  res.status(403).json({ message: 'Access denied: Employers only' });
};

module.exports = { protect, workerOnly, employerOnly };
