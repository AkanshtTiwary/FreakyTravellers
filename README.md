# 🌍 FreakyTravellers - AI-Powered Budget Travel Optimization

A full-stack web application that optimizes travel within your budget using AI algorithms. Enter your source, destination, and budget - we'll find the cheapest transport, best hotels, and recommend restaurants intelligently!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

## ✨ Key Features

- 🤖 **AI-Powered Optimization**: Smart budget allocation (40% hotels, 30% food, 30% local transport)
- 🚌 **Cheapest Transport**: Automatically finds the most affordable bus/train/flight
- 🏨 **Hotel Recommendations**: Best hotels within your allocated budget
- 🍽️ **Restaurant Suggestions**: Budget-friendly dining options
- 💡 **Smart Alternatives**: Never rejects - always provides backup plans
- 🔐 **Secure Authentication**: Email OTP verification, JWT protected routes
- 💳 **Razorpay Integration**: Seamless payment processing
- 📱 **Responsive Design**: Beautiful UI with Framer Motion animations

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** with Mongoose - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email OTP verification
- **Razorpay** - Payment gateway
- **express-validator** - Input validation
- **express-rate-limit** - Rate limiting
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 14** (App Router) - React framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 📂 Project Structure

```
FreakyTravellers/
│
├── server/                          # Backend (Node.js + Express)
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   └── email.js                 # Nodemailer configuration
│   │
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── travelController.js      # Trip optimization logic
│   │   └── paymentController.js     # Razorpay integration
│   │
│   ├── models/
│   │   ├── User.js                  # User schema with OTP
│   │   ├── Trip.js                  # Trip optimization schema
│   │   ├── Booking.js               # Booking & payment schema
│   │   ├── Transport.js             # Transport options schema
│   │   ├── Hotel.js                 # Hotel data schema
│   │   └── Restaurant.js            # Restaurant data schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── travelRoutes.js          # Trip endpoints
│   │   └── paymentRoutes.js         # Payment endpoints
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── errorHandler.js          # Global error handling
│   │   ├── validator.js             # Input validation
│   │   └── rateLimiter.js           # Rate limiting
│   │
│   ├── utils/
│   │   └── optimizationAlgorithm.js # Core budget optimization logic
│   │
│   ├── .env.example                 # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                    # Entry point
│
├── client/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js            # Root layout
│   │   │   ├── page.js              # Home page
│   │   │   ├── login/
│   │   │   │   └── page.js          # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.js          # Signup page
│   │   │   ├── dashboard/
│   │   │   │   └── page.js          # User dashboard
│   │   │   ├── results/
│   │   │   │   └── page.js          # Trip results page
│   │   │   └── globals.css          # Global styles
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.js            # Navigation bar
│   │   │   ├── SearchForm.js        # Trip search form
│   │   │   ├── TransportCard.js     # Transport display
│   │   │   ├── HotelCard.js         # Hotel display
│   │   │   └── BudgetSummary.js     # Budget breakdown
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.js         # Auth state (Zustand)
│   │   │   └── tripStore.js         # Trip state (Zustand)
│   │   │
│   │   └── utils/
│   │       └── api.js               # Axios API utilities
│   │
│   ├── .env.local.example
│   ├── .gitignore
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── postcss.config.js
│
└── README.md                        # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or higher
- **MongoDB** 6.x or higher (local or MongoDB Atlas)
- **npm** or **yarn**
- **Razorpay Account** (for payments)
- **Gmail Account** (for sending OTP emails)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/freakytravellers.git
cd freakytravellers
```

#### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Configure `.env` file:**
```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/freakytravellers
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freakytravellers

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRE=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@freakytravellers.com

# OTP
OTP_EXPIRE_MINUTES=10

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Client URL
CLIENT_URL=http://localhost:3000
```

**Start Backend Server:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

#### 3. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

**Configure `.env.local` file:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Start Frontend:**
```bash
# Development mode
npm run dev

# Build for production
npm run build
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Setting Up Gmail for OTP

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use this password in `EMAIL_PASSWORD` in `.env`

## 💳 Setting Up Razorpay

1. Sign up at https://razorpay.com/
2. Go to **Settings** → **API Keys**
3. Generate **Test Keys** for development
4. Copy **Key ID** and **Key Secret**
5. Add them to `.env` (backend) and `.env.local` (frontend)

## 🧪 Testing the Application

### API Endpoints

#### Authentication
```bash
# Signup
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "phone": "9876543210"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "Password123"
}

