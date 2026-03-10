'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Loader2, Search, Users, Sparkles, Calendar } from 'lucide-react';
import { tripAPI } from '@/utils/api';
import useTripStore from '@/store/tripStore';
import toast from 'react-hot-toast';

function SearchForm() {
  const router = useRouter();
  const { setTripResult, setLoading } = useTripStore();
  
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    totalBudget: '',
    numberOfTravelers: 1,
    numberOfDays: 3,
  });
  
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.source || !formData.destination || !formData.totalBudget || !formData.numberOfDays) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.totalBudget) < 500) {
      toast.error('Minimum budget must be ₹500');
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      const response = await tripAPI.optimizeTrip(formData);
      
      if (response.success) {
        setTripResult(response.data);
        toast.success('Trip optimized successfully!');
        
        // Navigate to results page
        router.push(`/results?tripId=${response.data.tripId}`);
      } else {
        toast.error(response.message || 'Failed to optimize trip');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error(error || 'Failed to optimize trip. Please try again.');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="card-glass backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-5 h-5 text-accent-blue" />
          <h2 className="text-2xl font-bold text-white text-center">
            Plan Your Budget Trip
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Source City */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-blue" />
              <span>From (Source City)</span>
              <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g., Mumbai"
                className="input-field pl-10 focus:shadow-glow-blue transition-all duration-200"
                required
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
          </div>

          {/* Destination City */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-purple" />
              <span>To (Destination City)</span>
              <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., Goa"
                className="input-field pl-10 focus:shadow-glow-purple transition-all duration-200"
                required
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Budget */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent-green" />
              <span>Total Budget (₹)</span>
              <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="totalBudget"
                value={formData.totalBudget}
                onChange={handleChange}
                placeholder="e.g., 5000"
                min="500"
                className="input-field pl-10"
                required
              />
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
            <p className="text-xs text-dark-400 flex items-center gap-1">
              <span>Minimum: ₹500</span>
            </p>
          </div>

          {/* Number of Travelers */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-yellow" />
              <span>Number of Travelers</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="numberOfTravelers"
                value={formData.numberOfTravelers}
                onChange={handleChange}
                min="1"
                max="10"
                className="input-field pl-10"
              />
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
          </div>

          {/* Number of Days */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-blue" />
              <span>Number of Days</span>
              <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="numberOfDays"
                value={formData.numberOfDays}
                onChange={handleChange}
                min="1"
                max="30"
                className="input-field pl-10 focus:shadow-glow-blue transition-all duration-200"
                required
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
            <p className="text-xs text-dark-400 flex items-center gap-1">
              <span>1 – 30 days</span>
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSearching}
          className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          whileTap={{ scale: 0.98 }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-shimmer opacity-0 group-hover:opacity-100 animate-shimmer"></div>
          
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Optimizing Your Trip...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Find Best Trip Plan</span>
            </>
          )}
        </motion.button>

        {/* Info Text */}
        <div className="mt-6 p-4 bg-dark-700/50 border border-dark-600 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-200 mb-1">
                How it works
              </p>
              <p className="text-sm text-dark-400 leading-relaxed">
                We'll find the cheapest transport and spread your budget across your chosen duration: 
                <span className="text-accent-green font-medium"> 40% for hotels</span>, 
                <span className="text-accent-yellow font-medium"> 30% for food</span>, 
                <span className="text-accent-blue font-medium"> 20% for local transport</span>, and 
                <span className="text-accent-purple font-medium"> 10% for activities</span>. 
                Your number of days drives the per-night and per-day budget calculations!
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default memo(SearchForm);

