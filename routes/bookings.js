const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const { protect, workerOnly, employerOnly } = require('../middleware/auth');

// @route POST /api/bookings/quick - Employer makes a direct deal to nearest worker
router.post('/quick', protect, employerOnly, async (req, res, next) => {
  try {
    const { category, paymentType, paymentRate, paymentUnit, location, address, lat, lng, duration } = req.body;
    if (!category || !paymentType || !paymentRate || !paymentUnit || !location) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Find nearest active worker with matching skill
    const workerQuery = { isActive: true, skills: { $in: [category] } };
    if (lat !== undefined && lng !== undefined) {
      workerQuery.locationCoords = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: 50000 // 50 km radius
        }
      };
    }
    const nearestWorker = await Worker.findOne(workerQuery).select('-password');
    if (!nearestWorker) {
      return res.status(404).json({ message: `No worker found nearby for "${category}". Try again later.` });
    }

    // Create a quick/shadow job
    const description = `Direct deal from employer. ${paymentType === 'time' ? `Duration: ${duration || 'as needed'}.` : ''} Contact employer for details.`;
    const newJob = await Job.create({
      title: `${category} (Quick Booking)`,
      description,
      category,
      paymentType,
      paymentRate: Number(paymentRate),
      paymentUnit,
      location,
      address: address || '',
      postedBy: req.user._id,
      status: 'filled', // Mark filled immediately since this is a direct deal
      ...(lat !== undefined && lng !== undefined ? {
        locationCoords: { type: 'Point', coordinates: [Number(lng), Number(lat)] }
      } : {})
    });

    // Create the booking targeted at nearest worker
    const booking = await Booking.create({
      job: newJob._id,
      worker: nearestWorker._id,
      employer: req.user._id,
      status: 'pending',
      message: `You have a new deal! ${category} – ₹${paymentRate} ${paymentUnit}${paymentType === 'time' ? `, ${duration || ''} hours` : ''}. Accept to confirm.`
    });

    const populated = await Booking.findById(booking._id)
      .populate('job', 'title category paymentType paymentRate paymentUnit location')
      .populate('worker', 'name profilePhoto rating phone')
      .populate('employer', 'name profilePhoto phone');

    res.status(201).json({ booking: populated, worker: nearestWorker });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/bookings - Worker applies for a job
router.post('/', protect, workerOnly, async (req, res, next) => {
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
      .populate('job', 'title category paymentType paymentRate paymentUnit location locationCoords')
      .populate('worker', 'name profilePhoto rating locationCoords')
      .populate('employer', 'name profilePhoto locationCoords');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// @route GET /api/bookings/my - Get current user's bookings
router.get('/my', protect, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'worker') query.worker = req.user._id;
    else query.employer = req.user._id;

    const bookings = await Booking.find(query)
      .populate('job', 'title category paymentType paymentRate paymentUnit location status locationCoords')
      .populate('worker', 'name profilePhoto rating phone locationCoords')
      .populate('employer', 'name profilePhoto phone locationCoords')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// @route GET /api/bookings/job/:jobId - Get bookings for a specific job (employer)
router.get('/job/:jobId', protect, employerOnly, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ job: req.params.jobId })
      .populate('job', 'locationCoords title')
      .populate('worker', 'name profilePhoto rating skills phone bio locationCoords')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', protect, async (req, res, next) => {
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
      .populate('job', 'title category paymentType paymentRate paymentUnit location locationCoords')
      .populate('worker', 'name profilePhoto rating locationCoords')
      .populate('employer', 'name profilePhoto locationCoords');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// @route POST /api/bookings/:id/review - Submit review
router.post('/:id/review', protect, async (req, res, next) => {
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
    let reviewedUser;
    if (isEmployer) {
      reviewedUser = await Worker.findById(reviewedUserId); // Employer reviewing worker
    } else {
      reviewedUser = await Employer.findById(reviewedUserId); // Worker reviewing employer
    }
    
    if (reviewedUser) {
      const newTotal = reviewedUser.totalReviews + 1;
      const newRating = ((reviewedUser.rating * reviewedUser.totalReviews) + rating) / newTotal;
      reviewedUser.rating = Math.round(newRating * 10) / 10;
      reviewedUser.totalReviews = newTotal;
      await reviewedUser.save();
    }

    res.json({ message: 'Review submitted successfully', booking });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
