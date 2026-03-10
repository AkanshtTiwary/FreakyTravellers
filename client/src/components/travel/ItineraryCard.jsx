'use client';

/**
 * ItineraryCard
 * Displays a single day's itinerary in a collapsible card with Framer Motion animation.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sun, Sunset, Moon } from 'lucide-react';
import { formatCurrency } from '../../utils/budgetFormatter';

const TIME_SLOTS = [
  { key: 'morning',   label: 'Morning',   Icon: Sun    },
  { key: 'afternoon', label: 'Afternoon', Icon: Sunset },
  { key: 'evening',   label: 'Evening',   Icon: Moon   },
];

export default function ItineraryCard({ day, title, morning, afternoon, evening, estimatedDailyCost, currency = 'USD', index = 0 }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {day}
          </span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{title || `Day ${day}`}</p>
            {estimatedDailyCost > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                Est. {formatCurrency(estimatedDailyCost, currency)}
              </p>
            )}
          </div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
              {TIME_SLOTS.map(({ key, label, Icon }) => {
                const text = key === 'morning' ? morning : key === 'afternoon' ? afternoon : evening;
                if (!text) return null;
                return (
                  <div key={key} className="flex gap-3 pt-3">
                    <Icon className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
