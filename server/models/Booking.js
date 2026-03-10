/**
 * Booking Model
 * Handles payment confirmations and booking records
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Trip Reference
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },

    // Booking Information
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },

    // Travel Details
    travelDetails: {
      source: String,
      destination: String,
      departureDate: Date,
      returnDate: Date,
      numberOfTravelers: {
        type: Number,
        default: 1,
        min: 1,
      },
    },

    // Payment Information
    payment: {
      // Razorpay Details
      razorpayOrderId: {
        type: String,
        required: true,
      },
      razorpayPaymentId: String,
      razorpaySignature: String,

      // Payment Status
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },

      // Amount Details
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'INR',
      },

      // Payment Method
      method: {
        type: String,
        enum: ['card', 'netbanking', 'upi', 'wallet'],
      },

      // Transaction Timestamps
      paidAt: Date,
      refundedAt: Date,

      // Additional Details
      receipt: String,
      notes: mongoose.Schema.Types.Mixed,
    },

    // Booking Items Breakdown
    items: [
      {
        category: {
          type: String,
          enum: ['transport', 'accommodation', 'package', 'other'],
          required: true,
        },
        description: String,
        quantity: {
          type: Number,
          default: 1,
        },
        unitPrice: Number,
        totalPrice: Number,
        details: mongoose.Schema.Types.Mixed,
      },
    ],

    // Pricing Summary
    pricing: {
      subtotal: Number,
      taxes: {
        gst: Number,
        serviceTax: Number,
        other: Number,
      },
      discount: {
        code: String,
        amount: Number,
        percentage: Number,
      },
      total: Number,
    },

    // Booking Status
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'completed',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },

    // Cancellation Details
    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false,
      },
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      refundAmount: Number,
      refundStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
      },
    },

    // Contact Information
    contactDetails: {
      name: String,
      email: String,
      phone: String,
    },

    // Special Requests
    specialRequests: String,

    // Confirmation Details
    confirmationNumber: String,
    confirmationSentAt: Date,

    // Metadata
    metadata: {
      ipAddress: String,
      userAgent: String,
      source: {
        type: String,
        enum: ['web', 'mobile', 'api'],
        default: 'web',
      },
    },
  },
  {
    timestamps: true,
  }
);

// ==================== MIDDLEWARE ====================

// Generate unique booking ID before saving
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    // Generate booking ID: SBT-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.bookingId = `SBT-${dateStr}-${randomStr}`;
  }
  next();
});

// ==================== INDEXES ====================
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ 'payment.razorpayOrderId': 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ status: 1 });

// ==================== METHODS ====================

/**
 * Mark booking as paid
 * @param {object} paymentDetails - Payment details from Razorpay
 */
bookingSchema.methods.markAsPaid = function (paymentDetails) {
  this.payment.status = 'completed';
  this.payment.razorpayPaymentId = paymentDetails.razorpay_payment_id;
  this.payment.razorpaySignature = paymentDetails.razorpay_signature;
  this.payment.paidAt = Date.now();
  this.status = 'confirmed';

  return this.save();
};

/**
 * Cancel booking
 * @param {string} userId - User who cancelled
 * @param {string} reason - Cancellation reason
 */
bookingSchema.methods.cancelBooking = function (userId, reason) {
  this.status = 'cancelled';
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledAt = Date.now();
  this.cancellation.cancelledBy = userId;
  this.cancellation.reason = reason;
  this.cancellation.refundStatus = 'pending';

  return this.save();
};

/**
 * Calculate total amount
 */
bookingSchema.methods.calculateTotal = function () {
  let subtotal = 0;

  // Sum all items
  this.items.forEach((item) => {
    subtotal += item.totalPrice || item.unitPrice * item.quantity;
  });

  // Calculate taxes
  const gst = subtotal * 0.05; // 5% GST
  const serviceTax = subtotal * 0.02; // 2% Service Tax

  // Apply discount if any
  let discount = 0;
  if (this.pricing && this.pricing.discount) {
    if (this.pricing.discount.percentage) {
      discount = (subtotal * this.pricing.discount.percentage) / 100;
    } else if (this.pricing.discount.amount) {
      discount = this.pricing.discount.amount;
    }
  }

  const total = subtotal + gst + serviceTax - discount;

  this.pricing = {
    subtotal,
    taxes: { gst, serviceTax, other: 0 },
    discount: this.pricing?.discount || { amount: discount },
    total,
  };

  this.payment.amount = total;

  return total;
};

// ==================== STATIC METHODS ====================

/**
 * Get user booking history
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
bookingSchema.statics.getUserBookings = function (userId) {
  return this.find({ user: userId })
    .populate('trip')
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Get booking statistics
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
bookingSchema.statics.getBookingStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$payment.amount' },
      },
    },
  ]);

  return stats;
};

module.exports = mongoose.model('Booking', bookingSchema);
