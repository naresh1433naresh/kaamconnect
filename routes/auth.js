const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @route POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password, role, location, skills, paymentMode, bio, lng, lat } = req.body;
    console.log('📝 Register attempt:', { name, email, phone, role });

    if (!name || !email || !phone || !password || !role) {
      console.log('⚠️ Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    
    let locationCoords = undefined;
    if (lng !== undefined && lat !== undefined) {
      locationCoords = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
    }
    const existingWorker = await Worker.findOne({ email });
    const existingEmployer = await Employer.findOne({ email });
    if (existingWorker || existingEmployer) return res.status(400).json({ message: 'Email already registered' });

    let user;
    if (role === 'worker') {
      user = await Worker.create({
        name, email, phone, password, role,
        location: location || '',
        locationCoords,
        skills: skills || [],
        paymentMode: paymentMode || '',
        bio: bio || ''
      });
    } else if (role === 'employer') {
      user = await Employer.create({
        name, email, phone, password, role,
        location: location || '',
        locationCoords,
        bio: bio || ''
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, location: user.location,
      profilePhoto: user.profilePhoto, skills: user.skills,
      token: generateToken(user._id, user.role)
    });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    let user = await Worker.findOne({ email });
    if (!user) user = await Employer.findOne({ email });
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, location: user.location,
      profilePhoto: user.profilePhoto, skills: user.skills,
      rating: user.rating, totalReviews: user.totalReviews,
      token: generateToken(user._id, user.role)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
