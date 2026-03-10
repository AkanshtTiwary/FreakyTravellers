'use client';

/**
 * MinimumFarePanel
 * Displays the absolute cheapest possible travel option.
 */

import { motion } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import { formatCurrency, getCategoryColor, getCategoryLabel } from '../../utils/budgetFormatter';

export default function MinimumFarePanel({ minimumFareOption, currency = 'USD' }) {
  if (!minimumFareOption) return null;

  const { totalMinimumCost, breakdown, description } = minimumFareOption;
  const cats = ['transport', 'accommodation', 'food', 'activities'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-bold text-amber-800">Minimum Fare Route</h3>
        <span className="ml-auto text-xl font-extrabold text-amber-700">
          {formatCurrency(totalMinimumCost, currency)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-amber-700 mb-4">{description}</p>

      {/* Breakdown */}
      {breakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {cats.map((cat) => (
            <div key={cat} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block mb-1"
                style={{ backgroundColor: getCategoryColor(cat) }}
              />
              <p className="text-xs text-gray-500">{getCategoryLabel(cat).replace(/^.+\s/, '')}</p>
              <p className="text-sm font-bold text-gray-800">
                {formatCurrency(breakdown[cat] ?? 0, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          🚧 <strong>Local fare data integration coming soon</strong> — estimates based on general transport costs.
          Actual fares may differ. Always verify before booking.
        </p>
      </div>
    </motion.div>
  );
}
