'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/utils/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (!formData.otp.trim()) {
      toast.error('OTP is required');
      return false;
    }
    if (formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
      toast.error('OTP must be a 6-digit number');
      return false;
    }
    if (!formData.newPassword) {
      toast.error('New password is required');
      return false;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        setIsSubmitted(true);
        toast.success('Password reset successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      toast.error(error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card-glass">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-clip-text text-transparent mb-2"
                >
                  Reset Password
                </motion.h1>
                <p className="text-dark-300">
                  Enter the OTP sent to your email and create a new password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="label text-dark-200">
                    <Mail className="w-4 h-4 inline mr-2 text-accent-blue" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                  />
                </div>

                {/* OTP Field */}
                <div>
                  <label className="label text-dark-200">
                    <Lock className="w-4 h-4 inline mr-2 text-accent-blue" />
                    OTP Code
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.slice(0, 6) })}
                    placeholder="000000"
                    className="input-field font-mono tracking-widest text-center"
                    maxLength="6"
                    required
                  />
                  <p className="text-xs text-dark-400 mt-1">6-digit code from your email</p>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="label text-dark-200">
                    <Lock className="w-4 h-4 inline mr-2 text-accent-blue" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-dark-400 hover:text-accent-blue transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">Minimum 6 characters</p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="label text-dark-200">
                    <Lock className="w-4 h-4 inline mr-2 text-accent-blue" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-dark-400 hover:text-accent-blue transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
              <p className="text-dark-300 mb-6">
                Your password has been reset. Redirecting to login...
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-primary w-full"
              >
                Go to Login
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-dark-300 hover:text-accent-blue transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
