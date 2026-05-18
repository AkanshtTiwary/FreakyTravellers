# Microservices Architecture Documentation

## Overview

The TravelBudget application has been refactored from a monolithic architecture to a **microservices architecture** with the following services:

### Services

1. **API Gateway** (Port 5000)
   - Entry point for all client requests
   - Routes requests to appropriate microservices
   - Health monitoring and service discovery

2. **Auth Service** (Port 5001)
   - User registration and authentication
   - JWT token generation and verification
   - OTP generation and verification
   - Google OAuth integration
   - Password reset functionality

3. **Travel Service** (Port 5002)
   - Travel planning and trip management
   - Itinerary generation using AI
   - Budget allocation and optimization
   - Trip details and management

4. **Train Service** (Port 5003)
   - Train search and availability
   - Transport booking
   - Facilities information
   - Railway integration

5. **Payment Service** (Port 5004)
   - Payment initiation and verification
   - Booking management
   - Refund processing
   - Transaction history

6. **MongoDB** (Port 27017)
   - Shared database for all services
   - Data persistence

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Client (Next.js)                      │
│                   (Port 3000)                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │     API Gateway              │
          │     (Port 5000)              │
          └──┬──────┬──────┬─────────┬───┘
             │      │      │         │
    ┌────────┘      │      │         │
    │        ┌──────┘      │         │
    │        │      ┌──────┘         │
    │        │      │         ┌──────┘
    ▼        ▼      ▼         ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
│  Auth  │ │  Travel  │ │  Train   │ │  Payment    │
│Service │ │ Service  │ │ Service  │ │ Service     │
│(5001)  │ │ (5002)   │ │ (5003)   │ │ (5004)      │
└────┬───┘ └────┬─────┘ └────┬─────┘ └─────┬───────┘
     │          │            │             │
     └──────────┴────────────┴─────────────┘
              │
              ▼
          ┌─────────────┐
          │  MongoDB    │
          │  (27017)    │
          └─────────────┘
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB Atlas or local MongoDB (optional)

### Environment Configuration

1. **Copy the example environment files:**

```bash
cp .env.docker .env
# Edit .env with your credentials (email, payment gateway keys, etc.)
```

2. **Update environment variables in `.env`:**

```env
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

### Running with Docker Compose

**Start all services:**

```bash
docker-compose up -d
```

**Stop all services:**

```bash
docker-compose down
```

**View logs:**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
```

**Rebuild services after code changes:**

```bash
docker-compose up -d --build
```

### Service URLs

After starting with Docker Compose:

- **API Gateway:** http://localhost:5000
- **Auth Service:** http://localhost:5001
- **Travel Service:** http://localhost:5002
- **Train Service:** http://localhost:5003
- **Payment Service:** http://localhost:5004
- **MongoDB:** localhost:27017
- **Client:** http://localhost:3000

### Health Checks

**Gateway Status:**
```bash
curl http://localhost:5000/health
```

**All Services Status:**
```bash
curl http://localhost:5000/services-status
```

**Individual Service Health:**
```bash
curl http://localhost:5001/health  # Auth
curl http://localhost:5002/health  # Travel
curl http://localhost:5003/health  # Train
curl http://localhost:5004/health  # Payment
```

## API Endpoints

The client communicates through the API Gateway at `http://localhost:5000/api`

### Auth Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/profile` - Get user profile

### Travel Endpoints
- `POST /api/travel/create` - Create trip
- `GET /api/travel` - Get all trips
- `GET /api/travel/:tripId` - Get trip details
- `POST /api/plans/generate` - Generate travel plan
- `POST /api/plans/:planId/optimize` - Optimize plan

### Train Endpoints
- `POST /api/trains/search` - Search trains
- `POST /api/transport/search` - Search transport
- `GET /api/facilities/all` - Get all facilities

### Payment Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:paymentId` - Get payment details
- `POST /api/payments/:paymentId/refund` - Refund payment

## Development

### Running Services Locally (Without Docker)

1. **Install dependencies for each service:**

```bash
cd services/gateway && npm install
cd ../auth-service && npm install
cd ../travel-service && npm install
cd ../train-service && npm install
cd ../payment-service && npm install
```

2. **Start MongoDB locally:**

```bash
mongod
```

3. **Start each service in a separate terminal:**

```bash
# Terminal 1 - Gateway
cd services/gateway
npm run dev

# Terminal 2 - Auth Service
cd services/auth-service
npm run dev

# Terminal 3 - Travel Service
cd services/travel-service
npm run dev

# Terminal 4 - Train Service
cd services/train-service
npm run dev

# Terminal 5 - Payment Service
cd services/payment-service
npm run dev
```

## Data Flow

1. Client sends request to API Gateway
2. Gateway routes to appropriate microservice based on URL path
3. Service processes request and queries MongoDB
4. Service returns response to Gateway
5. Gateway forwards response to Client

## Scaling

To scale individual services:

```bash
# Start multiple instances of a service
docker-compose up -d --scale travel-service=3
```

## Monitoring

Use `docker-compose ps` to check service status:

```bash
docker-compose ps
```

## Deployment

For production deployment:

1. Use environment variables instead of `.env` files
2. Configure proper authentication and authorization
3. Set up service mesh (Istio, Linkerd) for advanced routing
4. Use managed Kubernetes (EKS, GKE, AKS)
5. Set up monitoring with Prometheus/Grafana
6. Configure logging with ELK stack

## Troubleshooting

### Services can't communicate

Ensure all services are on the same Docker network:
```bash
docker network inspect travelbudget-network
```

### MongoDB connection issues

Check MongoDB logs:
```bash
docker-compose logs mongodb
```

### Service keeps restarting

Check service logs:
```bash
docker-compose logs auth-service
```

## Next Steps

1. **Move business logic** from old `server/` directory to individual services
2. **Configure authentication** between services (mutual TLS, JWT validation)
3. **Implement API documentation** with Swagger/OpenAPI
4. **Add distributed tracing** (Jaeger, Zipkin)
5. **Set up CI/CD pipeline** for automated deployments
6. **Create service mesh** for advanced routing and security
