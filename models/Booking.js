const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  hoursWorked: { type: Number, default: 0 },
  unitsCompleted: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  message: { type: String, default: '' },
  // Review (after completion)
  workerReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    givenAt: { type: Date }
  },
  employerReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    givenAt: { type: Date }
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
