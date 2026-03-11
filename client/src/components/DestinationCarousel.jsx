'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import SearchForm from '@/components/SearchForm';

const destinations = [
  {
    name: 'Taj Mahal',
    location: 'Agra, India',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=90',
    tag: 'Heritage',
    color: '#f97316',
  },
  {
    name: 'Santorini',
    location: 'Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=90',
    tag: 'International',
    color: '#38bdf8',
  },
  {
    name: 'Kerala Backwaters',
    location: 'Kerala, India',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=90',
    tag: 'Nature',
    color: '#22c55e',
  },
  {
    name: 'Bali Temples',
    location: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=90',
    tag: 'Culture',
    color: '#4ade80',
  },
  {
    name: 'Jaipur Palace',
    location: 'Jaipur, India',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1600&q=90',
    tag: 'Royalty',
    color: '#e879f9',
  },
  {
    name: 'Machu Picchu',
    location: 'Peru',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1600&q=90',
    tag: 'Ancient',
    color: '#84cc16',
  },
  {
    name: 'Manali Peaks',
    location: 'Himachal Pradesh, India',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=90',
    tag: 'Adventure',
    color: '#818cf8',
  },
  {
    name: 'Amalfi Coast',
    location: 'Italy',
    image: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=1600&q=90',
    tag: 'Scenic',
    color: '#f59e0b',
  },
  {
    name: 'Varanasi Ghats',
    location: 'Uttar Pradesh, India',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=1600&q=90',
    tag: 'Spiritual',
    color: '#fb923c',
  },
  {
    name: 'Kyoto Temples',
    location: 'Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=90',
    tag: 'Culture',
    color: '#f43f5e',
  },
  {
    name: 'Goa Beaches',
    location: 'Goa, India',
    image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=1600&q=90',
    tag: 'Beach',
    color: '#06b6d4',
  },
  {
    name: 'Northern Lights',
    location: 'Iceland',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=90',
    tag: 'Wonder',
    color: '#a78bfa',
  },
  {
    name: 'Leh Ladakh',
    location: 'Jammu & Kashmir, India',
    image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1600&q=90',
    tag: 'Mountain',
    color: '#60a5fa',
  },
  {
    name: 'Petra',
    location: 'Jordan',
    image: 'https://images.unsplash.com/photo-1579606032821-4e6161c81bd3?w=1600&q=90',
    tag: 'Ancient',
    color: '#fbbf24',
  },
  {
    name: 'Maldives',
    location: 'South Asia',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=90',
    tag: 'Paradise',
    color: '#22d3ee',
  },
  {
    name: 'Coorg Hills',
    location: 'Karnataka, India',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1600&q=90',
    tag: 'Nature',
    color: '#34d399',
  },
  {
    name: 'Colosseum',
    location: 'Rome, Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=90',
    tag: 'Heritage',
    color: '#f97316',
  },
  {
    name: 'Darjeeling',
    location: 'West Bengal, India',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=90',
    tag: 'Hills',
    color: '#86efac',
  },
  {
    name: 'Dubai Skyline',
    location: 'UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=90',
    tag: 'Urban',
    color: '#fde68a',
  },
  {
    name: 'Rann of Kutch',
    location: 'Gujarat, India',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=90',
    tag: 'Desert',
    color: '#fca5a5',
  },
  {
    name: 'Banff National Park',
    location: 'Canada',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=90',
    tag: 'Wilderness',
    color: '#6ee7b7',
  },
  {
    name: 'Hampi Ruins',
    location: 'Karnataka, India',
    image: 'https://images.unsplash.com/photo-1590766940554-b8e86f0ead37?w=1600&q=90',
    tag: 'Heritage',
    color: '#fcd34d',
  },
  {
    name: 'Patagonia',
    location: 'Argentina & Chile',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=90',
    tag: 'Wild',
    color: '#93c5fd',
  },
  {
    name: 'Spiti Valley',
    location: 'Himachal Pradesh, India',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=90',
    tag: 'Remote',
    color: '#c4b5fd',
  },
  {
    name: 'Great Barrier Reef',
    location: 'Australia',
    image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1600&q=90',
    tag: 'Marine',
    color: '#2dd4bf',
  },
];

