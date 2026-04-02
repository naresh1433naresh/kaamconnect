const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');

// @route   GET /api/stats
// @desc    Get platform statistics
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    // 1. Active Workers count
    const activeWorkers = await Worker.countDocuments({ isActive: true });

    // 2. Jobs Done (Completed Bookings)
    const jobsDone = await Booking.countDocuments({ status: 'completed' });

    // 3. Average Rating of all workers
    const workersWithRating = await Worker.find({ totalReviews: { $gt: 0 } }, 'rating');
    let avgRating = 4.8; // Default value if no ratings yet

    if (workersWithRating.length > 0) {
      const sum = workersWithRating.reduce((acc, w) => acc + w.rating, 0);
      avgRating = (sum / workersWithRating.length).toFixed(1);
    }

    res.json({
      workers: activeWorkers,
      jobs: jobsDone,
      rating: parseFloat(avgRating)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
