const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/workers', require('./routes/workers'));

// Serve frontend for all other routes
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 KaamConnect Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
