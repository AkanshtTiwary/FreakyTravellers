'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, KeyRound, Send, CheckCircle } from 'lucide-react';
import { authAPI } from '@/utils/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function OTPLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.sendOTP(email);
      
      if (response.success) {
        setOtpSent(true);
        setStep(2);
        toast.success(`OTP sent to ${email}!`);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.loginWithOTP({ email, otp });
      console.log('OTP login response:', response);
      
      if (response.success) {
        console.log('Logging in user:', response.data.user);
        login(response.data.user, response.data.token);
        toast.success('Login successful!');
        
        setTimeout(() => {
          router.push('/');
        }, 100);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.sendOTP(email);
      if (response.success) {
        toast.success('OTP resent successfully!');
      }
    } catch (error) {
      toast.error(error || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep(1);
    setOtp('');
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card-glass">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-accent-green/20 rounded-full mb-4"
            >
              <KeyRound className="w-8 h-8 text-accent-green" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold bg-gradient-to-r from-accent-green via-accent-blue to-accent-green bg-clip-text text-transparent mb-2"
            >
              Login with OTP
            </motion.h1>
            <p className="text-dark-300">Passwordless login via email</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSendOTP}
                className="space-y-6"
              >
                {/* Email Input */}
                <div>
                  <label className="label text-dark-200">
                    <Mail className="w-4 h-4 inline mr-2 text-accent-blue" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    We'll send a 6-digit OTP to your email
                  </p>
                </div>

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                      Send OTP
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                {/* Email Display */}
                <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-accent-green" />
                      <div>
                        <p className="text-xs text-dark-400">OTP sent to:</p>
                        <p className="text-sm font-medium text-dark-100">{email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-xs text-accent-blue hover:text-accent-blue/80 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* OTP Input */}
                <div>
                  <label className="label text-dark-200">
                    <Lock className="w-4 h-4 inline mr-2 text-accent-green" />
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength="6"
                    className="input-field text-center text-2xl tracking-widest"
                    required
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5 mr-2" />
                      Verify & Login
                    </>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-accent-blue hover:text-accent-blue/80 font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-900 text-dark-400">OR</span>
            </div>
          </div>

          {/* Login with Password Link */}
          <Link
            href="/login"
            className="w-full btn-secondary text-center block group"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2 group-hover:-translate-x-1 transition-transform" />
            Login with Password
          </Link>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-dark-300">
            Don't have an account?{' '}
            <Link href="/signup" className="text-accent-blue hover:text-accent-blue/80 font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <Link href="/" className="text-dark-400 hover:text-dark-200 transition-colors group inline-flex items-center">
            <span className="group-hover:-translate-x-1 transition-transform inline-block mr-1">←</span>
            Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
