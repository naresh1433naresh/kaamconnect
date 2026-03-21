const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['worker', 'employer'], required: true },
  profilePhoto: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  // For workers
  paymentMode: { type: String, enum: ['time', 'work', 'both', ''], default: '' },
  hourlyRate: { type: Number, default: 0 },
  // Rating
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
