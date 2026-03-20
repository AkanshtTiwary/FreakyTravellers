#!/usr/bin/env node
// Comprehensive test of the Phagwara-Patna optimization

const { optimizeTripBudget } = require('./utils/optimizationAlgorithm');
const mongoose = require('mongoose');
require('dotenv').config();

async function testOptimization() {
  try {
    console.log('=== PHAGWARA TO PATNA OPTIMIZATION TEST ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const result = await optimizeTripBudget({
      source: 'Phagwara',
      destination: 'Patna',
      totalBudget: 3000,
      numberOfTravelers: 2,
      numberOfDays: 3,
    });

    console.log('📊 Selected Transport:');
    if (result.transport) {
      console.log(`  Mode: ${result.transport.mode}`);
      console.log(`  Provider: ${result.transport.provider}`);
      console.log(`  Cost: ₹${result.transport.totalCost}`);
      console.log(`  Duration: ${result.transport.duration}`);
    }

    console.log('\n📋 All Transport Options (sorted by selection):');
    const transports = result.alternativeTransports || [];
    transports.slice(0, 10).forEach((t, idx) => {
      console.log(`  ${idx + 1}. ${t.mode.toUpperCase()} - ${t.provider} (₹${t.totalCost})`);
    });

    // Check if trains are included
    const hasTrains = transports.some(t => t.mode === 'train');
    const hasRickshaw = transports.some(t => t.mode === 'rickshaw');
    const hasSharedAuto = transports.some(t => t.mode === 'shared-auto');

    console.log('\n✓ Results Analysis:');
    console.log(`  - Trains included: ${hasTrains ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Rickshaw included: ${hasRickshaw ? '⚠️ YES (should be NO for long distance)' : '✅ NO'}`);
    console.log(`  - Shared Auto included: ${hasSharedAuto ? '✅ YES' : '❌ NO (should be present)'}`);
    
    if (!hasTrains) {
      console.log('\n⚠️ WARNING: Trains not in results!');
    } else {
      console.log('\n✅ SUCCESS: Trains are viable options!');
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testOptimization();
