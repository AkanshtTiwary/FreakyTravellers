/**
 * Payment Controller
 * Handles Razorpay payment integration and booking management
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const { sendBookingConfirmation } = require('../config/email');
const { asyncHandler } = require('../middleware/errorHandler');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create Razorpay order for trip booking
 * @route   POST /api/payments/create-order
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const { tripId, amount, contactDetails } = req.body;

  // Verify trip exists
  const trip = await Trip.findById(tripId);

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: 'Trip not found',
    });
  }

  // Validate amount (should match trip budget or be reasonable)
  const amountInPaise = Math.round(parseFloat(amount) * 100); // Convert to paise

  if (amountInPaise < 100) {
    // Minimum ₹1
    return res.status(400).json({
      success: false,
      message: 'Amount must be at least ₹1',
    });
  }

  // Create Razorpay order
  const orderOptions = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `trip_${tripId}_${Date.now()}`,
    notes: {
      tripId: tripId,
      userId: req.user.id,
      source: trip.source.city,
      destination: trip.destination.city,
    },
  };

  try {
    const order = await razorpay.orders.create(orderOptions);

    // Create booking document in database
    const booking = await Booking.create({
      user: req.user.id,
      trip: tripId,
      travelDetails: {
        source: trip.source.city,
        destination: trip.destination.city,
        numberOfTravelers: 1,
      },
      payment: {
        razorpayOrderId: order.id,
        amount: parseFloat(amount),
        currency: 'INR',
        status: 'pending',
        receipt: orderOptions.receipt,
        notes: orderOptions.notes,
      },
      items: [
        {
          category: 'package',
          description: `Trip from ${trip.source.city} to ${trip.destination.city}`,
          quantity: 1,
          unitPrice: parseFloat(amount),
          totalPrice: parseFloat(amount),
        },
      ],
      pricing: {
        subtotal: parseFloat(amount),
        total: parseFloat(amount),
      },
      contactDetails: contactDetails || {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
      status: 'pending',
    });

    // Update trip with booking reference
    trip.booking = booking._id;
    await trip.save();

    console.log(`✅ Razorpay order created: ${order.id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking.bookingId,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID, // Send to frontend for Razorpay checkout
      },
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
});

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/payments/verify-payment
 * @access  Private
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // Generate expected signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  // Verify signature
  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed. Invalid signature.',
    });
  }

  // Find booking by order ID
  const booking = await Booking.findOne({
    'payment.razorpayOrderId': razorpay_order_id,
  }).populate('trip');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  // Update booking with payment details
  await booking.markAsPaid({
    razorpay_payment_id,
    razorpay_signature,
  });

  // Update trip status to 'booked'
  if (booking.trip) {
    booking.trip.status = 'booked';
    await booking.trip.save();
  }

  // Send booking confirmation email
  try {
    await sendBookingConfirmation(req.user.email, {
      bookingId: booking.bookingId,
      source: booking.travelDetails.source,
      destination: booking.travelDetails.destination,
      totalBudget: booking.payment.amount,
    });
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Don't fail the payment verification if email fails
  }

  console.log(`✅ Payment verified successfully for booking: ${booking.bookingId}`);

  res.status(200).json({
    success: true,
    message: 'Payment verified and booking confirmed!',
    data: {
      bookingId: booking.bookingId,
      paymentId: razorpay_payment_id,
      status: booking.status,
      amount: booking.payment.amount,
    },
  });
});

/**
 * @desc    Handle payment failure
 * @route   POST /api/payments/payment-failed
 * @access  Private
 */
exports.paymentFailed = asyncHandler(async (req, res) => {
  const { orderId, error } = req.body;

  // Find booking
  const booking = await Booking.findOne({
    'payment.razorpayOrderId': orderId,
  });

  if (booking) {
    booking.payment.status = 'failed';
    booking.status = 'cancelled';
    await booking.save();
  }

  console.log(`❌ Payment failed for order: ${orderId}`);

  res.status(200).json({
    success: false,
    message: 'Payment failed',
    data: {
      orderId,
      error: error || 'Payment processing failed',
    },
  });
});

/**
 * @desc    Get booking by ID
 * @route   GET /api/payments/bookings/:id
 * @access  Private
 */
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('trip');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  // Check authorization
  if (
    booking.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this booking',
    });
  }

  res.status(200).json({
    success: true,
    data: { booking },
  });
});

/**
 * @desc    Get user's booking history
 * @route   GET /api/payments/my-bookings
 * @access  Private
 */
exports.getMyBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const bookings = await Booking.find({ user: req.user.id })
    .populate('trip')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get all bookings (Admin only)
 * @route   GET /api/payments/bookings
 * @access  Private (Admin)
 */
exports.getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by payment status
  if (req.query.paymentStatus) {
    filter['payment.status'] = req.query.paymentStatus;
  }

  const bookings = await Booking.find(filter)
    .populate('user', 'name email')
    .populate('trip')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Cancel booking and initiate refund
 * @route   POST /api/payments/bookings/:id/cancel
 * @access  Private
 */
exports.cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  // Check authorization
  if (
    booking.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking',
    });
  }

  // Check if booking is already cancelled
  if (booking.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already cancelled',
    });
  }

  // Check if payment was completed
  if (booking.payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel booking with incomplete payment',
    });
  }

  // Cancel booking
  await booking.cancelBooking(req.user.id, reason);

  // In a real application, you would initiate Razorpay refund here
  // const refund = await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
  //   amount: booking.payment.amount * 100,
  // });

  console.log(`🚫 Booking cancelled: ${booking.bookingId}`);

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully. Refund will be processed in 5-7 business days.',
    data: {
      bookingId: booking.bookingId,
      refundAmount: booking.payment.amount,
      refundStatus: 'pending',
    },
  });
});

/**
 * @desc    Get booking statistics
 * @route   GET /api/payments/stats
 * @access  Private (Admin)
 */
exports.getBookingStats = asyncHandler(async (req, res) => {
  const totalBookings = await Booking.countDocuments();
  const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
  const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

  const revenueStats = await Booking.aggregate([
    { $match: { 'payment.status': 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$payment.amount' },
        averageBookingValue: { $avg: '$payment.amount' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      revenue: revenueStats[0] || { totalRevenue: 0, averageBookingValue: 0 },
    },
  });
});

/**
 * @desc    Get Razorpay payment details
 * @route   GET /api/payments/payment/:paymentId
 * @access  Private (Admin)
 */
exports.getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return res.status(404).json({
      success: false,
      message: 'Payment not found',
    });
  }
});
