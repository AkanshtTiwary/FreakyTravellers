/**
 * SmartBudgetTrip Server
 * Main Express server configuration and initialization
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDatabase = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();

// ==================== DATABASE CONNECTION ====================
connectDatabase();

// ==================== MIDDLEWARE ====================

// Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting (apply to all routes)
app.use('/api/', apiLimiter);

// ==================== ROUTES ====================

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✈️ SmartBudgetTrip API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      trips: '/api/trips',
      payments: '/api/payments',
      images: '/api/images',
      travel: '/api/travel',
      trains: '/api/trains',
      facilities: '/api/facilities',
    },
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Route Handlers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trips', require('./routes/travelRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/travel', require('./routes/travelPlan.routes'));
app.use('/api/trains', require('./routes/trainRoutes'));
app.use('/api/facilities', require('./routes/facilitiesRoutes'));

// ==================== ERROR HANDLING ====================

// 404 Handler - Must be after all routes
app.use(notFound);

// Global Error Handler - Must be last
app.use(errorHandler);

// ==================== SERVER INITIALIZATION ====================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SmartBudgetTrip Server Started Successfully!');
  console.log('='.repeat(60));
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏠 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log('='.repeat(60) + '\n');
  console.log('📋 Available Endpoints:');
  console.log(`   - Auth:     http://localhost:${PORT}/api/auth`);
  console.log(`   - Trips:    http://localhost:${PORT}/api/trips`);
  console.log(`   - Payments: http://localhost:${PORT}/api/payments`);
  console.log('='.repeat(60) + '\n');
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  
  // Close server & exit process
  server.close(() => {
    console.log('🛑 Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  
  // Exit process
  console.log('🛑 Server shutting down due to uncaught exception');
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
