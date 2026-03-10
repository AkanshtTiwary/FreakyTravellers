'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI } from '@/utils/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [step, setStep] = useState(1); // 1: Signup, 2: OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await authAPI.googleAuth(credentialResponse.credential);
      console.log('Google signup response:', response);
      
      if (response.success) {
        console.log('Logging in Google user:', response.data.user);
        login(response.data.user, response.data.token);
        toast.success('Google signup successful!');
        
        setTimeout(() => {
          console.log('Redirecting to home...');
          router.push('/');
        }, 100);
      }
    } catch (error) {
      console.error('Google signup error:', error);
      toast.error(error || 'Google signup failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google signup failed. Please try again.');
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Check password pattern
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordPattern.test(formData.password)) {
      toast.error('Password must contain uppercase, lowercase, and number');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);
      
      if (response.success) {
        toast.success('Account created! Please verify your email with OTP.');
        setTempToken(response.data.token);
        setStep(2); // Move to OTP verification
      }
    } catch (error) {
      toast.error(error || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.verifyOTP({
        email: formData.email,
        otp,
      });
      console.log('OTP verification response:', response);
      
      if (response.success) {
        toast.success('Email verified successfully!');
        console.log('Logging in user after OTP:', response.data.user);
        console.log('Token:', response.data.token);
        // Login user with the token from verification response
        login(response.data.user, response.data.token);
        
        setTimeout(() => {
          console.log('Redirecting to home...');
          router.push('/');
        }, 100);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.sendOTP(formData.email);
      toast.success('OTP resent to your email');
    } catch (error) {
      toast.error(error || 'Failed to resend OTP');
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="card">
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
              <p className="text-gray-600">
                We've sent a 6-digit OTP to<br />
                <strong>{formData.email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="label text-dark-200">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className="input-field text-center text-2xl tracking-widest"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card-glass">
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-clip-text text-transparent mb-2"
            >
              Create Account
            </motion.h1>
            <p className="text-dark-300">Join FreakyTravellers today!</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Name */}
            <div>
              <label className="label text-dark-200">
                <User className="w-4 h-4 inline mr-2 text-accent-purple" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input-field"
                required
              />
            </div>

            {/* Email */}
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

            {/* Phone */}
            <div>
              <label className="label text-dark-200">
                <Phone className="w-4 h-4 inline mr-2 text-accent-green" />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength="10"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label text-dark-200">
                <Lock className="w-4 h-4 inline mr-2 text-accent-yellow" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-dark-400 mt-1">
                Must be 6+ characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label text-dark-200">
                <Lock className="w-4 h-4 inline mr-2 text-accent-yellow" />
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="input-field"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-900 text-dark-400">OR</span>
            </div>
          </div>

          {/* Google Signup */}
          <div className="mb-6 p-1 rounded-xl bg-gradient-to-r from-accent-blue/20 to-accent-purple/20">
            <div className="bg-dark-800 rounded-lg p-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                text="signup_with"
                shape="rectangular"
              />
            </div>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-dark-300">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-blue hover:text-accent-blue/80 font-semibold transition-colors">
              Sign in
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
