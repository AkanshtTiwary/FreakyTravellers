'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import useAuthStore from '@/store/authStore';
import { paymentAPI } from '@/utils/api';
import {
  Loader2, MapPin, CheckCircle2, Clock, XCircle,
  IndianRupee, Calendar, ArrowRight, CreditCard, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', color: 'text-accent-green', bg: 'bg-accent-green/10 border-accent-green/30', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'text-accent-yellow', bg: 'bg-accent-yellow/10 border-accent-yellow/30', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
  completed: { label: 'Completed', color: 'text-accent-blue', bg: 'bg-accent-blue/10 border-accent-blue/30', icon: CheckCircle2 },
};

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await paymentAPI.getMyBookings({ page: 1, limit: 20 });
      if (res.success) {
        setBookings(res.data.bookings || []);
        setPagination(res.data.pagination || null);
      }
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await paymentAPI.cancelBooking(bookingId, 'User requested cancellation');
      if (res.success) {
        toast.success('Booking cancelled successfully. Refund will be processed in 5-7 business days.');
        fetchBookings();
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to cancel booking');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-full mb-4">
              <CreditCard className="w-3.5 h-3.5 text-accent-blue" />
              <span className="text-xs text-dark-300">Payment History</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">My Bookings</h1>
            <p className="text-dark-400">All your trip bookings and payment history</p>
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && bookings.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass text-center py-16"
            >
              <div className="w-16 h-16 bg-dark-700 border border-dark-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-dark-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No bookings yet</h3>
              <p className="text-dark-400 mb-6">Plan a trip and complete a booking to see it here.</p>
              <button onClick={() => router.push('/')} className="btn-primary">
                Plan a Trip
              </button>
            </motion.div>
          )}

          {/* Booking list */}
          {!isLoading && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking, i) => {
                const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;

                return (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-glass"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-accent-blue" />
                          <span className="text-white font-semibold">
                            {booking.travelDetails?.source}
                            <span className="text-dark-500 mx-2">→</span>
                            {booking.travelDetails?.destination}
                          </span>
                        </div>
                        <p className="text-xs text-dark-500 font-mono ml-6">
                          Booking ID: {booking.bookingId}
                        </p>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Details row */}
                    <div className="flex flex-wrap gap-4 py-3 border-t border-b border-dark-700 mb-4">
                      <div>
                        <p className="text-xs text-dark-500 uppercase tracking-wide mb-0.5">Amount Paid</p>
                        <p className="text-accent-green font-bold flex items-center gap-0.5">
                          <IndianRupee className="w-4 h-4" />
                          {booking.payment?.amount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500 uppercase tracking-wide mb-0.5">Booked On</p>
                        <p className="text-dark-200 text-sm flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-dark-500" />
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      {booking.payment?.razorpayPaymentId && (
                        <div>
                          <p className="text-xs text-dark-500 uppercase tracking-wide mb-0.5">Payment ID</p>
                          <p className="text-accent-blue text-xs font-mono">{booking.payment.razorpayPaymentId}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/results?tripId=${booking.trip}`)}
                        className="text-xs text-accent-blue hover:text-accent-blue/80 flex items-center gap-1 ml-auto"
                      >
                        View Trip <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination info */}
          {pagination && pagination.total > 0 && (
            <p className="text-center text-dark-500 text-sm mt-6">
              Showing {bookings.length} of {pagination.total} bookings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
