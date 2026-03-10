/**
 * Travel Plan Store
 * Global state management for the Budget-Adaptive Travel Planner
 */

import { create } from 'zustand';
import api from '../utils/api';

const useTravelPlanStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  currentPlan:    null,   // Full plan response from the server
  minimumFare:    null,   // Minimum-fare variant
  isLoading:      false,
  isMinFareLoading: false,
  error:          null,
  savedPlans:     [],
  savedPlansTotal: 0,
  isSaving:       false,

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Generate a full travel plan.
   * @param {{ source, destination, budget, currency, travelers, dates }} formData
   */
  generatePlan: async (formData) => {
    set({ isLoading: true, error: null, currentPlan: null, minimumFare: null });
    try {
      const data = await api.post('/travel/plan', {
        source:      formData.source,
        destination: formData.destination,
        budget:      parseFloat(formData.budget),
        currency:    formData.currency || 'USD',
        travelers:   parseInt(formData.travelers) || 1,
        ...(formData.dates?.from && { dates: formData.dates }),
      });
      set({ currentPlan: data, isLoading: false });
      return data;
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Failed to generate travel plan';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  /**
   * Generate the minimum-fare variant.
   * @param {{ source, destination, budget, currency, travelers, dates }} formData
   */
  generateMinimumFare: async (formData) => {
    set({ isMinFareLoading: true, error: null });
    try {
      const data = await api.post('/travel/minimum-fare', {
        source:      formData.source,
        destination: formData.destination,
        budget:      parseFloat(formData.budget),
        currency:    formData.currency || 'USD',
        travelers:   parseInt(formData.travelers) || 1,
        ...(formData.dates?.from && { dates: formData.dates }),
      });
      set({ minimumFare: data, isMinFareLoading: false });
      return data;
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Failed to generate minimum fare plan';
      set({ error: message, isMinFareLoading: false });
      throw err;
    }
  },

  /**
   * Save a plan to the user's profile (requires auth).
   * @param {string} planId
   */
  savePlan: async (planId) => {
    set({ isSaving: true });
    try {
      const data = await api.post(`/travel/save/${planId}`);
      // Update isSaved on currentPlan in state if IDs match
      set((state) => ({
        isSaving: false,
        currentPlan: state.currentPlan?.planId === planId
          ? { ...state.currentPlan, plan: { ...state.currentPlan.plan, isSaved: true } }
          : state.currentPlan,
      }));
      return data;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },

  /**
   * Fetch plan history for the logged-in user.
   * @param {number} [page=1]
   */
  fetchHistory: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`/travel/history?page=${page}&limit=10`);
      set({
        savedPlans:      data.plans,
        savedPlansTotal: data.total,
        isLoading:       false,
      });
      return data;
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Failed to fetch plan history';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  /**
   * Delete a saved plan.
   * @param {string} planId
   */
  deletePlan: async (planId) => {
    try {
      await api.delete(`/travel/plan/${planId}`);
      set((state) => ({
        savedPlans: state.savedPlans.filter((p) => p._id !== planId),
      }));
    } catch (err) {
      throw err;
    }
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  clearCurrentPlan: () => set({ currentPlan: null, minimumFare: null, error: null }),
  clearError:       () => set({ error: null }),
}));

export default useTravelPlanStore;
