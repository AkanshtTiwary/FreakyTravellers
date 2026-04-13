'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronLeft, ChevronRight, Sparkles, Search, Loader2, Users, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { tripAPI } from '@/utils/api';
import useTripStore from '@/store/tripStore';
import toast from 'react-hot-toast';

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
  const router = useRouter();
  const { setTripResult, setLoading } = useTripStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef(null);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    totalBudget: '',
    numberOfTravelers: 1,
    numberOfDays: 3,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        router.push(`/results?tripId=${response.data.tripId}`);
      } else {
        // Handle non-success response from API
        if (response.type === 'international_destination' || response.type === 'international_source') {
          toast.error(response.message, {
            duration: 4000,
            icon: '🇮🇳',
          });
        } else {
          toast.error(response.message || 'Failed to optimize trip');
        }
      }
    } catch (error) {
      // Error object now contains the full response data from API
      const errorMessage = error?.message || 'Failed to optimize trip. Please try again.';
      const errorType = error?.type;
      
      // Show special message for India-only service
      if (errorType === 'international_destination' || errorType === 'international_source' || 
          errorMessage.includes('currently available in India')) {
        toast.error(errorMessage, {
          duration: 4000,
          icon: '🇮🇳',
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % destinations.length);
    }, INTERVAL);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % destinations.length);
    startTimer();
  }, [startTimer]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + destinations.length) % destinations.length);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

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

          {/* ── Inline search strip (Airbnb-style) ── */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 }}
            className="w-full max-w-5xl"
          >
            {/* Single pill bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 bg-black/60 backdrop-blur-2xl border border-white/30 rounded-2xl sm:rounded-full shadow-2xl shadow-black/40 px-2 py-2 sm:py-1.5">

              {/* From */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2 sm:border-r border-white/25">
                <MapPin className="w-4 h-4 text-accent-blue flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-white/75 text-[10px] font-semibold uppercase tracking-widest leading-none mb-1">From</span>
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    placeholder="Origin city"
                    className="bg-transparent text-white placeholder-white/55 text-sm font-medium outline-none w-full"
                    required
                  />
                </div>
              </div>

              {/* Arrow divider */}
              <div className="hidden sm:flex items-center justify-center px-1">
                <ArrowRight className="w-3.5 h-3.5 text-white/50" />
              </div>

              {/* To */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2 sm:border-r border-white/25">
                <MapPin className="w-4 h-4 text-accent-purple flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-white/75 text-[10px] font-semibold uppercase tracking-widest leading-none mb-1">To</span>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="Destination"
                    className="bg-transparent text-white placeholder-white/55 text-sm font-medium outline-none w-full"
                    required
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-2.5 w-full sm:w-36 px-4 py-2 sm:border-r border-white/25">
                <DollarSign className="w-4 h-4 text-accent-green flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-white/75 text-[10px] font-semibold uppercase tracking-widest leading-none mb-1">Budget ₹</span>
                  <input
                    type="number"
                    name="totalBudget"
                    value={formData.totalBudget}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    min="500"
                    className="bg-transparent text-white placeholder-white/55 text-sm font-medium outline-none w-full"
                    required
                  />
                </div>
              </div>

              {/* Travelers */}
              <div className="flex items-center gap-2.5 w-full sm:w-28 px-4 py-2 sm:border-r border-white/25">
                <Users className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-white/75 text-[10px] font-semibold uppercase tracking-widest leading-none mb-1">Travelers</span>
                  <input
                    type="number"
                    name="numberOfTravelers"
                    value={formData.numberOfTravelers}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="bg-transparent text-white placeholder-white/55 text-sm font-medium outline-none w-full"
                  />
                </div>
              </div>

              {/* Days */}
              <div className="flex items-center gap-2.5 w-full sm:w-24 px-4 py-2">
                <Calendar className="w-4 h-4 text-accent-blue flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-white/75 text-[10px] font-semibold uppercase tracking-widest leading-none mb-1">Days</span>
                  <input
                    type="number"
                    name="numberOfDays"
                    value={formData.numberOfDays}
                    onChange={handleChange}
                    min="1"
                    max="30"
                    className="bg-transparent text-white placeholder-white/55 text-sm font-medium outline-none w-full"
                    required
                  />
                </div>
              </div>

              {/* Search button */}
              <motion.button
                type="submit"
                disabled={isSearching}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-accent-blue hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl sm:rounded-full transition-colors duration-200 shadow-lg shadow-blue-500/30"
              >
                {isSearching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Finding...</span></>
                ) : (
                  <><Search className="w-4 h-4" /><span>Search</span></>
                )}
              </motion.button>
            </div>

            {/* Subtle hint */}
            <p className="text-center text-white/60 text-xs mt-3 tracking-wide">
              <Sparkles className="inline w-3 h-3 mr-1 text-accent-blue" />
              AI picks the cheapest transport &amp; splits your budget across hotels, food &amp; activities
            </p>
          </motion.form>
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
                    onClick={() => { setActiveIndex(destIdx); startTimer(); }}
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
          </div>
        </div>
      </div>
    </section>
  );
}
