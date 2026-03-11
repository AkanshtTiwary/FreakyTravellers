'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchForm from '@/components/SearchForm';
import { motion } from 'framer-motion';
import { Plane, DollarSign, MapPin, TrendingUp, Sparkles, Clock, Shield } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent-blue/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-600 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent-blue" />
              <span className="text-sm text-dark-300">AI-Powered Travel Optimization</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="text-gradient">FreakyTravellers</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-dark-300 mb-4 max-w-3xl mx-auto"
            >
              Plan Your Perfect Trip Within Budget
            </motion.p>
            
            <motion.p
              variants={fadeInUp}
              className="text-lg text-dark-400 max-w-2xl mx-auto"
            >
              Enter your source, destination, and budget. We'll find the cheapest transport, 
              best hotels, and recommend restaurants - all optimized for your budget!
            </motion.p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity:0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <SearchForm />
          </motion.div>
        </div>
      </section>

      {/* Destination Carousel */}
      <DestinationCarousel />

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

