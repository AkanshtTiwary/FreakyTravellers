'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Plane, DollarSign, MapPin, TrendingUp, Sparkles, Clock, Shield, X } from 'lucide-react';
import DestinationCarousel from '@/components/DestinationCarousel';

// Animation variants for performance
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const router = useRouter();
  const [showTier1Modal, setShowTier1Modal] = useState(false);

  useEffect(() => {
    // Check if the modal has been shown before
    const hasShownTier1Modal = localStorage.getItem('tier1ModalShown');
    if (!hasShownTier1Modal) {
      setShowTier1Modal(true);
      localStorage.setItem('tier1ModalShown', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      {/* Hero + Destination Carousel combined */}
      <DestinationCarousel />

      {/* Tier 1 Cities Modal Popup */}
      {showTier1Modal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTier1Modal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="card-glass max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowTier1Modal(false)}
              className="absolute top-4 right-4 text-dark-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="text-5xl mb-4">ℹ️</div>
              <h2 className="text-2xl font-bold text-white mb-4">Service Availability</h2>
              <p className="text-dark-200 mb-6 leading-relaxed">
                Due to lack of localized data, we are currently available for <span className="font-bold text-accent-blue">Tier 1 cities</span> only.
              </p>
              <p className="text-dark-300 text-sm mb-6">
                We're expanding to more cities soon! Stay tuned.
              </p>
              <button
                onClick={() => setShowTier1Modal(false)}
                className="w-full bg-gradient-accent hover:shadow-[0_0_30px_rgba(29,155,240,0.4)] text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                Got It!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Tier 1 Cities Info Section */}
      <section className="py-8 px-4 bg-gradient-to-r from-dark-700 via-dark-800 to-dark-700 border-y border-dark-600">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-4 flex-wrap text-center"
          >
            <div className="text-3xl">ℹ️</div>
            <div>
              <p className="text-dark-200">
                <span className="font-semibold text-white">Service Coverage:</span> Currently available for <span className="font-bold text-accent-blue">Tier 1 cities</span> • More cities coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16 text-white"
          >
            Why Choose FreakyTravellers?
          </motion.h2>
          
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <FeatureCard
              icon={<DollarSign className="w-10 h-10" />}
              title="Budget Optimization"
              description="Smart allocation: 40% hotels, 30% food, 30% local transport"
              color="green"
            />
            <FeatureCard
              icon={<Plane className="w-10 h-10" />}
              title="Cheapest Transport"
              description="Automatically finds the most affordable bus, train, or flight"
              color="blue"
            />
            <FeatureCard
              icon={<MapPin className="w-10 h-10" />}
              title="Smart Suggestions"
              description="Alternative destinations if budget is too low"
              color="red"
            />
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10" />}
              title="Never Rejects"
              description="Always provides an optimized plan or alternative"
              color="purple"
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16 text-white"
          >
            How It Works
          </motion.h2>
          
          <div className="space-y-8">
            <HowItWorksStep
              number="1"
              title="Enter Travel Details"
              description="Provide source city, destination city, and your total budget"
              icon={<MapPin className="w-6 h-6" />}
            />
            <HowItWorksStep
              number="2"
              title="AI Optimization"
              description="Our algorithm finds cheapest transport and allocates remaining budget"
              icon={<Sparkles className="w-6 h-6" />}
            />
            <HowItWorksStep
              number="3"
              title="Get Personalized Plan"
              description="Receive detailed breakdown with transport, hotels, restaurants, and local transport"
              icon={<Clock className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-dark-400 text-sm">
          <p>© 2026 FreakyTravellers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Memoized feature card
function FeatureCard({ icon, title, description, color }) {
  const colors = {
    green: 'text-accent-green hover:shadow-[0_0_30px_rgba(0,186,124,0.15)]',
    blue: 'text-accent-blue hover:shadow-[0_0_30px_rgba(29,155,240,0.15)]',
    red: 'text-accent-red hover:shadow-[0_0_30px_rgba(249,24,128,0.15)]',
    purple: 'text-accent-purple hover:shadow-[0_0_30px_rgba(120,86,255,0.15)]',
  };

  return (
    <motion.div
      variants={fadeInUp}
      className={`card-glass group cursor-pointer transition-all duration-300 ${colors[color]}`}
      whileHover={{ y: -5 }}
    >
      <div className={`mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-dark-300 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function HowItWorksStep({ number, title, description, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex items-start gap-6 p-6 card-glass"
    >
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold text-xl">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-accent-blue">{icon}</div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-dark-300 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

