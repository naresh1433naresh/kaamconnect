const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'worker' },
  profilePhoto: { type: String, default: '' },
  location: { type: String, default: '' },
  locationCoords: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  paymentMode: { type: String, enum: ['time', 'work', 'both', ''], default: '' },
  hourlyRate: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

WorkerSchema.index({ locationCoords: "2dsphere" });

WorkerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

WorkerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Worker', WorkerSchema);
