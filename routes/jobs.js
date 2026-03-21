const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect, employerOnly } = require('../middleware/auth');

// @route GET /api/jobs - Browse all open jobs with filters
router.get('/', async (req, res) => {
  try {
    const { category, paymentType, location, search } = req.query;
    const query = { status: 'open' };
    if (category) query.category = category;
    if (paymentType) query.paymentType = paymentType;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (search) query.title = { $regex: search, $options: 'i' };

    const jobs = await Job.find(query)
      .populate('postedBy', 'name profilePhoto location rating')
      .sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/jobs/:id - Single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name profilePhoto location rating phone');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/jobs - Post new job (employer only)
router.post('/', protect, employerOnly, async (req, res) => {
  try {
    const { title, description, category, paymentType, paymentRate, paymentUnit, location, address } = req.body;
    if (!title || !description || !category || !paymentType || !paymentRate || !paymentUnit || !location) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    const job = await Job.create({
      title, description, category, paymentType,
      paymentRate: Number(paymentRate), paymentUnit,
      location, address: address || '',
      postedBy: req.user._id
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/jobs/:id - Update job
router.put('/:id', protect, employerOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/jobs/:id - Delete job
router.delete('/:id', protect, employerOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/jobs/employer/myjobs - Employer's posted jobs
router.get('/employer/myjobs', protect, employerOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
