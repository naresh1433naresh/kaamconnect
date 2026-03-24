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

// MongoDB connection (hybrid: Local first, then Atlas)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;

  const mongoURIs = [
    { name: 'Local', uri: process.env.MONGO_URI_LOCAL },
    { name: 'Atlas', uri: process.env.MONGO_URI_ATLAS }
  ];

  for (const db of mongoURIs) {
    if (!db.uri) continue;
    try {
      console.log(`📡 Attempting to connect to ${db.name} MongoDB...`);
      await mongoose.connect(db.uri, {
        serverSelectionTimeoutMS: 5000 // 5 second timeout for failover
      });
      isConnected = true;
      console.log(`✅ ${db.name} MongoDB Connected`);
      return;
    } catch (err) {
      console.error(`❌ ${db.name} MongoDB Connection Error:`, err.message);
    }
  }

  throw new Error('All MongoDB connection attempts failed.');
}

// For local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 KaamConnect Server running on http://localhost:${PORT}`))
        .on('error', (err) => {
          console.error('❌ Server Error:', err.message);
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is already in use.`);
          }
        });
    })
    .catch(err => {
      console.error('❌ Startup Error:', err.message);
      console.log('⚠️ Starting server anyway for UI preview...');
      app.listen(PORT, () => console.log(`🚀 KaamConnect Server (UI Only) running on http://localhost:${PORT}`));
    });
}

// For Vercel: connect on each cold start, export app
connectDB().catch(console.error);
module.exports = app;

