/**
 * Travel Microservice
 * Handles travel planning, itineraries, and budget allocation
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/travelbudget');
    console.log('✅ Travel Service connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

connectDB();

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Travel Service is running',
    version: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Travel Service is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Import travel routes
app.use('/api/travel', require('./routes/travelRoutes'));
app.use('/api/plans', require('./routes/travelPlanRoutes'));

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`\n✈️ Travel Service running on port ${PORT}\n`);
});
