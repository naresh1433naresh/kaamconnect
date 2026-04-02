const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect, employerOnly, workerOnly } = require('../middleware/auth');

// @route GET /api/jobs - Browse all open jobs with filters (workers only)
router.get('/', protect, workerOnly, async (req, res, next) => {
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
    next(err);
  }
});

// @route GET /api/jobs/:id - Single job
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name profilePhoto location rating phone');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// @route POST /api/jobs - Post new job (employer only)
router.post('/', protect, employerOnly, async (req, res, next) => {
  try {
    const { title, description, category, paymentType, paymentRate, paymentUnit, location, address, lng, lat } = req.body;
    if (!title || !description || !category || !paymentType || !paymentRate || !paymentUnit || !location) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    
    let locationCoords = undefined;
    if (lng !== undefined && lat !== undefined) {
      locationCoords = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
    }
    const job = await Job.create({
      title, description, category, paymentType,
      paymentRate: Number(paymentRate), paymentUnit,
      location, address: address || '',
      locationCoords,
      postedBy: req.user._id
    });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/jobs/:id - Update job
router.put('/:id', protect, employerOnly, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/jobs/:id - Delete job
router.delete('/:id', protect, employerOnly, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/jobs/employer/myjobs - Employer's posted jobs
router.get('/employer/myjobs', protect, employerOnly, async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
