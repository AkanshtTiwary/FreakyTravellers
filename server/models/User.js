/**
 * User Model
 * Handles user authentication, profile, and OTP verification
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: function() {
        // Password is required only if not using Google OAuth
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't send password in queries by default
    },
    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when present
    },
    picture: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    // Role & Status
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // OTP for email verification and login
    otp: {
      type: String,
      select: false,
    },
    otpExpire: {
      type: Date,
      select: false,
    },

    // Profile Information
    avatar: {
      type: String,
      default: 'default-avatar.png',
    },
    preferences: {
      currency: {
        type: String,
        default: 'INR',
      },
      language: {
        type: String,
        default: 'en',
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Last Login
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ==================== MIDDLEWARE ====================

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT token
 * @returns {string} JWT token
 */
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Generate OTP for email verification or login
 * @returns {string} OTP code (6 digits)
 */
userSchema.methods.generateOTP = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP before saving
  this.otp = crypto.createHash('sha256').update(otp).digest('hex');

  // Set OTP expiry (10 minutes from now)
  this.otpExpire = Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000;

  return otp; // Return plain OTP to send via email
};

/**
 * Verify OTP
 * @param {string} enteredOTP - OTP entered by user
 * @returns {boolean}
 */
userSchema.methods.verifyOTP = function (enteredOTP) {
  // Hash entered OTP
  const hashedOTP = crypto.createHash('sha256').update(enteredOTP).digest('hex');

  // Check if OTP matches and not expired
  return this.otp === hashedOTP && this.otpExpire > Date.now();
};

/**
 * Generate password reset token
 * @returns {string} Reset token
 */
userSchema.methods.generateResetPasswordToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiry time (30 minutes)
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

// ==================== INDEXES ====================
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