# Send OTP
POST /api/auth/send-otp
{
  "email": "john@example.com"
}

# Verify OTP
POST /api/auth/verify-otp
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Trip Optimization
```bash
# Optimize Trip
POST /api/trips/optimize
{
  "source": "Mumbai",
  "destination": "Goa",
  "totalBudget": 5000,
  "numberOfTravelers": 1
}

# Get My Trips
GET /api/trips/my-trips
Authorization: Bearer <token>
```

#### Payment
```bash
# Create Order
POST /api/payments/create-order
Authorization: Bearer <token>
{
  "tripId": "trip_id",
  "amount": 5000,
  "contactDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}
```

## 📊 Core Algorithm Explained

### Budget Optimization Flow

1. **Fetch Transport Options**: Get all available buses, trains, and flights
2. **Sort by Price**: Arrange in ascending order
3. **Select Cheapest**: Pick the most affordable option
4. **Calculate Remaining Budget**: `Total Budget - Transport Cost`
5. **Allocate Smart Budget**:
   - **40%** → Hotels/Accommodation
   - **30%** → Food & Restaurants
   - **30%** → Local Transport & Activities
6. **If Budget Too Low**:
   - Suggest nearby alternative destination
   - Recommend shorter duration
   - Suggest sleeper class instead of flight
7. **Return Optimized Plan** with full breakdown

### Example
```javascript
Input:
- Source: Mumbai
- Destination: Goa
- Budget: ₹10,000

Process:
1. Cheapest transport: Bus (₹800)
2. Remaining: ₹9,200
3. Allocation:
   - Hotels: ₹3,680 (40%)
   - Food: ₹2,760 (30%)
   - Local: ₹2,760 (30%)
4. Trip Duration: 3 days, 2 nights
5. Hotel per night: ₹1,840

Output: Complete trip plan with transport, hotels, restaurants, and local transport suggestions
```

## 🌐 Deployment

### Deploy Backend (Render)

1. Push code to GitHub
2. Go to https://render.com/
3. Create new **Web Service**
4. Connect your repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Add all `.env` variables
6. Deploy!

### Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to client folder
cd client

# Deploy
vercel

# Follow prompts and add environment variables
```

Or use Vercel Dashboard:
1. Go to https://vercel.com/
2. Import your GitHub repository
3. Select `client` folder as root directory
4. Add environment variables
5. Deploy!

### Environment Variables for Production

**Backend (Render):**
- Set `NODE_ENV=production`
- Use MongoDB Atlas connection string
- Update `CLIENT_URL` to your Vercel URL

**Frontend (Vercel):**
- Set `NEXT_PUBLIC_API_BASE_URL` to your Render backend URL
- Add Razorpay production keys

## 📱 Features in Detail

### 1. **User Authentication**
- ✅ Email + Password signup
- ✅ OTP verification via email
- ✅ Login with password
- ✅ Login with OTP (passwordless)
- ✅ Forgot password with OTP reset
- ✅ JWT token-based authentication
- ✅ Protected routes

### 2. **Trip Optimization**
- ✅ Smart budget allocation algorithm
- ✅ Cheapest transport finder
- ✅ Hotel recommendations within budget
- ✅ Restaurant suggestions
- ✅ Local transport options
- ✅ Alternative plans for low budgets
- ✅ Trip history and tracking

### 3. **Payment System**
- ✅ Razorpay integration
- ✅ Secure payment processing
- ✅ Order creation and verification
- ✅ Booking confirmation emails
- ✅ Payment history
- ✅ Refund support

### 4. **Security**
- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Environment variable protection

## 🎨 UI/UX Features

- 🎭 Beautiful gradient backgrounds
- ✨ Smooth animations with Framer Motion
- 📱 Fully responsive design
- 🌙 Clean and modern interface
- 🎯 Intuitive navigation
- 🔔 Toast notifications
- ⚡ Fast page transitions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**FreakyTravellers Team**

- Email: support@freakytravellers.com
- GitHub: [@freakytravellers](https://github.com/freakytravellers)

## 🙏 Acknowledgments

- MongoDB for database
- Razorpay for payment gateway
- Vercel for frontend hosting
- Render for backend hosting
- All open-source contributors

## 📞 Support

For any queries or support:
- Email: support@freakytravellers.com
- GitHub Issues: [Create an issue](https://github.com/freakytravellers/issues)

---

Made with ❤️ by FreakyTravellers Team

**Happy Budget Traveling! ✈️🌍**
# FreakyTravellers
