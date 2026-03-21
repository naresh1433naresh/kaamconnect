const mongoose = require('mongoose');

const JOB_CATEGORIES = [
  // Time-wise
  'House Cleaning',
  'Babysitting',
  'Home Tuition',
  'Security Guard',
  'Construction Helper',
  'Event Helper',
  'Restaurant Helper',
  'Shop Helper / Salesman',
  'Gardening Maintenance',
  'Delivery Rider',
  // Work-wise
  'Car Washing',
  'Bike Washing',
  'Electric Repair',
  'Plumbing Work',
  'AC Repair',
  'House Painting',
  'Mobile Repair',
  'Laptop Repair',
  'Clothes Ironing',
  'Parcel / Food Delivery',
  'House Shifting Help',
  'Scrap Collection',
  'Furniture Repair',
];

const PAYMENT_UNITS = [
  'per hour', 'per day', 'per shift',
  'per car', 'per bike', 'per job',
  'per room', 'per house', 'per device',
  'per cloth', 'per delivery', 'per kg', 'per item', 'per task'
];

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: JOB_CATEGORIES },
  paymentType: { type: String, enum: ['time', 'work'], required: true },
  paymentRate: { type: Number, required: true, min: 1 },
  paymentUnit: { type: String, required: true, enum: PAYMENT_UNITS },
  location: { type: String, required: true },
  address: { type: String, default: '' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'filled', 'closed'], default: 'open' },
  applicationsCount: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
module.exports.JOB_CATEGORIES = JOB_CATEGORIES;
module.exports.PAYMENT_UNITS = PAYMENT_UNITS;
