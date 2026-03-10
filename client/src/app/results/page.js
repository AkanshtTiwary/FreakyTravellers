'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { tripAPI } from '@/utils/api';
import useTripStore from '@/store/tripStore';
import Navbar from '@/components/Navbar';
import {
  Loader2, MapPin, DollarSign, Hotel, Utensils,
  Bus, Plane, Train, Star, Clock, Wallet, Camera, AlertCircle,
  ChevronRight, Sparkles, ArrowRight, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';

const UNSPLASH_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

async function getPhoto(query) {
  if (!UNSPLASH_KEY) return null;
  try {
    const res = await fetch(
      'https://api.unsplash.com/search/photos?query=' + encodeURIComponent(query + ' India travel') + '&per_page=1&orientation=landscape',
      { headers: { Authorization: 'Client-ID ' + UNSPLASH_KEY } }
    );
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch { return null; }
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-full mx-auto shadow-glow-blue opacity-50" />
          </div>
          <p className="text-dark-300 text-lg">Building your trip plan...</p>
        </div>
      </div>
    </div>
  );
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get('tripId');
  const { tripResult, setTripResult } = useTripStore();

  const [isLoading, setIsLoading] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [tripMeta, setTripMeta] = useState(null);
  const [heroPhoto, setHeroPhoto] = useState(null);

  useEffect(() => {
    if (tripResult) {
      // API returns: { tripId, optimization: {...}, trip: { source, destination, budget } }
      setOptimization(tripResult.optimization || tripResult);
      setTripMeta(tripResult.trip || null);
    } else if (tripId) {
      loadTrip();
    }
  }, [tripId, tripResult]);

  useEffect(() => {
    if (tripMeta?.destination) {
      getPhoto(tripMeta.destination).then(setHeroPhoto);
    }
  }, [tripMeta]);

  const loadTrip = async () => {
    setIsLoading(true);
    try {
      const response = await tripAPI.getTripById(tripId);
      if (response.success) {
        setOptimization(response.data.optimization || response.data);
        setTripMeta(response.data.trip || null);
        setTripResult(response.data);
      }
    } catch (error) {
      toast.error('Failed to load trip details');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !optimization) {
    return <LoadingSpinner />;
  }

  const {
    transport, accommodation, budgetBreakdown,
    recommendations, duration, optimizationScore, optimizationNotes
  } = optimization;

  const restaurants = recommendations?.restaurants || [];
  const attractions = recommendations?.attractions || [];

  const TransportIcon = ({ mode }) => {
    if (mode === 'flight') return <Plane className="w-5 h-5" />;
    if (mode === 'train') return <Train className="w-5 h-5" />;
    return <Bus className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Background decoration — same as home page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent-green/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Unsplash Hero */}
          {heroPhoto && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="relative w-full h-64 rounded-2xl overflow-hidden mb-8 border border-dark-600">
              <img src={heroPhoto} alt="destination" className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <p className="absolute bottom-3 left-4 text-dark-400 text-xs flex items-center gap-1">
                <Camera className="w-3 h-3" /> Photo via Unsplash
              </p>
            </motion.div>
          )}

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
              <span className="text-xs text-dark-300">Optimized Trip Plan</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {tripMeta ? (
                <><span className="text-gradient">{tripMeta.source}</span> <span className="text-dark-400">→</span> <span className="text-gradient">{tripMeta.destination}</span></>
              ) : 'Your Trip Plan'}
            </h1>
            <div className="flex flex-wrap gap-3">
              {tripMeta?.budget && (
                <span className="flex items-center gap-1.5 text-sm text-dark-300 bg-dark-800 border border-dark-600 px-3 py-1.5 rounded-full">
                  <DollarSign className="w-3.5 h-3.5 text-accent-green" />
                  Budget: Rs.{tripMeta.budget?.toLocaleString()}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1.5 text-sm text-dark-300 bg-dark-800 border border-dark-600 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-accent-blue" />
                  {duration.days} Days / {duration.nights} Nights
                </span>
              )}
              {optimizationScore > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-accent-green bg-dark-800 border border-accent-green/30 px-3 py-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-accent-green" />
                  Score: {optimizationScore}/100
                </span>
              )}
            </div>
          </motion.div>

          {/* Budget Breakdown */}
          {budgetBreakdown && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-glass mb-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-accent-blue" /> Budget Breakdown
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {budgetBreakdown.transport && (
                  <div className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-center">
                    <p className="text-xs text-dark-400 mb-1 uppercase tracking-wide">Transport</p>
                    <p className="text-xl font-bold text-accent-blue">Rs.{budgetBreakdown.transport.allocated?.toLocaleString()}</p>
                  </div>
                )}
                {budgetBreakdown.accommodation && (
                  <div className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-center">
                    <p className="text-xs text-dark-400 mb-1 uppercase tracking-wide">Stay</p>
                    <p className="text-xl font-bold text-accent-purple">Rs.{budgetBreakdown.accommodation.allocated?.toLocaleString()}</p>
                    <p className="text-xs text-dark-500 mt-0.5">Rs.{budgetBreakdown.accommodation.perNight?.toLocaleString()}/night</p>
                  </div>
                )}
                {budgetBreakdown.food && (
                  <div className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-center">
                    <p className="text-xs text-dark-400 mb-1 uppercase tracking-wide">Food</p>
                    <p className="text-xl font-bold text-accent-yellow">Rs.{budgetBreakdown.food.allocated?.toLocaleString()}</p>
                    <p className="text-xs text-dark-500 mt-0.5">Rs.{budgetBreakdown.food.perDay?.toLocaleString()}/day</p>
                  </div>
                )}
                {budgetBreakdown.localTransport && (
                  <div className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-center">
                    <p className="text-xs text-dark-400 mb-1 uppercase tracking-wide">Local</p>
                    <p className="text-xl font-bold text-accent-green">Rs.{budgetBreakdown.localTransport.allocated?.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Transport */}
          {transport && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glass mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TransportIcon mode={transport.mode} /> Transport
                </h2>
                {transport.apiSource && transport.apiSource !== 'fallback' && transport.apiSource !== 'database' && (
                  <span className="badge text-accent-blue border-accent-blue/30 text-xs">
                    Live • {transport.apiSource === 'amadeus' ? 'Amadeus' : transport.apiSource}
                  </span>
                )}
              </div>
              <div className="bg-dark-900 border border-dark-600 rounded-xl p-4">
                {/* Top row: provider + cost */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-dark-800 border border-dark-600 rounded-lg">
                      <TransportIcon mode={transport.mode} />
                    </div>
                    <div>
                      <p className="font-semibold text-white capitalize">
                        {transport.airline || transport.provider || transport.mode}
                      </p>
                      {transport.flightNumber && (
                        <p className="text-xs text-accent-blue font-mono">{transport.flightNumber}</p>
                      )}
                      {transport.trainName && (
                        <p className="text-xs text-accent-blue">{transport.trainName}
                          {transport.trainNumber && <span className="text-dark-500 ml-1">#{transport.trainNumber}</span>}
                        </p>
                      )}
                      {!transport.flightNumber && !transport.trainName && transport.provider && (
                        <p className="text-xs text-dark-400">{transport.provider}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xl font-bold text-accent-blue">Rs.{transport.totalCost?.toLocaleString()}</span>
                </div>

                {/* Flight: departure → arrival airports */}
                {transport.mode === 'flight' && transport.departure && transport.arrival && (
                  <div className="flex items-center gap-3 mb-4 px-2 py-3 bg-dark-800 border border-dark-700 rounded-lg">
                    <div className="text-center min-w-[56px]">
                      <p className="text-lg font-bold text-white font-mono">{transport.departure.airport || '—'}</p>
                      {transport.departure.time && (
                        <p className="text-xs text-dark-400">{new Date(transport.departure.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex items-center gap-1 w-full">
                        <div className="flex-1 h-px bg-dark-600" />
                        <Plane className="w-3.5 h-3.5 text-accent-blue" />
                        <div className="flex-1 h-px bg-dark-600" />
                      </div>
                      <p className="text-xs text-dark-500 mt-1">
                        {transport.stops === 0 ? 'Non-stop' : `${transport.stops} stop${transport.stops > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="text-center min-w-[56px]">
                      <p className="text-lg font-bold text-white font-mono">{transport.arrival.airport || '—'}</p>
                      {transport.arrival.time && (
                        <p className="text-xs text-dark-400">{new Date(transport.arrival.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-3 border-t border-dark-700">
                  {transport.class && (
                    <div>
                      <p className="text-xs text-dark-500 uppercase tracking-wide">Class</p>
                      <p className="text-sm text-dark-200 capitalize">{transport.class}</p>
                    </div>
                  )}
                  {transport.duration && (
                    <div>
                      <p className="text-xs text-dark-500 uppercase tracking-wide">Duration</p>
                      <p className="text-sm text-dark-200">{transport.duration}</p>
                    </div>
                  )}
                  {transport.seats != null && (
                    <div>
                      <p className="text-xs text-dark-500 uppercase tracking-wide">Seats Left</p>
                      <p className="text-sm text-dark-200">{transport.seats}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Accommodation */}
          {accommodation && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-glass mb-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-accent-purple" /> Accommodation
              </h2>
              <div className="bg-dark-900 border border-dark-600 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{accommodation.name}</h3>
                    {accommodation.location && (
                      <p className="text-sm text-dark-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{accommodation.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xl font-bold text-accent-purple">Rs.{accommodation.pricePerNight?.toLocaleString()}<span className="text-sm font-normal text-dark-400">/night</span></p>
                    {accommodation.totalCost && <p className="text-xs text-dark-500 mt-0.5">Total: Rs.{accommodation.totalCost?.toLocaleString()}</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap pt-3 border-t border-dark-700">
                  {accommodation.type && <span className="badge capitalize">{accommodation.type}</span>}
                  {accommodation.rating && (
                    <span className="badge flex items-center gap-1">
                      <Star className="w-3 h-3 fill-accent-yellow text-accent-yellow" />{accommodation.rating}
                    </span>
                  )}
                  {accommodation.amenities?.slice(0, 4).map((a, i) => (
                    <span key={i} className="badge">{a}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Restaurants */}
          {restaurants.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-glass mb-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-accent-red" /> Recommended Restaurants
              </h2>
              <div className="space-y-2">
                {restaurants.map((r, i) => (
                  <div key={i} className="bg-dark-900 border border-dark-600 rounded-xl p-4 flex items-center justify-between hover:border-dark-500 transition-colors">
                    <div>
                      <h3 className="font-semibold text-white">{r.name}</h3>
                      {r.cuisine && <p className="text-xs text-dark-400 mt-0.5">{Array.isArray(r.cuisine) ? r.cuisine.join(', ') : r.cuisine}</p>}
                      {r.rating && (
                        <span className="inline-flex items-center gap-1 text-xs text-accent-yellow mt-1">
                          <Star className="w-3 h-3 fill-accent-yellow" />{r.rating}
                        </span>
                      )}
                    </div>
                    {r.averageCost && (
                      <span className="text-accent-green font-semibold text-sm shrink-0 ml-4">Rs.{r.averageCost?.toLocaleString()}<span className="text-dark-500 font-normal">/meal</span></span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Attractions */}
          {attractions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-glass mb-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-accent-green" /> Places to Visit
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attractions.map((a, i) => (
                  <AttractionCard key={i} attraction={a} destination={tripMeta?.destination} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Notes */}
          {optimizationNotes?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-dark-800/50 backdrop-blur-xl border border-accent-yellow/20 rounded-2xl p-5 mb-4">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-accent-yellow">
                <AlertCircle className="w-4 h-4" /> Trip Notes
              </h2>
              <ul className="space-y-2">
                {optimizationNotes.map((note, i) => (
                  <li key={i} className="text-sm text-dark-300 flex gap-2 items-start">
                    <ChevronRight className="w-4 h-4 text-dark-500 shrink-0 mt-0.5" />
                    <span>{note.message || note}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-center mt-10">
            <button onClick={() => router.push('/')} className="btn-primary">
              Plan Another Trip
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResultsContent />
    </Suspense>
  );
}

function AttractionCard({ attraction, destination }) {
  const [photo, setPhoto] = useState(null);
  useEffect(() => {
    const q = attraction.name || destination;
    if (q) getPhoto(q).then(setPhoto);
  }, [attraction.name, destination]);

  return (
    <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-xl overflow-hidden hover:border-dark-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,155,240,0.08)]">
      {photo && (
        <div className="w-full h-32 overflow-hidden">
          <img src={photo} alt={attraction.name} className="w-full h-full object-cover opacity-80" />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm">{attraction.name}</h3>
        {attraction.estimatedCost !== undefined && (
          <p className="text-xs text-accent-green mt-1">
            {attraction.estimatedCost === 0 ? 'Free entry' : 'Rs.' + attraction.estimatedCost}
          </p>
        )}
        {attraction.rating && (
          <span className="inline-flex items-center gap-1 text-xs text-accent-yellow mt-1">
            <Star className="w-3 h-3 fill-accent-yellow" />{attraction.rating}
          </span>
        )}
      </div>
    </div>
  );
}
