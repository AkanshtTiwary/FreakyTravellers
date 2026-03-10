/**
 * Trip Store
 * Global state management for trip data
 */

import { create } from 'zustand';

const useTripStore = create((set) => ({
  // State
  currentTrip: null,
  tripResult: null,
  myTrips: [],
  isLoading: false,
  error: null,

  // Actions
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  
  setTripResult: (result) => set({ tripResult: result }),
  
  setMyTrips: (trips) => set({ myTrips: trips }),
  
  addTrip: (trip) => set((state) => ({ 
    myTrips: [trip, ...state.myTrips] 
  })),
  
  removeTrip: (tripId) => set((state) => ({
    myTrips: state.myTrips.filter((trip) => trip._id !== tripId)
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearTripResult: () => set({ tripResult: null, currentTrip: null }),
  
  clearError: () => set({ error: null }),
}));

export default useTripStore;
