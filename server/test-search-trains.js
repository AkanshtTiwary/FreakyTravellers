#!/usr/bin/env node
// Test searchTrains which uses getFallbackTrains internally

const service = require('./services/externalApiService');

async function testPhagwaraPatna() {
  try {
    console.log('Testing searchTrains for Phagwara to Patna...\n');
    
    const trains = await service.searchTrains({
      source: 'Phagwara',
      destination: 'Patna',
    });
    
    console.log('✅ Got train options:');
    console.log('Total trains:', trains.length);
    
    if (trains.length > 0) {
      trains.slice(0, 5).forEach((train, idx) => {
        console.log(`\n${idx + 1}. ${train.trainName || train.provider}`);
        if (train.class) console.log(`   Class: ${train.class}`);
        if (train.duration) console.log(`   Duration: ${train.duration}`);
        if (train.price) console.log(`   Price: ₹${train.price || train.totalCost}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

testPhagwaraPatna();
