'use client';

/**
 * TravelPlanResult
 * Full display of an AI-generated travel plan.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Train, Hotel, Utensils, Compass, Lightbulb,
  TrendingUp, TrendingDown, AlertTriangle, BookmarkPlus,
  CheckCircle, Loader2, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

import BudgetBreakdownChart from './BudgetBreakdownChart';
import ItineraryCard        from './ItineraryCard';
import MinimumFarePanel     from './MinimumFarePanel';
import { formatCurrency, TIER_META } from '../../utils/budgetFormatter';
import useTravelPlanStore   from '../../store/travelPlanStore';
import useAuthStore         from '../../store/authStore';

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children, colour = 'indigo' }) {
  const colourMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber:  'bg-amber-50  text-amber-600',
    emerald:'bg-emerald-50 text-emerald-600',
    pink:   'bg-pink-50   text-pink-600',
    blue:   'bg-blue-50   text-blue-600',
  };
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${colourMap[colour] ?? colourMap.indigo}`}>
        <Icon className="w-4 h-4" />
        {title}
      </div>
      {children}
    </motion.section>
  );
}

// ── Transport card ───────────────────────────────────────────────────────────
function TransportCard({ mode, operator, duration, cost, costUnit = 'per person', bookingTip, currency }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div>
        <p className="font-semibold text-gray-800 text-sm">{mode}</p>
        {operator  && <p className="text-xs text-gray-500 mt-0.5">{operator}</p>}
        {duration  && <p className="text-xs text-gray-400">{duration}</p>}
        {bookingTip && (
          <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> {bookingTip}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-bold text-indigo-700">{formatCurrency(cost, currency)}</p>
        <p className="text-xs text-gray-400">{costUnit}</p>
      </div>
    </div>
  );
}

// ── Accommodation card ───────────────────────────────────────────────────────
function AccommodationCard({ type, name, pricePerNight, currency, area, tip }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{name || type}</p>
          {area && <p className="text-xs text-gray-500 mt-0.5">{area}</p>}
          {tip  && <p className="text-xs text-amber-600 mt-1">💡 {tip}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-amber-600">{formatCurrency(pricePerNight, currency)}</p>
          <p className="text-xs text-gray-400">/ night</p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TravelPlanResult({ planData, isMinimumFareMode = false }) {
  const { savePlan, isSaving }    = useTravelPlanStore();
  const { isAuthenticated }       = useAuthStore();
  const [saved, setSaved]         = useState(false);

  if (!planData?.plan) return null;

  const { plan, planId, disclaimer, classification, minimumFareMode } = planData;
  const {
    tripSummary,
    budgetBreakdown,
    itinerary,
    transportOptions,
    accommodationOptions,
    foodGuide,
    budgetTips,
    minimumFareOption,
    warnings,
    proTips,
    _disclaimer: fallbackDisclaimer,
  } = plan;

  const currency    = tripSummary?.currency ?? 'USD';
  const tier        = (classification?.tier ?? tripSummary?.tier ?? 'medium').toLowerCase();
  const tierMeta    = TIER_META[tier] ?? TIER_META.medium;
  const isMinFare   = isMinimumFareMode || minimumFareMode;

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isAuthenticated) { toast.error('Please log in to save plans'); return; }
    try {
      await savePlan(planId);
      setSaved(true);
      toast.success('Plan saved to your profile!');
    } catch {
      toast.error('Failed to save plan');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-5 max-w-3xl mx-auto"
    >
      {/* ── Hero / Summary ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1,  y: 0 }}
        className={`rounded-3xl p-6 ${isMinFare ? 'bg-amber-50 border-2 border-dashed border-amber-300' : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {isMinFare && (
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-200 px-2.5 py-1 rounded-full mb-2">
                ⚡ Minimum Fare Mode
              </span>
            )}
            <h2 className={`text-2xl font-extrabold mb-1 ${isMinFare ? 'text-amber-900' : 'text-white'}`}>
              {tripSummary?.source} → {tripSummary?.destination}
            </h2>
            <p className={`text-sm ${isMinFare ? 'text-amber-700' : 'text-indigo-200'}`}>
              {tripSummary?.travelers} traveler{tripSummary?.travelers > 1 ? 's' : ''} · {tripSummary?.estimatedDays ?? '?'} days
            </p>
          </div>

          <div className="text-right">
            <p className={`text-3xl font-black ${isMinFare ? 'text-amber-800' : 'text-white'}`}>
              {formatCurrency(tripSummary?.totalBudget, currency)}
            </p>
            {/* Tier badge */}
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${tierMeta.bg} ${tierMeta.text}`}>
              {tierMeta.emoji} {tierMeta.label}
            </span>
          </div>
        </div>

        {/* Save button */}
        {planId && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || saved}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all
                ${saved
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : isMinFare
                    ? 'bg-amber-200 hover:bg-amber-300 text-amber-800'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                }`}
            >
              {isSaving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : saved
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
                  : <><BookmarkPlus className="w-3.5 h-3.5" /> Save This Plan</>
              }
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
        <p>{fallbackDisclaimer ?? disclaimer ?? '⚠️ Prices are AI-estimated. Actual costs may vary.'}</p>
      </div>

      {/* ── Budget Chart ───────────────────────────────────────────────────── */}
      {budgetBreakdown && (
        <BudgetBreakdownChart budgetBreakdown={budgetBreakdown} currency={currency} />
      )}

      {/* ── Itinerary ──────────────────────────────────────────────────────── */}
      {itinerary?.length > 0 && (
        <Section icon={MapPin} title="Day-by-Day Itinerary" colour="indigo">
          <div className="space-y-3">
            {itinerary.map((day, i) => (
              <ItineraryCard key={day.day} {...day} currency={currency} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Transport ──────────────────────────────────────────────────────── */}
      {transportOptions?.length > 0 && (
        <Section icon={Train} title="Transport Options" colour="blue">
          <div className="space-y-3">
            {transportOptions.map((opt, i) => (
              <TransportCard key={i} {...opt} currency={currency} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Accommodation ──────────────────────────────────────────────────── */}
      {accommodationOptions?.length > 0 && (
        <Section icon={Hotel} title="Accommodation" colour="amber">
          <div className="space-y-3">
            {accommodationOptions.map((opt, i) => (
              <AccommodationCard key={i} {...opt} currency={currency} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Food Guide ─────────────────────────────────────────────────────── */}
      {foodGuide && (
        <Section icon={Utensils} title="Food Guide" colour="emerald">
          <p className="text-sm text-gray-600 mb-3">
            Budget per meal: <strong>{formatCurrency(foodGuide.budgetPerMeal, currency)}</strong>
          </p>
          {foodGuide.recommendations?.length > 0 && (
            <div className="space-y-2 mb-4">
              {foodGuide.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{rec.type}</p>
                    {rec.examples && <p className="text-xs text-gray-500 mt-0.5">{rec.examples}</p>}
                  </div>
                  <p className="text-sm font-bold text-emerald-600 flex-shrink-0">
                    ~{formatCurrency(rec.avgCost, currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
          {foodGuide.localSpecialties?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Local Specialties</p>
              <div className="flex flex-wrap gap-2">
                {foodGuide.localSpecialties.map((s, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Budget Tips ────────────────────────────────────────────────────── */}
      {budgetTips && (
        <Section icon={Lightbulb} title="Budget Tips" colour="pink">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Save */}
            {budgetTips.canSaveBy && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-700">
                    💡 Save {budgetTips.canSaveBy.percentage}% by…
                  </p>
                </div>
                <ul className="space-y-1">
                  {budgetTips.canSaveBy.suggestions?.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                      <span className="mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Upgrade */}
            {budgetTips.upgradeFor && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-bold text-purple-700">
                    ✨ Spend {formatCurrency(budgetTips.upgradeFor.additionalAmount, currency)} more to unlock…
                  </p>
                </div>
                <ul className="space-y-1">
                  {budgetTips.upgradeFor.unlocks?.map((u, i) => (
                    <li key={i} className="text-xs text-purple-700 flex items-start gap-1.5">
                      <span className="mt-0.5">•</span> {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Minimum Fare ───────────────────────────────────────────────────── */}
      {minimumFareOption && (
        <Section icon={Compass} title="Absolute Minimum Fare" colour="amber">
          <MinimumFarePanel minimumFareOption={minimumFareOption} currency={currency} />
        </Section>
      )}

      {/* ── Warnings ───────────────────────────────────────────────────────── */}
      {warnings?.filter(Boolean).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
            <AlertTriangle className="w-4 h-4" /> Heads Up
          </div>
          {warnings.filter(Boolean).map((w, i) => (
            <p key={i} className="text-xs text-red-600">{w}</p>
          ))}
        </div>
      )}

      {/* ── Pro Tips ───────────────────────────────────────────────────────── */}
      {proTips?.filter(Boolean).length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2">
            <Lightbulb className="w-4 h-4" /> Pro Tips
          </div>
          {proTips.filter(Boolean).map((tip, i) => (
            <p key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
              <span className="mt-0.5">→</span> {tip}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
