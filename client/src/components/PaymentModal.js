'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CreditCard, User, Phone, Mail, CheckCircle2,
  Loader2, AlertCircle, IndianRupee, Shield, Sparkles
} from 'lucide-react';
import { paymentAPI } from '@/utils/api';
import toast from 'react-hot-toast';

/**
 * Loads the Razorpay checkout script dynamically.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * PaymentModal
 *
 * Props:
 *   isOpen      – boolean
 *   onClose     – () => void
 *   tripId      – string   (MongoDB _id of the trip)
 *   amount      – number   (total budget in ₹)
 *   tripMeta    – { source, destination, budget }
 *   userInfo    – { name, email, phone }
 */
export default function PaymentModal({ isOpen, onClose, tripId, amount, tripMeta, userInfo }) {
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success' | 'failed'
  const [bookingResult, setBookingResult] = useState(null);
  const [contact, setContact] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    phone: userInfo?.phone || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!contact.name.trim()) e.name = 'Name is required';
    if (!contact.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) e.email = 'Invalid email';
    if (!contact.phone.trim()) e.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(contact.phone.replace(/\s/g, ''))) e.phone = 'Enter 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;

    setStep('processing');

    try {
      // Step 1: Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        setStep('form');
        return;
      }

      // Step 2: Create order on backend
      const orderRes = await paymentAPI.createOrder({
        tripId,
        amount,
        contactDetails: contact,
      });

      if (!orderRes.success) {
        toast.error(orderRes.error || orderRes.message || 'Failed to create order');
        setStep('form');
        return;
      }

      const { orderId, amount: orderAmount, currency, razorpayKeyId } = orderRes.data;

      // Step 3: Open Razorpay checkout
      const options = {
        key: razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: currency || 'INR',
        name: 'SmartBudgetTrip',
        description: `Trip: ${tripMeta?.source} → ${tripMeta?.destination}`,
        image: '/logo.png', // optional
        order_id: orderId,
        prefill: {
          name: contact.name,
          email: contact.email,
          contact: contact.phone,
        },
        notes: {
          tripId,
          source: tripMeta?.source,
          destination: tripMeta?.destination,
        },
        theme: { color: '#1d9bf0' },
        modal: {
          ondismiss: () => {
            // User closed Razorpay without paying
            setStep('form');
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
        },
        handler: async (response) => {
          // Step 4: Verify payment on backend
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setBookingResult(verifyRes.data);
              setStep('success');
              toast.success('Payment successful! Booking confirmed.');
            } else {
              setStep('failed');
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            setStep('failed');
            toast.error('Payment verification failed. Contact support.');
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async (response) => {
        try {
          await paymentAPI.paymentFailed({
            orderId: response.error.metadata?.order_id || orderId,
            error: response.error.description,
          });
        } catch (e) { /* ignore */ }
        setStep('failed');
        toast.error('Payment failed: ' + (response.error.description || 'Unknown error'));
      });

      rzp.open();
      setStep('form'); // Reset to form while Razorpay modal is open (it overlays the page)
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(typeof err === 'string' ? err : 'Payment initiation failed');
      setStep('form');
    }
  };

  const handleClose = () => {
    if (step === 'processing') return; // Don't close while loading
    setStep('form');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {step !== 'processing' && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* SUCCESS STATE */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-accent-green/10 border border-accent-green/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-accent-green" />
                </div>
                <div className="absolute inset-0 w-20 h-20 rounded-full mx-auto shadow-[0_0_40px_rgba(0,186,124,0.3)]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
              <p className="text-dark-300 mb-6">
                Your trip has been booked successfully. A confirmation email has been sent.
              </p>
              {bookingResult && (
                <div className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-left mb-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-dark-400 text-sm">Booking ID</span>
                    <span className="text-white text-sm font-mono">{bookingResult.bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400 text-sm">Payment ID</span>
                    <span className="text-accent-blue text-sm font-mono truncate max-w-[180px]">{bookingResult.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400 text-sm">Amount Paid</span>
                    <span className="text-accent-green text-sm font-semibold">₹{bookingResult.amount?.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <button onClick={handleClose} className="btn-primary w-full">
                Done
              </button>
            </div>
          )}

          {/* FAILED STATE */}
          {step === 'failed' && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-dark-300 mb-6">
                Something went wrong with your payment. You have not been charged.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStep('form')} className="btn-primary flex-1">
                  Try Again
                </button>
                <button onClick={handleClose} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* FORM / PROCESSING STATE */}
          {(step === 'form' || step === 'processing') && (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-dark-700">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-accent-blue" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Complete Booking</h2>
                </div>
                <p className="text-dark-400 text-sm ml-11">Secure payment powered by Razorpay</p>
              </div>

              {/* Trip summary */}
              <div className="px-6 py-4 bg-dark-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wide mb-0.5">Trip</p>
                    <p className="text-white font-semibold">
                      {tripMeta?.source} <span className="text-dark-500">→</span> {tripMeta?.destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-400 uppercase tracking-wide mb-0.5">Total</p>
                    <p className="text-2xl font-bold text-accent-green flex items-center gap-0.5">
                      <IndianRupee className="w-5 h-5" />{amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact form */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm font-medium text-dark-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-blue" /> Contact Details
                </p>

                {/* Name */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      disabled={step === 'processing'}
                      className={`w-full bg-dark-900 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-500 outline-none focus:border-accent-blue transition-colors disabled:opacity-50 ${errors.name ? 'border-red-500' : 'border-dark-600'}`}
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      disabled={step === 'processing'}
                      className={`w-full bg-dark-900 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-500 outline-none focus:border-accent-blue transition-colors disabled:opacity-50 ${errors.email ? 'border-red-500' : 'border-dark-600'}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1.5 uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      disabled={step === 'processing'}
                      className={`w-full bg-dark-900 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-500 outline-none focus:border-accent-blue transition-colors disabled:opacity-50 ${errors.phone ? 'border-red-500' : 'border-dark-600'}`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 space-y-3">
                <button
                  onClick={handlePay}
                  disabled={step === 'processing'}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60"
                >
                  {step === 'processing' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating order...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-5 h-5" />
                      Pay ₹{amount?.toLocaleString()} Securely
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-dark-500">
                  <Shield className="w-3.5 h-3.5" />
                  256-bit SSL encrypted · Powered by Razorpay
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
