'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, Key } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI } from '@/utils/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login(formData);
      console.log('Login response:', response);
      
      if (response.success) {
        console.log('Logging in user:', response.data.user);
        console.log('Token:', response.data.token);
        login(response.data.user, response.data.token);
        toast.success('Login successful!');
        
        // Wait for state to persist before navigating
        setTimeout(() => {
          console.log('Redirecting to home...');
          router.push('/');
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await authAPI.googleAuth(credentialResponse.credential);
      console.log('Google login response:', response);
      
      if (response.success) {
        console.log('Logging in Google user:', response.data.user);
        login(response.data.user, response.data.token);
        toast.success('Google login successful!');
        
        setTimeout(() => {
          console.log('Redirecting to home...');
          router.push('/');
        }, 100);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error || 'Google login failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
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
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-clip-text text-transparent mb-2"
            >
              Welcome Back!
            </motion.h1>
            <p className="text-dark-300">Sign in to your FreakyTravellers account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Password */}
            <div>
              <label className="label text-dark-200">
                <Lock className="w-4 h-4 inline mr-2 text-accent-blue" />
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
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
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

          {/* Google Login */}
          <div className="mb-4 p-1 rounded-xl bg-gradient-to-r from-accent-blue/20 to-accent-purple/20">
            <div className="bg-dark-800 rounded-lg p-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          </div>

          {/* OTP Login */}
          <Link
            href="/login-otp"
            className="w-full btn-secondary text-center block group"
          >
            <Key className="w-4 h-4 inline mr-2 group-hover:rotate-12 transition-transform" />
            Login with OTP
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
