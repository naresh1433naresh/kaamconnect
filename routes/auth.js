const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, location, skills, paymentMode, bio } = req.body;
    console.log('📝 Register attempt:', { name, email, phone, role });

    if (!name || !email || !phone || !password || !role) {
      console.log('⚠️ Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, phone, password, role,
      location: location || '',
      skills: skills || [],
      paymentMode: paymentMode || '',
      bio: bio || ''
    });

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, location: user.location,
      profilePhoto: user.profilePhoto, skills: user.skills,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, location: user.location,
      profilePhoto: user.profilePhoto, skills: user.skills,
      rating: user.rating, totalReviews: user.totalReviews,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
