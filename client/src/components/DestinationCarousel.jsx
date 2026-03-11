'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const destinations = [
  {
    name: 'Taj Mahal',
    location: 'Agra, India',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80',
    tag: 'Heritage',
    color: '#f97316',
  },
  {
    name: 'Goa Beaches',
    location: 'Goa, India',
    image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=600&q=80',
    tag: 'Beach',
    color: '#06b6d4',
  },
  {
    name: 'Kerala Backwaters',
    location: 'Kerala, India',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',
    tag: 'Nature',
    color: '#22c55e',
  },
  {
    name: 'Jaipur Palace',
    location: 'Jaipur, India',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80',
    tag: 'Royalty',
    color: '#e879f9',
  },
  {
    name: 'Manali Peaks',
    location: 'Himachal Pradesh, India',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80',
    tag: 'Adventure',
    color: '#818cf8',
  },
  {
    name: 'Varanasi Ghats',
    location: 'Uttar Pradesh, India',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=600&q=80',
    tag: 'Spiritual',
    color: '#fb923c',
  },
  {
    name: 'Santorini',
    location: 'Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
    tag: 'International',
    color: '#38bdf8',
  },
  {
    name: 'Bali Temples',
    location: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
    tag: 'Culture',
    color: '#4ade80',
  },
];

// How many cards to show at once
const VISIBLE = 4;
const INTERVAL = 3000;

export default function DestinationCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % destinations.length);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + destinations.length) % destinations.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  // Get the 4 visible destinations starting from activeIndex
  const visibleDestinations = Array.from({ length: VISIBLE }, (_, i) => {
    const index = (activeIndex + i) % destinations.length;
    return { ...destinations[index], originalIndex: index };
  });

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-600 rounded-full mb-4">
            <MapPin className="w-4 h-4 text-accent-blue" />
            <span className="text-sm text-dark-300">Most Visited Places</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">
            Top{' '}
            <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
              Destinations
            </span>
          </h2>
          <p className="text-dark-400 text-lg">
            Explore the world's most iconic travel spots
          </p>
        </motion.div>

        {/* Carousel grid */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {visibleDestinations.map((dest, i) => (
                <motion.div
                  key={`${dest.originalIndex}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -30 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  whileHover={{ scale: 1.04, y: -8 }}
                  className="relative cursor-pointer group"
                  style={{ borderRadius: '16px', overflow: 'hidden' }}
                >
                  {/* Square aspect ratio */}
                  <div className="aspect-square relative overflow-hidden rounded-2xl">
                    {/* Image */}
                    <motion.img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.6 }}
                      loading="lazy"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Animated shimmer border on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${dest.color}33, transparent 60%)`,
                        border: `1.5px solid ${dest.color}66`,
                      }}
                    />

                    {/* Tag badge */}
                    <div
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
                      style={{ background: `${dest.color}cc` }}
                    >
                      {dest.tag}
                    </div>

                    {/* Active indicator dot */}
                    {i === 0 && (
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    )}

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <motion.h3
                        className="text-white font-bold text-lg leading-tight mb-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 + 0.2 }}
                      >
                        {dest.name}
                      </motion.h3>
                      <motion.div
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 + 0.3 }}
                      >
                        <MapPin
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: dest.color }}
                        />
                        <span className="text-dark-200 text-sm">{dest.location}</span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Prev / Next buttons */}
          <button
            onClick={prev}
            className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-800 border border-dark-600 text-white flex items-center justify-center hover:bg-dark-700 hover:border-accent-blue transition-all duration-200 z-20 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-800 border border-dark-600 text-white flex items-center justify-center hover:bg-dark-700 hover:border-accent-blue transition-all duration-200 z-20 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {destinations.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="transition-all duration-300"
            >
              <div
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-6 h-2 bg-accent-blue'
                    : 'w-2 h-2 bg-dark-600 hover:bg-dark-400'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Auto-play progress bar */}
        {!isPaused && (
          <div className="mt-4 max-w-xs mx-auto h-0.5 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              key={activeIndex}
              transition={{ duration: INTERVAL / 1000, ease: 'linear' }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