const INTERVAL = 5000;

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

  const current = destinations[activeIndex];

  // Show 7 thumbnails centered around activeIndex
  const THUMB_WINDOW = 7;
  const half = Math.floor(THUMB_WINDOW / 2);
  const thumbIndices = Array.from({ length: THUMB_WINDOW }, (_, i) => {
    return (activeIndex - half + i + destinations.length) % destinations.length;
  });

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Full-screen background images ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={current.image}
            alt={current.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Layered overlays ── */}
      {/* Dark vignette from top for navbar readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
      {/* Colour tint matching destination */}
      <motion.div
        key={`tint-${activeIndex}`}
        className="absolute inset-0 z-10 transition-all duration-1000"
        style={{ background: `${current.color}18` }}
      />

      {/* ── Foreground content ── */}
      <div className="relative z-20 flex flex-col min-h-screen">

        {/* Spacer for navbar */}
        <div className="h-20" />

        {/* Hero text */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.12 } },
            }}
            className="text-center mb-10"
          >
            <motion.div
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent-blue" />
              <span className="text-sm text-white/80">AI-Powered Travel Optimization</span>
            </motion.div>

            <motion.h1
              variants={{ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } }}
              className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl"
            >
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                FreakyTravellers
              </span>
            </motion.h1>

            <motion.p
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
              className="text-xl md:text-2xl text-white/80 mb-2 max-w-3xl mx-auto drop-shadow"
            >
              Plan Your Perfect Trip Within Budget
            </motion.p>

            <motion.p
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
              className="text-base text-white/60 max-w-2xl mx-auto"
            >
              Cheapest transport · Best hotels · Top restaurants — all optimized for your budget
            </motion.p>
          </motion.div>

          {/* Search form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full max-w-5xl"
          >
            <SearchForm />
          </motion.div>
        </div>

        {/* ── Bottom destination strip ── */}
        <div className="pb-6 px-4">
          {/* Current destination name pill */}
          <div className="flex items-center justify-center mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-full border border-white/20"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
                  style={{ background: current.color }}
                />
                <span className="text-white font-semibold text-lg">{current.name}</span>
                <span className="text-white/40">·</span>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: current.color }} />
                <span className="text-white/70 text-sm">{current.location}</span>
                <span
                  className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ background: `${current.color}99` }}
                >
                  {current.tag}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnail strip */}
          <div className="flex items-center justify-center gap-2">
            {/* Prev */}
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Thumbnails — sliding window of 7 */}
            <div className="flex gap-2">
              {thumbIndices.map((destIdx, i) => {
                const dest = destinations[destIdx];
                const isActive = destIdx === activeIndex;
                return (
                  <button
                    key={destIdx}
                    onClick={() => setActiveIndex(destIdx)}
                    className="relative overflow-hidden transition-all duration-300 flex-shrink-0"
                    style={{
                      width: isActive ? '56px' : '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: isActive ? `2px solid ${dest.color}` : '2px solid transparent',
                      boxShadow: isActive ? `0 0 12px ${dest.color}88` : 'none',
                      opacity: Math.abs(i - Math.floor(THUMB_WINDOW / 2)) === 3 ? 0.4 : 1,
                    }}
                  >
                    <img
                      src={dest.image.replace('w=1600', 'w=120')}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                    />
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/50" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={next}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Counter + progress bar */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <span className="text-white/40 text-xs tabular-nums">
              {activeIndex + 1} / {destinations.length}
            </span>
            {!isPaused && (
              <div className="max-w-xs w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: current.color }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  key={activeIndex}
                  transition={{ duration: INTERVAL / 1000, ease: 'linear' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
