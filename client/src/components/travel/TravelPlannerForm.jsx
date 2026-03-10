'use client';

/**
 * TravelPlannerForm
 * Main search form for the Budget-Adaptive Travel Planner.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Users, Calendar, ArrowRight, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useTravelPlanStore from '../../store/travelPlanStore';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'THB'];

export default function TravelPlannerForm({ onPlanGenerated }) {
  const { generatePlan, generateMinimumFare, isLoading, isMinFareLoading } = useTravelPlanStore();

  const [form, setForm] = useState({
    source:      '',
    destination: '',
    budget:      '',
    currency:    'USD',
    travelers:   1,
    dateFrom:    '',
    dateTo:      '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    source:      form.source.trim(),
    destination: form.destination.trim(),
    budget:      parseFloat(form.budget),
    currency:    form.currency,
    travelers:   parseInt(form.travelers),
    dates: form.dateFrom ? { from: form.dateFrom, to: form.dateTo || form.dateFrom } : undefined,
  });

  const validateForm = () => {
    if (!form.source.trim())      { toast.error('Please enter your origin city');       return false; }
    if (!form.destination.trim()) { toast.error('Please enter a destination city');      return false; }
    if (!form.budget || parseFloat(form.budget) < 1) { toast.error('Please enter a valid budget'); return false; }
    return true;
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const data = await generatePlan(buildPayload());
      toast.success('✈️ Travel plan generated!');
      onPlanGenerated?.(data);
    } catch {
      toast.error('Failed to generate plan. Please try again.');
    }
  };

  const handleMinimumFare = async () => {
    if (!validateForm()) return;
    try {
      const data = await generateMinimumFare(buildPayload());
      toast.success('💸 Minimum fare plan ready!');
      onPlanGenerated?.(data, true);
    } catch {
      toast.error('Failed to get minimum fare. Please try again.');
    }
  };

  const busy = isLoading || isMinFareLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Plan Your Trip</h2>
        <p className="text-sm text-gray-500 mt-1">
          Any budget, any destination — we'll find a way to make it work.
        </p>
      </div>

      <form onSubmit={handleGeneratePlan} className="space-y-5">
        {/* Source & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              From
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Delhi, Mumbai, New York…"
                disabled={busy}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              To
            </label>
            <div className="relative">
              <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="Goa, Paris, Bangkok…"
                disabled={busy}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Total Budget
          </label>
          <div className="flex gap-2">
            {/* Currency selector */}
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              disabled={busy}
              className="px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50 disabled:bg-gray-100"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {/* Budget amount */}
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="1"
                disabled={busy}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Any amount from $1 to $1,000,000 — we always find you a plan.
          </p>
        </div>

        {/* Travelers + Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Travelers
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                name="travelers"
                value={form.travelers}
                onChange={handleChange}
                min="1"
                max="50"
                disabled={busy}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Depart (optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="dateFrom"
                value={form.dateFrom}
                onChange={handleChange}
                disabled={busy}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Return (optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="dateTo"
                value={form.dateTo}
                onChange={handleChange}
                disabled={busy}
                min={form.dateFrom}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><ArrowRight className="w-4 h-4" /> Generate Travel Plan</>
            }
          </button>

          <button
            type="button"
            onClick={handleMinimumFare}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-3.5 px-5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {isMinFareLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
              : <><Zap className="w-4 h-4" /> Min Fare</>
            }
          </button>
        </div>
      </form>

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400 mt-5">
        ⚠️ Prices are AI-estimated. Actual costs may vary. Local fare data integration in progress.
      </p>
    </motion.div>
  );
}
