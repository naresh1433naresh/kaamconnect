const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Job = require('../models/Job');
const User = require('../models/User');
const { protect, workerOnly, employerOnly } = require('../middleware/auth');

// @route POST /api/bookings - Worker applies for a job
router.post('/', protect, workerOnly, async (req, res) => {
  try {
    const { jobId, message } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ message: 'Job is not available' });

    const existing = await Booking.findOne({ job: jobId, worker: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already applied for this job' });

    const booking = await Booking.create({
      job: jobId, worker: req.user._id,
      employer: job.postedBy, message: message || ''
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

    const populated = await Booking.findById(booking._id)
      .populate('job', 'title category paymentType paymentRate paymentUnit location')
      .populate('worker', 'name profilePhoto rating')
      .populate('employer', 'name profilePhoto');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/bookings/my - Get current user's bookings
router.get('/my', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'worker') query.worker = req.user._id;
    else query.employer = req.user._id;

    const bookings = await Booking.find(query)
      .populate('job', 'title category paymentType paymentRate paymentUnit location status')
      .populate('worker', 'name profilePhoto rating phone')
      .populate('employer', 'name profilePhoto phone')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/bookings/job/:jobId - Get bookings for a specific job (employer)
router.get('/job/:jobId', protect, employerOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ job: req.params.jobId })
      .populate('worker', 'name profilePhoto rating skills phone bio')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, hoursWorked, unitsCompleted } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isEmployer = booking.employer.toString() === req.user._id.toString();
    const isWorker = booking.worker.toString() === req.user._id.toString();

    if (!isEmployer && !isWorker) return res.status(403).json({ message: 'Not authorized' });

    booking.status = status;
    if (hoursWorked) booking.hoursWorked = hoursWorked;
    if (unitsCompleted) booking.unitsCompleted = unitsCompleted;

    // Calculate total amount on completion
    if (status === 'completed') {
      const job = await Job.findById(booking.job);
      if (job) {
        const units = job.paymentType === 'time' ? (hoursWorked || booking.hoursWorked) : (unitsCompleted || booking.unitsCompleted);
        booking.totalAmount = units * job.paymentRate;
      }
      await Job.findByIdAndUpdate(booking.job, { status: 'filled' });
    }

    await booking.save();
    const populated = await Booking.findById(booking._id)
      .populate('job', 'title category paymentType paymentRate paymentUnit location')
      .populate('worker', 'name profilePhoto rating')
      .populate('employer', 'name profilePhoto');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/bookings/:id/review - Submit review
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed bookings' });

    const isEmployer = booking.employer.toString() === req.user._id.toString();
    const isWorker = booking.worker.toString() === req.user._id.toString();

    if (!isEmployer && !isWorker) return res.status(403).json({ message: 'Not authorized' });

    let reviewedUserId;
    if (isEmployer) {
      booking.workerReview = { rating, comment, givenAt: new Date() };
      reviewedUserId = booking.worker;
    } else {
      booking.employerReview = { rating, comment, givenAt: new Date() };
      reviewedUserId = booking.employer;
    }
    await booking.save();

    // Update user's average rating
    const reviewedUser = await User.findById(reviewedUserId);
    const newTotal = reviewedUser.totalReviews + 1;
    const newRating = ((reviewedUser.rating * reviewedUser.totalReviews) + rating) / newTotal;
    reviewedUser.rating = Math.round(newRating * 10) / 10;
    reviewedUser.totalReviews = newTotal;
    await reviewedUser.save();

    res.json({ message: 'Review submitted successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
