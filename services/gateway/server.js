/**
 * API Gateway
 * Routes requests to appropriate microservices
 */

require('dotenv').config();

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

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

// ==================== SERVICE URLS ====================
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:5001',
  travel: process.env.TRAVEL_SERVICE_URL || 'http://travel-service:5002',
  train: process.env.TRAIN_SERVICE_URL || 'http://train-service:5003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5004',
};

// ==================== ROUTES ====================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API Gateway is running',
    version: '1.0.0',
    services: {
      auth: `${services.auth}/health`,
      travel: `${services.travel}/health`,
      train: `${services.train}/health`,
      payment: `${services.payment}/health`,
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gateway is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Service health endpoints
app.get('/services-status', async (req, res) => {
  const axios = require('axios');
  const status = {};

  for (const [name, url] of Object.entries(services)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      status[name] = { healthy: response.status === 200 };
    } catch (error) {
      status[name] = { healthy: false, error: error.message };
    }
  }

  res.json({ success: true, services: status });
});

// ==================== PROXY ROUTES ====================

// Auth Service
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/api/auth' },
    onError: (err, req, res) => {
      console.error('Auth Service Error:', err);
      res.status(503).json({ success: false, message: 'Auth Service unavailable' });
    },
  })
);

// Travel Service
app.use(
  '/api/travel',
  createProxyMiddleware({
    target: services.travel,
    changeOrigin: true,
    pathRewrite: { '^/api/travel': '/api/travel' },
    onError: (err, req, res) => {
      console.error('Travel Service Error:', err);
      res.status(503).json({ success: false, message: 'Travel Service unavailable' });
    },
  })
);

app.use(
  '/api/plans',
  createProxyMiddleware({
    target: services.travel,
    changeOrigin: true,
    pathRewrite: { '^/api/plans': '/api/plans' },
    onError: (err, req, res) => {
      console.error('Travel Service Error:', err);
      res.status(503).json({ success: false, message: 'Travel Service unavailable' });
    },
  })
);

// Train Service
app.use(
  '/api/trains',
  createProxyMiddleware({
    target: services.train,
    changeOrigin: true,
    pathRewrite: { '^/api/trains': '/api/trains' },
    onError: (err, req, res) => {
      console.error('Train Service Error:', err);
      res.status(503).json({ success: false, message: 'Train Service unavailable' });
    },
  })
);

app.use(
  '/api/transport',
  createProxyMiddleware({
    target: services.train,
    changeOrigin: true,
    pathRewrite: { '^/api/transport': '/api/transport' },
    onError: (err, req, res) => {
      console.error('Train Service Error:', err);
      res.status(503).json({ success: false, message: 'Train Service unavailable' });
    },
  })
);

app.use(
  '/api/facilities',
  createProxyMiddleware({
    target: services.train,
    changeOrigin: true,
    pathRewrite: { '^/api/facilities': '/api/facilities' },
    onError: (err, req, res) => {
      console.error('Train Service Error:', err);
      res.status(503).json({ success: false, message: 'Train Service unavailable' });
    },
  })
);

// Payment Service
app.use(
  '/api/payments',
  createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: { '^/api/payments': '/api/payments' },
    onError: (err, req, res) => {
      console.error('Payment Service Error:', err);
      res.status(503).json({ success: false, message: 'Payment Service unavailable' });
    },
  })
);

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🚀 API Gateway Started Successfully!');
  console.log(`${'='.repeat(60)}`);
  console.log(`🌐 Gateway running on port: ${PORT}`);
  console.log('\n📡 Connected Services:');
  console.log(`   - Auth Service:    ${services.auth}`);
  console.log(`   - Travel Service:  ${services.travel}`);
  console.log(`   - Train Service:   ${services.train}`);
  console.log(`   - Payment Service: ${services.payment}`);
  console.log(`${'='.repeat(60)}\n`);
});
