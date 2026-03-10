'use client';

/**
 * BudgetBreakdownChart
 * Donut chart visualising the 4 travel budget categories using Recharts + Framer Motion.
 */

import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, getCategoryColor, getCategoryLabel } from '../../utils/budgetFormatter';

const CATEGORIES = ['transport', 'accommodation', 'food', 'activities'];

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-800">{getCategoryLabel(name)}</p>
      <p className="text-gray-600">{formatCurrency(value, currency)}</p>
    </div>
  );
}

function CustomLegend({ payload, currency }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-3 text-sm">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">
            {getCategoryLabel(entry.value)}&nbsp;
            <span className="font-medium text-gray-800">
              {formatCurrency(entry.payload.value, currency)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function BudgetBreakdownChart({ budgetBreakdown, currency = 'USD' }) {
  if (!budgetBreakdown) return null;

  const data = CATEGORIES
    .filter((cat) => budgetBreakdown[cat]?.allocated > 0)
    .map((cat) => ({
      name:  cat,
      value: budgetBreakdown[cat].allocated,
      color: getCategoryColor(cat),
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">Budget Breakdown</h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend content={<CustomLegend currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Category breakdown list */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {CATEGORIES.filter((cat) => budgetBreakdown[cat]).map((cat) => {
          const item = budgetBreakdown[cat];
          const pct  = item.allocated > 0 && budgetBreakdown.transport?.allocated > 0
            ? Math.round((item.allocated / (
                (budgetBreakdown.transport?.allocated ?? 0) +
                (budgetBreakdown.accommodation?.allocated ?? 0) +
                (budgetBreakdown.food?.allocated ?? 0) +
                (budgetBreakdown.activities?.allocated ?? 0)
              )) * 100)
            : 0;
          return (
            <div key={cat} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(cat) }}
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{getCategoryLabel(cat)}</p>
                <p className="text-sm font-semibold text-gray-800">
                  {formatCurrency(item.allocated, currency)}
                  <span className="text-xs font-normal text-gray-400 ml-1">({pct}%)</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
