const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a new PDF document
const doc = new PDFDocument({
  margin: 50,
  size: 'A4'
});

// Pipe to file
const outputPath = path.join(__dirname, 'TravelBudget-Project-Report.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Helper function for section titles
function sectionTitle(text) {
  doc.fontSize(18).font('Helvetica-Bold').text(text, { underline: true });
  doc.moveDown(0.5);
}

function subSectionTitle(text) {
  doc.fontSize(14).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function normalText(text, options = {}) {
  doc.fontSize(11).font('Helvetica').text(text, options);
}

function bulletPoint(text) {
  doc.fontSize(11).font('Helvetica').text(text, { indent: 20 });
}

// Title Page
doc.fontSize(28).font('Helvetica-Bold').text('TravelBudget', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(16).font('Helvetica').text('Project Report', { align: 'center' });
doc.moveDown(1);
doc.fontSize(12).font('Helvetica').text('AI-Powered Budget Travel Optimization Platform', { align: 'center' });
doc.moveDown(2);
doc.fontSize(11).font('Helvetica').text(`Report Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
doc.addPage();

// Table of Contents
sectionTitle('Table of Contents');
const contents = [
  '1. Project Overview',
  '2. Architecture & Technology Stack',
  '3. Microservices Architecture',
  '4. Project Structure',
  '5. Key Features',
  '6. Technology Dependencies',
  '7. Deployment & Infrastructure',
  '8. API Services',
  '9. Database Design',
  '10. Security & Best Practices'
];
contents.forEach(content => {
  normalText(content);
  doc.moveDown(0.3);
});
doc.addPage();

// 1. Project Overview
sectionTitle('1. Project Overview');
normalText('TravelBudget is an innovative AI-powered travel optimization platform designed to help users plan budget-conscious trips with personalized itineraries and cost optimization. The application combines modern web technologies with advanced microservices architecture to provide a scalable and maintainable solution.');
doc.moveDown(0.5);

subSectionTitle('Project Goals:');
bulletPoint('• Provide AI-driven travel planning and itinerary generation');
bulletPoint('• Optimize travel budgets across multiple destinations');
bulletPoint('• Integrate with Indian Railways for train booking');
bulletPoint('• Enable seamless payment processing');
bulletPoint('• Deliver personalized travel recommendations');
doc.moveDown(1);

subSectionTitle('Target Users:');
bulletPoint('• Budget-conscious travelers');
bulletPoint('• Families planning group trips');
bulletPoint('• Business travelers');
bulletPoint('• Adventure seekers with flexible budgets');
doc.addPage();

// 2. Architecture & Technology Stack
sectionTitle('2. Architecture & Technology Stack');

subSectionTitle('Frontend Stack:');
bulletPoint('• Next.js 14.0.4 - React framework with SSR/SSG capabilities');
bulletPoint('• React 18.2.0 - UI library');
bulletPoint('• Tailwind CSS 3.3.6 - Utility-first CSS framework');
bulletPoint('• Zustand 4.4.7 - State management');
bulletPoint('• Axios 1.6.2 - HTTP client');
bulletPoint('• Recharts 2.10.3 - Data visualization');
bulletPoint('• Framer Motion 10.16.16 - Animation library');
bulletPoint('• React Hot Toast 2.4.1 - Notifications');
doc.moveDown(0.5);

subSectionTitle('Backend Stack:');
bulletPoint('• Node.js 18+ - JavaScript runtime');
bulletPoint('• Express.js 4.18.2 - Web framework');
bulletPoint('• MongoDB 8.0.0 - NoSQL database');
bulletPoint('• Mongoose - ODM for MongoDB');
bulletPoint('• JWT - Authentication mechanism');
bulletPoint('• Razorpay 2.9.2 - Payment gateway');
doc.moveDown(0.5);

subSectionTitle('Infrastructure:');
bulletPoint('• Docker & Docker Compose - Containerization');
bulletPoint('• AWS Elastic Beanstalk - Deployment platform');
bulletPoint('• MongoDB Atlas - Cloud database');
bulletPoint('• Google OAuth - Authentication');
doc.addPage();

// 3. Microservices Architecture
sectionTitle('3. Microservices Architecture');
normalText('The application follows a microservices architecture pattern with an API Gateway as the central entry point. Each service is independently deployable and scalable.');
doc.moveDown(0.5);

subSectionTitle('Architecture Components:');
doc.moveDown(0.3);

subSectionTitle('API Gateway (Port 5000)');
bulletPoint('• Entry point for all client requests');
bulletPoint('• Request routing to microservices');
bulletPoint('• Health monitoring and service discovery');
bulletPoint('• CORS handling and rate limiting');
doc.moveDown(0.3);

subSectionTitle('Auth Service (Port 5001)');
bulletPoint('• User registration and authentication');
bulletPoint('• JWT token generation and verification');
bulletPoint('• OTP generation and verification');
bulletPoint('• Google OAuth integration');
bulletPoint('• Password reset functionality');
doc.moveDown(0.3);

subSectionTitle('Travel Service (Port 5002)');
bulletPoint('• Travel planning and trip management');
bulletPoint('• AI-powered itinerary generation');
bulletPoint('• Budget allocation and optimization');
bulletPoint('• Trip details and recommendation system');
doc.moveDown(0.3);

subSectionTitle('Train Service (Port 5003)');
bulletPoint('• Train search and availability');
bulletPoint('• Transport booking integration');
bulletPoint('• Facilities information');
bulletPoint('• Railway API integration');
doc.moveDown(0.3);

subSectionTitle('Payment Service (Port 5004)');
bulletPoint('• Payment initiation and verification');
bulletPoint('• Booking management');
bulletPoint('• Refund processing');
bulletPoint('• Transaction history tracking');
doc.addPage();

// Architecture Diagram
sectionTitle('Service Communication Diagram');
doc.fontSize(10).text(`
Client (Next.js - Port 3000)
         │
         ▼
API Gateway (Port 5000)
   ├─────┼─────┬──────┤
   ▼     ▼     ▼      ▼
Auth  Travel Train  Payment
(5001)(5002)(5003)  (5004)
   └─────┴─────┬──────┘
         │
         ▼
     MongoDB
    (Port 27017)
`);
doc.moveDown(0.5);

// 4. Project Structure
sectionTitle('4. Project Structure');

subSectionTitle('Client Directory (/client)');
bulletPoint('• /app - Next.js App Router pages and layouts');
bulletPoint('• /components - Reusable React components');
bulletPoint('• /store - Zustand state management stores');
bulletPoint('• /utils - Utility functions and helpers');
bulletPoint('• Config files: next.config.js, tsconfig.json, tailwind.config.js');
doc.moveDown(0.3);

subSectionTitle('Server Directory (/server)');
bulletPoint('• /controllers - Request handlers for business logic');
bulletPoint('• /models - Mongoose schemas (User, Booking, Hotel, etc.)');
bulletPoint('• /routes - API route definitions');
bulletPoint('• /services - Business logic layer');
bulletPoint('• /middleware - Express middleware');
bulletPoint('• /config - Database and email configuration');
bulletPoint('• /utils - Helper functions and utilities');
bulletPoint('• /rail-api - Indian Railways API integration');
doc.moveDown(0.3);

subSectionTitle('Services Directory (/services)');
bulletPoint('• /auth-service - Authentication microservice');
bulletPoint('• /gateway - API Gateway');
bulletPoint('• /payment-service - Payment processing');
bulletPoint('• /train-service - Train booking service');
bulletPoint('• /travel-service - Travel planning service');
doc.addPage();

// 5. Key Features
sectionTitle('5. Key Features');

subSectionTitle('Authentication & Authorization');
bulletPoint('• Email/Password registration and login');
bulletPoint('• Google OAuth integration');
bulletPoint('• OTP-based password reset');
bulletPoint('• JWT-based secure token management');
bulletPoint('• Role-based access control');
doc.moveDown(0.3);

subSectionTitle('Travel Planning');
bulletPoint('• AI-powered itinerary generation');
bulletPoint('• Multi-destination trip planning');
bulletPoint('• Budget allocation and optimization');
bulletPoint('• Real-time availability checking');
bulletPoint('• Hotel and restaurant recommendations');
doc.moveDown(0.3);

subSectionTitle('Train Booking');
bulletPoint('• Integration with Indian Railways');
bulletPoint('• Real-time train search');
bulletPoint('• Facility information display');
bulletPoint('• Booking management');
doc.moveDown(0.3);

subSectionTitle('Payment Processing');
bulletPoint('• Razorpay payment gateway integration');
bulletPoint('• Secure transaction processing');
bulletPoint('• Refund management');
bulletPoint('• Transaction history');
doc.moveDown(0.3);

subSectionTitle('User Management');
bulletPoint('• Profile management');
bulletPoint('• Booking history');
bulletPoint('• Trip tracking');
bulletPoint('• Favorites and saved plans');
doc.addPage();

// 6. Technology Dependencies
sectionTitle('6. Key Technology Dependencies');

subSectionTitle('Frontend Dependencies (Client):');
const frontendDeps = [
  'next@14.0.4',
  'react@18.2.0',
  'react-dom@18.2.0',
  'tailwindcss@3.3.6',
  'zustand@4.4.7',
  'axios@1.6.2',
  'recharts@2.10.3',
  'framer-motion@10.16.16',
  'react-hot-toast@2.4.1',
  '@react-oauth/google@0.13.4'
];
frontendDeps.forEach(dep => bulletPoint('• ' + dep));
doc.moveDown(0.5);

subSectionTitle('Backend Dependencies (Server):');
const backendDeps = [
  'express@4.18.2',
  'mongoose@8.0.0',
  'jsonwebtoken@9.0.2',
  'bcryptjs@2.4.3',
  'nodemailer@6.9.7',
  'razorpay@2.9.2',
  'axios@1.6.2',
  'cors@2.8.5',
  'helmet@7.1.0',
  'express-rate-limit@7.1.5',
  'express-validator@7.0.1'
];
backendDeps.forEach(dep => bulletPoint('• ' + dep));
doc.addPage();

// 7. Deployment & Infrastructure
sectionTitle('7. Deployment & Infrastructure');

subSectionTitle('Docker Containerization:');
bulletPoint('• Each microservice has its own Dockerfile');
bulletPoint('• Docker Compose for local development orchestration');
bulletPoint('• Service health checks configured');
bulletPoint('• Volume persistence for MongoDB data');
doc.moveDown(0.3);

subSectionTitle('Environment Variables:');
bulletPoint('• JWT_SECRET - Secret key for JWT signing');
bulletPoint('• MONGODB_URI - Database connection string');
bulletPoint('• SMTP_USER, SMTP_PASS - Email configuration');
bulletPoint('• RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET - Payment gateway');
bulletPoint('• ALLOWED_ORIGINS - CORS configuration');
doc.moveDown(0.3);

subSectionTitle('AWS Deployment:');
bulletPoint('• Elastic Beanstalk for application hosting');
bulletPoint('• .elasticbeanstalk configuration for EB deployment');
bulletPoint('• appspec.yml for CodeDeploy configuration');
bulletPoint('• Auto-scaling and load balancing support');
doc.moveDown(0.3);

subSectionTitle('Database:');
bulletPoint('• MongoDB with authentication enabled');
bulletPoint('• Collections: Users, Bookings, Hotels, Restaurants, Trips');
bulletPoint('• Connection pooling for performance');
bulletPoint('• Automated backup and recovery');
doc.addPage();

// 8. API Services
sectionTitle('8. API Services Overview');

subSectionTitle('Auth Service Endpoints:');
bulletPoint('POST /auth/register - User registration');
bulletPoint('POST /auth/login - User login');
bulletPoint('POST /auth/verify-otp - OTP verification');
bulletPoint('POST /auth/reset-password - Password reset');
bulletPoint('POST /auth/google-oauth - Google OAuth login');
doc.moveDown(0.3);

subSectionTitle('Travel Service Endpoints:');
bulletPoint('POST /travel/generate-plan - AI itinerary generation');
bulletPoint('GET /travel/trips - Fetch user trips');
bulletPoint('POST /travel/trips - Create new trip');
bulletPoint('GET /travel/recommendations - Get recommendations');
bulletPoint('POST /travel/optimize-budget - Budget optimization');
doc.moveDown(0.3);

subSectionTitle('Train Service Endpoints:');
bulletPoint('POST /trains/search - Search trains');
bulletPoint('GET /trains/:id - Get train details');
bulletPoint('POST /trains/:id/book - Book train ticket');
bulletPoint('GET /trains/facilities - Get facility information');
doc.moveDown(0.3);

subSectionTitle('Payment Service Endpoints:');
bulletPoint('POST /payments/initiate - Initiate payment');
bulletPoint('POST /payments/verify - Verify payment');
bulletPoint('POST /payments/refund - Process refund');
bulletPoint('GET /payments/history - Transaction history');
doc.addPage();

// 9. Database Design
sectionTitle('9. Database Design');

subSectionTitle('User Model:');
bulletPoint('• _id, email, password, firstName, lastName');
bulletPoint('• googleId, googleAccessToken');
bulletPoint('• phone, address, city, state, country');
bulletPoint('• createdAt, updatedAt');
doc.moveDown(0.3);

subSectionTitle('Trip Model:');
bulletPoint('• _id, userId, title, description');
bulletPoint('• startDate, endDate, status');
bulletPoint('• budget, spent, destinations');
bulletPoint('• itinerary, bookings, preferences');
doc.moveDown(0.3);

subSectionTitle('Booking Model:');
bulletPoint('• _id, userId, tripId, type (hotel/train/restaurant)');
bulletPoint('• bookingDetails, confirmationNumber');
bulletPoint('• amount, paymentStatus, paymentId');
bulletPoint('• createdAt, cancelledAt');
doc.moveDown(0.3);

subSectionTitle('Hotel & Restaurant Models:');
bulletPoint('• _id, name, location, rating');
bulletPoint('• price, amenities, images');
bulletPoint('• reviews, availability');
doc.moveDown(0.3);

subSectionTitle('Transport Model:');
bulletPoint('• _id, type, name, departure, arrival');
bulletPoint('• price, availableSeats, facilities');
bulletPoint('• schedule, cancellationPolicy');
doc.addPage();

// 10. Security & Best Practices
sectionTitle('10. Security & Best Practices');

subSectionTitle('Authentication Security:');
bulletPoint('• JWT tokens with 7-day expiration');
bulletPoint('• Password hashing with bcryptjs');
bulletPoint('• Secure OTP generation and verification');
bulletPoint('• OAuth 2.0 integration for third-party auth');
doc.moveDown(0.3);

subSectionTitle('API Security:');
bulletPoint('• CORS restrictions with whitelist');
bulletPoint('• Rate limiting on sensitive endpoints');
bulletPoint('• Request validation with express-validator');
bulletPoint('• Helmet.js for security headers');
doc.moveDown(0.3);

subSectionTitle('Data Protection:');
bulletPoint('• HTTPS enforcement in production');
bulletPoint('• Encrypted password storage');
bulletPoint('• Sensitive data encryption in transit');
bulletPoint('• MongoDB authentication enabled');
doc.moveDown(0.3);

subSectionTitle('Code Quality:');
bulletPoint('• Error handling middleware');
bulletPoint('• Request logging with Morgan');
bulletPoint('• Input validation on all endpoints');
bulletPoint('• Environment variable management');
doc.moveDown(0.3);

subSectionTitle('Infrastructure Security:');
bulletPoint('• Docker container isolation');
bulletPoint('• Network segmentation with Docker networks');
bulletPoint('• Health checks for service monitoring');
bulletPoint('• Automated rollback on deployment');
doc.addPage();

// Development Workflow
sectionTitle('Development Workflow');

subSectionTitle('Local Development Setup:');
bulletPoint('1. Clone the repository');
bulletPoint('2. Install dependencies: npm install');
bulletPoint('3. Configure environment variables');
bulletPoint('4. Run Docker Compose: docker-compose up');
bulletPoint('5. Start Next.js dev server: npm run dev');
doc.moveDown(0.5);

subSectionTitle('Running Tests:');
bulletPoint('• Unit tests: npm test');
bulletPoint('• Integration tests: npm run test:integration');
bulletPoint('• HTTP endpoint tests: node test-http.js');
doc.moveDown(0.5);

subSectionTitle('Building for Production:');
bulletPoint('• Build frontend: npm run build');
bulletPoint('• Docker image build: docker build -t image-name .');
bulletPoint('• Deploy to AWS Elastic Beanstalk: eb deploy');
doc.addPage();

// Conclusion
sectionTitle('Conclusion');
normalText('TravelBudget represents a modern, scalable approach to travel planning with AI-powered personalization. The microservices architecture ensures flexibility and independent scalability of services, while the technology stack provides robustness and developer familiarity.');
doc.moveDown(0.5);
normalText('The project demonstrates best practices in:');
doc.moveDown(0.3);
bulletPoint('• Microservices architecture patterns');
bulletPoint('• API design and documentation');
bulletPoint('• Security implementation');
bulletPoint('• Containerization and deployment');
bulletPoint('• State management and UI/UX design');
doc.moveDown(1);
normalText('Continued development should focus on:');
doc.moveDown(0.3);
bulletPoint('• Expanding AI capabilities for recommendations');
bulletPoint('• Adding more travel provider integrations');
bulletPoint('• Implementing real-time notifications');
bulletPoint('• Enhanced mobile app support');
bulletPoint('• Performance optimization and caching');
doc.moveDown(2);
normalText(`Report Generated: ${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}`, { align: 'center' });

// Finalize PDF
doc.end();

console.log('PDF report generated successfully at:', outputPath);
