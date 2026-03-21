const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, workerOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route GET /api/workers - Browse workers
router.get('/', async (req, res) => {
  try {
    const { skill, location, search } = req.query;
    const query = { role: 'worker', isActive: true };
    if (skill) query.skills = { $in: [skill] };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (search) query.name = { $regex: search, $options: 'i' };
    const workers = await User.find(query)
      .select('-password')
      .sort('-rating');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/workers/:id - Public worker profile
router.get('/:id', async (req, res) => {
  try {
    const worker = await User.findById(req.params.id).select('-password');
    if (!worker || worker.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/workers/profile - Update worker profile
router.put('/profile/update', protect, workerOnly, async (req, res) => {
  try {
    const { name, phone, location, bio, skills, paymentMode, hourlyRate } = req.body;
    const updates = { name, phone, location, bio, skills, paymentMode, hourlyRate };
    // Remove undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/workers/profile/photo - Upload profile photo
router.post('/profile/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const photoUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl }, { new: true }).select('-password');
    res.json({ photoUrl, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
