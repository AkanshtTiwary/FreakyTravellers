/**
 * Authentication Controller
 * Handles user registration, login, OTP verification, and password reset
 */

const User = require('../models/User');
const { sendOTPEmail } = require('../config/email');
const { asyncHandler } = require('../middleware/errorHandler');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
  });

  // Generate OTP for email verification
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    console.error('Failed to send OTP:', error);
    // Don't fail signup if email fails
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email with OTP.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
      token,
    },
    requiresEmailVerification: true,
  });
});

/**
 * @desc    Login user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.',
    });
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Update last login time
  user.lastLogin = Date.now();
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @desc    Send OTP for email verification or login
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
exports.sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email',
    });
  }

  // Generate OTP
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  await sendOTPEmail(email, otp);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your email',
    data: {
      email: email,
      expiresIn: `${process.env.OTP_EXPIRE_MINUTES || 10} minutes`,
    },
  });
});

/**
 * @desc    Verify OTP for email verification
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Find user and include OTP fields
  const user = await User.findOne({ email }).select('+otp +otpExpire');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify OTP
  const isOTPValid = user.verifyOTP(otp);

  if (!isOTPValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.lastLogin = Date.now();
  await user.save();

  // Generate JWT token for immediate login
  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
      },
      token,
    },
  });
});

/**
 * @desc    Login with OTP (passwordless login)
 * @route   POST /api/auth/login-with-otp
 * @access  Public
 */
exports.loginWithOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Find user and include OTP fields
  const user = await User.findOne({ email }).select('+otp +otpExpire');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify OTP
  const isOTPValid = user.verifyOTP(otp);

  if (!isOTPValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
  }

  // Clear OTP fields
  user.otp = undefined;
  user.otpExpire = undefined;
  user.lastLogin = Date.now();
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    },
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, preferences } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Update fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (preferences) {
    user.preferences = {
      ...user.preferences,
      ...preferences,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences,
      },
    },
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  // If using cookies, clear the cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Forgot password - Send reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email',
    });
  }

  // Generate OTP instead of reset token (simpler for users)
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  await sendOTPEmail(email, otp);

  res.status(200).json({
    success: true,
    message: 'Password reset OTP sent to your email',
  });
});

/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Find user and include OTP fields
  const user = await User.findOne({ email }).select('+otp +otpExpire');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify OTP
  const isOTPValid = user.verifyOTP(otp);

  if (!isOTPValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
  }

  // Update password
  user.password = newPassword;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
  });
});

/**
 * @desc    Google OAuth Login/Signup
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: 'Google credential is required',
    });
  }

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google email not verified',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - check if they used Google OAuth before
      if (!user.googleId) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.picture = picture;
        user.authProvider = 'google';
        user.isEmailVerified = true; // Google users are already verified
        await user.save();
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();
    } else {
      // Create new user with Google OAuth
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        authProvider: 'google',
        isEmailVerified: true, // Google users are already verified
        lastLogin: Date.now(),
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid Google token',
    });
  }
});
