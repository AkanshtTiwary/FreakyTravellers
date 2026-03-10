'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { User, Mail, Calendar, Shield, Camera, ChevronRight, MapPin, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authAPI from '@/utils/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement profile update API endpoint
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <p className="text-dark-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Floating blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {/* Profile Header */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="card-glass overflow-hidden mb-6"
          >
            <div className="bg-gradient-to-r from-accent-blue/30 to-accent-purple/30 h-32 relative">
              <div className="absolute inset-0 backdrop-blur-sm"></div>
            </div>
            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6">
                <div className="flex items-end space-x-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    {user.picture ? (
                      <motion.img
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        src={user.picture}
                        alt={user.name}
                        className="w-32 h-32 rounded-full border-4 border-dark-800 object-cover shadow-glow-blue"
                      />
                    ) : (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="w-32 h-32 rounded-full border-4 border-dark-800 bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-glow-blue"
                      >
                        <User className="w-16 h-16 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 pt-4">
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl font-bold text-dark-100 mb-2"
                    >
                      {user.name}
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-dark-300 flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4 text-accent-blue" />
                      <span>{user.email}</span>
                    </motion.p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Account Information */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-glass p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-100">Account Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-accent-blue hover:text-accent-blue/80 font-medium text-sm transition-colors flex items-center space-x-1 group"
                >
                  <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {isEditing ? (
                <motion.form 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleUpdateProfile} 
                  className="space-y-4"
                >
                  <div>
                    <label className="label text-dark-200">
                      <User className="w-4 h-4 inline mr-2 text-accent-purple" />
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      disabled={user.authProvider === 'google'}
                    />
                    {user.authProvider === 'google' && (
                      <p className="text-xs text-dark-400 mt-1">
                        Google account name cannot be changed here
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label text-dark-200">
                      <Mail className="w-4 h-4 inline mr-2 text-accent-blue" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field"
                      disabled
                    />
                    <p className="text-xs text-dark-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={user.authProvider === 'google'}
                  >
                    Save Changes
                  </button>
                </motion.form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-accent-purple mt-1" />
                    <div>
                      <p className="text-sm text-dark-400">Full Name</p>
                      <p className="font-medium text-dark-100">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-accent-blue mt-1" />
                    <div>
                      <p className="text-sm text-dark-400">Email Address</p>
                      <p className="font-medium text-dark-100">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-accent-green mt-1" />
                    <div>
                      <p className="text-sm text-dark-400">Member Since</p>
                      <p className="font-medium text-dark-100">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-accent-yellow mt-1" />
                    <div>
                      <p className="text-sm text-dark-400">Account Type</p>
                      <p className="font-medium text-dark-100 capitalize">
                        {user.authProvider === 'google' ? 'Google Account' : 'Local Account'}
                      </p>
                    </div>
                  </div>

                  {user.emailVerified && (
                    <div className="flex items-center space-x-2 pt-2">
                      <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                      <span className="text-sm text-accent-green font-medium">
                        Email Verified
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Security & Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-glass p-6"
            >
              <h2 className="text-xl font-bold text-dark-100 mb-6">Security & Settings</h2>
              
              <div className="space-y-4">
                {user.authProvider !== 'google' && (
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-all group">
                    <span className="text-dark-200">Change Password</span>
                    <ChevronRight className="w-5 h-5 text-dark-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <button className="w-full flex items-center justify-between px-4 py-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-all group">
                  <span className="text-dark-200">Privacy Settings</span>
                  <ChevronRight className="w-5 h-5 text-dark-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-all group">
                  <span className="text-dark-200">Notification Preferences</span>
                  <ChevronRight className="w-5 h-5 text-dark-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="pt-4 border-t border-dark-700">
                  <button className="w-full px-4 py-3 bg-accent-red/10 text-accent-red rounded-lg hover:bg-accent-red/20 transition-all group flex items-center justify-center space-x-2">
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* My Trips Section - Placeholder */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-glass p-6 mt-6"
          >
            <h2 className="text-xl font-bold text-dark-100 mb-4">My Trips</h2>
            <div className="text-center py-12">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-accent-blue/10 rounded-full mb-4"
              >
                <MapPin className="w-8 h-8 text-accent-blue" />
              </motion.div>
              <h3 className="text-lg font-medium text-dark-100 mb-2">No trips yet</h3>
              <p className="text-dark-300 mb-4">Start planning your next adventure!</p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Plan a Trip</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
