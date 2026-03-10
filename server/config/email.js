/**
 * Email Configuration
 * Nodemailer setup for sending OTP and notifications
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * @returns {nodemailer.Transporter}
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `FreakyTravellers <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Email Verification - OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ FreakyTravellers</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <h2>Welcome to FreakyTravellers!</h2>
            <p>Thank you for signing up. Please use the following OTP to verify your email address:</p>
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>⏰ This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</strong></p>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 14px; color: #666;">
              Happy travels! 🌍<br>
              The FreakyTravellers Team
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FreakyTravellers. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ OTP email sent to: ${email}`);
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send booking confirmation email
 * @param {string} email - Recipient email
 * @param {object} bookingDetails - Booking information
 * @returns {Promise<void>}
 */
const sendBookingConfirmation = async (email, bookingDetails) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `FreakyTravellers <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Booking Confirmation - FreakyTravellers',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">🎉 Booking Confirmed!</h2>
          <p>Your trip has been successfully booked.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Trip Details:</h3>
            <p><strong>From:</strong> ${bookingDetails.source}</p>
            <p><strong>To:</strong> ${bookingDetails.destination}</p>
            <p><strong>Budget:</strong> ₹${bookingDetails.totalBudget}</p>
            <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          </div>
          <p>Thank you for choosing FreakyTravellers!</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Booking confirmation sent to: ${email}`);
  } catch (error) {
    console.error(`❌ Error sending booking confirmation: ${error.message}`);
  }
};

module.exports = {
  sendOTPEmail,
  sendBookingConfirmation,
};
