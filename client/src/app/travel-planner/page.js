'use client';

/**
 * Travel Planner Page
 * Budget-Adaptive Travel Intelligence System — main page
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import TravelPlannerForm  from '@/components/travel/TravelPlannerForm';
import TravelPlanResult   from '@/components/travel/TravelPlanResult';
import MinimumFarePanel   from '@/components/travel/MinimumFarePanel';
import useTravelPlanStore from '@/store/travelPlanStore';

export default function TravelPlannerPage() {
  const { currentPlan, isLoading } = useTravelPlanStore();
  const [activePlanData, setActivePlanData] = useState(null);
  const [isMinFareMode, setIsMinFareMode] = useState(false);

  const handlePlanGenerated = (data, minFare = false) => {
    setActivePlanData(data);
    setIsMinFareMode(minFare);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('plan-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
          >
            Budget-Adaptive<br />
            <span className="text-indigo-200">Travel Planner</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-indigo-200 text-lg"
          >
            Any budget. Any destination. We always find you a plan. ✈️
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 -mt-8 pb-20">
        {/* Form */}
        <TravelPlannerForm onPlanGenerated={handlePlanGenerated} />

        {/* Loading skeleton */}
        <AnimatePresence>
          {isLoading && !activePlanData && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-4"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {activePlanData && (
            <motion.div
              id="plan-result"
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <TravelPlanResult
                planData={activePlanData}
                isMinimumFareMode={isMinFareMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
