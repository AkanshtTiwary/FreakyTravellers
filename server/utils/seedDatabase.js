/**
 * Database Seed Script
 * Populates database with sample transport, hotel, and restaurant data
 * Run: node utils/seedDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Transport = require('../models/Transport');
const Hotel = require('../models/Hotel');
const Restaurant = require('../models/Restaurant');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Sample Transport Data
const transports = [
  {
    route: {
      source: { city: 'Mumbai', code: 'BOM', state: 'Maharashtra' },
      destination: { city: 'Goa', code: 'GOI', state: 'Goa' },
    },
    mode: 'bus',
    provider: { name: 'RedBus', code: 'RB001', rating: 4.2 },
    class: 'ac',
    schedule: {
      departure: { time: new Date('2026-03-01T22:00:00'), location: 'Dadar' },
      arrival: { time: new Date('2026-03-02T08:00:00'), location: 'Panaji' },
      duration: { hours: 10, minutes: 0 },
    },
    pricing: { basePrice: 800, currency: 'INR', taxes: 50, fees: 20, total: 870 },
    availability: { isAvailable: true, seatsAvailable: 30 },
    amenities: ['AC', 'WiFi', 'Charging Points', 'Water Bottle'],
  },
  {
    route: {
      source: { city: 'Mumbai', code: 'CSTM', state: 'Maharashtra' },
      destination: { city: 'Goa', code: 'MAO', state: 'Goa' },
    },
    mode: 'train',
    provider: { name: 'Indian Railways', code: 'JANSHATABDI', rating: 4.0 },
    class: 'sleeper',
    schedule: {
      departure: { time: new Date('2026-03-01T23:00:00'), location: 'CST' },
      arrival: { time: new Date('2026-03-02T09:30:00'), location: 'Madgaon' },
      duration: { hours: 10, minutes: 30 },
    },
    pricing: { basePrice: 450, currency: 'INR', taxes: 30, fees: 10, total: 490 },
    availability: { isAvailable: true, seatsAvailable: 100 },
    amenities: ['Bedding', 'Charging Points'],
  },
  {
    route: {
      source: { city: 'Mumbai', code: 'BOM', state: 'Maharashtra' },
      destination: { city: 'Goa', code: 'GOI', state: 'Goa' },
    },
    mode: 'flight',
    provider: { name: 'IndiGo', code: '6E123', rating: 4.5 },
    class: 'economy',
    schedule: {
      departure: { time: new Date('2026-03-01T08:00:00'), location: 'Terminal 2' },
      arrival: { time: new Date('2026-03-01T09:15:00'), location: 'Dabolim Airport' },
      duration: { hours: 1, minutes: 15 },
    },
    pricing: { basePrice: 3500, currency: 'INR', taxes: 500, fees: 200, total: 4200 },
    availability: { isAvailable: true, seatsAvailable: 50 },
    amenities: ['7 Kg Cabin Bag', 'Meals Available'],
  },
  {
    route: {
      source: { city: 'Delhi', code: 'DEL', state: 'Delhi' },
      destination: { city: 'Jaipur', code: 'JAI', state: 'Rajasthan' },
    },
    mode: 'bus',
    provider: { name: 'RSRTC', code: 'RS456', rating: 4.0 },
    class: 'ac',
    schedule: {
      departure: { time: new Date('2026-03-01T06:00:00'), location: 'ISBT Kashmere Gate' },
      arrival: { time: new Date('2026-03-01T11:30:00'), location: 'Sindhi Camp' },
      duration: { hours: 5, minutes: 30 },
    },
    pricing: { basePrice: 450, currency: 'INR', taxes: 30, fees: 15, total: 495 },
    availability: { isAvailable: true, seatsAvailable: 40 },
    amenities: ['AC', 'Water', 'Snacks'],
  },
];

// Sample Hotel Data
const hotels = [
  {
    name: 'Goa Beach Resort',
    description: 'Beautiful beachfront resort with stunning ocean views',
    location: {
      city: 'Goa',
      area: 'Calangute',
      state: 'Goa',
      country: 'India',
    },
    type: 'resort',
    starRating: 4,
    userRating: { average: 4.3, count: 250 },
    pricing: {
      currency: 'INR',
      pricePerNight: 2500,
      taxes: 250,
      serviceFee: 100,
    },
    amenities: {
      basic: ['WiFi', 'AC', 'TV', 'Hot Water'],
      bathroom: ['Geyser', 'Toiletries'],
      entertainment: ['TV', 'Pool'],
    },
    facilities: ['Swimming Pool', 'Restaurant', 'Parking', 'Beach Access'],
    availability: { isActive: true, totalRooms: 50, availableRooms: 30 },
  },
  {
    name: 'Budget Inn Goa',
    description: 'Clean and affordable accommodation near the beach',
    location: {
      city: 'Goa',
      area: 'Baga',
      state: 'Goa',
      country: 'India',
    },
    type: 'hotel',
    starRating: 3,
    userRating: { average: 3.8, count: 180 },
    pricing: {
      currency: 'INR',
      pricePerNight: 1200,
      taxes: 120,
      serviceFee: 50,
    },
    amenities: {
      basic: ['WiFi', 'AC', 'TV'],
      bathroom: ['Hot Water'],
    },
    facilities: ['Parking', 'Restaurant'],
    availability: { isActive: true, totalRooms: 25, availableRooms: 15 },
  },
  {
    name: 'Jaipur Heritage Hotel',
    description: 'Traditional Rajasthani hospitality in the Pink City',
    location: {
      city: 'Jaipur',
      area: 'C-Scheme',
      state: 'Rajasthan',
      country: 'India',
    },
    type: 'hotel',
    starRating: 3,
    userRating: { average: 4.0, count: 300 },
    pricing: {
      currency: 'INR',
      pricePerNight: 1800,
      taxes: 180,
      serviceFee: 80,
    },
    amenities: {
      basic: ['WiFi', 'AC', 'TV', 'Hot Water'],
      bathroom: ['Geyser', 'Toiletries'],
    },
    facilities: ['Restaurant', 'Parking', 'Rooftop'],
    availability: { isActive: true, totalRooms: 30, availableRooms: 20 },
  },
];

// Sample Restaurant Data
const restaurants = [
  {
    name: 'Fisherman\'s Wharf',
    description: 'Authentic Goan seafood and continental cuisine',
    location: { city: 'Goa', area: 'Cavelossim', state: 'Goa', country: 'India' },
    cuisine: ['Goan', 'Seafood', 'Continental'],
    type: 'casual-dining',
    mealsServed: { breakfast: false, lunch: true, dinner: true, snacks: true },
    pricing: { currency: 'INR', priceRange: '$$', averageCostForTwo: 1200 },
    rating: { average: 4.5, count: 500, food: 4.6, service: 4.4, ambiance: 4.5 },
    opensAt: '12:00 PM',
    closesAt: '11:00 PM',
    features: {
      seating: ['Indoor', 'Outdoor'],
      parking: { available: true, type: 'Valet' },
      wifi: true,
      ac: true,
      cardAccepted: true,
    },
    dietaryOptions: { vegetarian: true, vegan: false, nonVegetarian: true },
    isActive: true,
  },
  {
    name: 'Vinayak Family Restaurant',
    description: 'Budget-friendly Goan and Indian food',
    location: { city: 'Goa', area: 'Panaji', state: 'Goa', country: 'India' },
    cuisine: ['Goan', 'Indian', 'Chinese'],
    type: 'casual-dining',
    mealsServed: { breakfast: true, lunch: true, dinner: true, snacks: true },
    pricing: { currency: 'INR', priceRange: '$', averageCostForTwo: 500 },
    rating: { average: 4.2, count: 800, food: 4.3, service: 4.0, ambiance: 3.9 },
    opensAt: '8:00 AM',
    closesAt: '10:30 PM',
    features: {
      seating: ['Indoor'],
      parking: { available: true, type: 'Self' },
      wifi: false,
      ac: true,
      cardAccepted: true,
    },
    dietaryOptions: { vegetarian: true, vegan: false, nonVegetarian: true },
    isActive: true,
  },
  {
    name: 'Laxmi Mishthan Bhandar (LMB)',
    description: 'Famous Rajasthani sweets and traditional thali',
    location: { city: 'Jaipur', area: 'Johari Bazaar', state: 'Rajasthan', country: 'India' },
    cuisine: ['Rajasthani', 'North Indian', 'Sweets'],
    type: 'casual-dining',
    mealsServed: { breakfast: true, lunch: true, dinner: true, snacks: true },
    pricing: { currency: 'INR', priceRange: '$', averageCostForTwo: 600 },
    rating: { average: 4.4, count: 1200, food: 4.6, service: 4.2, ambiance: 4.0 },
    opensAt: '8:00 AM',
    closesAt: '11:00 PM',
    features: {
      seating: ['Indoor'],
      parking: { available: false },
      wifi: false,
      ac: true,
      cardAccepted: true,
    },
    dietaryOptions: { vegetarian: true, vegan: false, nonVegetarian: false, jain: true },
    isActive: true,
  },
];

// Seed Function
const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Transport.deleteMany({});
    await Hotel.deleteMany({});
    await Restaurant.deleteMany({});

    // Insert sample data
    console.log('📝 Inserting sample data...');
    
    await Transport.insertMany(transports);
    console.log(`✅ Inserted ${transports.length} transport options`);
    
    await Hotel.insertMany(hotels);
    console.log(`✅ Inserted ${hotels.length} hotels`);
    
    await Restaurant.insertMany(restaurants);
    console.log(`✅ Inserted ${restaurants.length} restaurants`);

    console.log('\n✅ Database seeded successfully!');
    console.log('🎉 You can now test the trip optimization\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
