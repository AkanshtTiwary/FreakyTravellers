#!/usr/bin/env node

/**
 * Train API Quick Reference & Examples
 * Copy-paste ready examples for common use cases
 */

// ============================================================================
// EXAMPLE 1: Get All Trains Between Two Cities
// ============================================================================

async function example1_getBetweenCities() {
  const response = await fetch(
    'http://localhost:5000/api/trains/between?from=Delhi&to=Goa'
  );
  const data = await response.json();
  
  if (data.success) {
    console.log(`Found ${data.data.length} trains:`);
    data.data.forEach((train, i) => {
      const base = train.train_base;
      console.log(`${i + 1}. ${base.train_name} (${base.train_no})`);
      console.log(`   📍 ${base.from_stn_name} → ${base.to_stn_name}`);
      console.log(`   ⏰ ${base.from_time} - ${base.to_time}`);
      console.log(`   ⏱️  Duration: ${base.travel_time}\n`);
    });
  }
}

// ============================================================================
// EXAMPLE 2: Get Trains for Specific Date
// ============================================================================

async function example2_trainsOnDate() {
  const response = await fetch(
    'http://localhost:5000/api/trains/on-date?from=Delhi&to=Mumbai&date=22-03-2026'
  );
  const data = await response.json();
  
  console.log(`Trains on ${data.date}:`);
  console.log(JSON.stringify(data, null, 2));
}

// ============================================================================
// EXAMPLE 3: Find Cheapest/Fastest Options
// ============================================================================

async function example3_filterOptions() {
  // Get cheapest (usually longer duration)
  const cheapest = await fetch(
    'http://localhost:5000/api/trains/cheapest?from=Delhi&to=Bangalore&date=25-03-2026'
  ).then(r => r.json());
  
  // Get fastest
  const fastest = await fetch(
    'http://localhost:5000/api/trains/fastest?from=Delhi&to=Bangalore&date=25-03-2026'
  ).then(r => r.json());
  
  console.log('=== CHEAPEST OPTIONS ===');
  cheapest.data.slice(0, 3).forEach((train, i) => {
    console.log(`${i + 1}. ${train.train_name} - ${train.duration}`);
  });
  
  console.log('\n=== FASTEST OPTIONS ===');
  fastest.data.slice(0, 3).forEach((train, i) => {
    console.log(`${i + 1}. ${train.train_name} - ${train.duration}`);
  });
}

// ============================================================================
// EXAMPLE 4: Get Trains by Time of Day
// ============================================================================

async function example4_timeBasedSearch() {
  // Early morning trains (5 AM - 12 PM)
  const morning = await fetch(
    'http://localhost:5000/api/trains/early-morning?from=Delhi&to=Mumbai&date=22-03-2026'
  ).then(r => r.json());
  
  // Evening trains (4 PM - 11:59 PM)
  const evening = await fetch(
    'http://localhost:5000/api/trains/evening?from=Delhi&to=Mumbai&date=22-03-2026'
  ).then(r => r.json());
  
  console.log(`🌅 Early Morning Trains: ${morning.data.length}`);
  console.log(`🌆 Evening Trains: ${evening.data.length}`);
}

// ============================================================================
// EXAMPLE 5: Get Train Route Details
// ============================================================================

async function example5_trainRoute() {
  const response = await fetch(
    'http://localhost:5000/api/trains/route?trainNo=12002'
  );
  const data = await response.json();
  
  if (data.success) {
    console.log(`\n${data.train_name} (${data.train_number})\n`);
    console.log('Route Stops:');
    data.data.forEach((stop, i) => {
      console.log(`${i + 1}. ${stop.source_stn_name} (${stop.source_stn_code})`);
      console.log(`   Arrive: ${stop.arrive} | Depart: ${stop.depart}`);
      console.log(`   Distance: ${stop.distance} km\n`);
    });
  }
}

// ============================================================================
// EXAMPLE 6: Advanced Search with Sorting
// ============================================================================

async function example6_advancedSearch() {
  const sortOptions = ['departure', 'duration'];
  
  for (const sort of sortOptions) {
    const response = await fetch(
      `http://localhost:5000/api/trains/search?from=Delhi&to=Mumbai&date=22-03-2026&sort=${sort}`
    );
    const data = await response.json();
    
    console.log(`\n=== Sorted by ${sort.toUpperCase()} ===`);
    data.data.slice(0, 3).forEach((train, i) => {
      console.log(`${i + 1}. ${train.train_name}`);
      console.log(`   Time: ${train.departure} - ${train.arrival}`);
    });
  }
}

// ============================================================================
// EXAMPLE 7: List All Stations
// ============================================================================

async function example7_listStations() {
  const response = await fetch('http://localhost:5000/api/trains/stations');
  const data = await response.json();
  
  console.log(`\nAvailable Stations: ${data.data.length}\n`);
  
  // Group by first letter
  const grouped = {};
  data.data.forEach(station => {
    const letter = station.city[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(station);
  });
  
  // Show sample
  Object.keys(grouped).slice(0, 3).forEach(letter => {
    console.log(`\n${letter}:`);
    grouped[letter].slice(0, 5).forEach(s => {
      console.log(`  ${s.city.padEnd(20)} → ${s.code}`);
    });
  });
}

// ============================================================================
// EXAMPLE 8: Budget Travel Planning
// ============================================================================

async function example8_budgetPlanning() {
  const params = {
    from: 'Delhi',
    to: 'Goa',
    budget: 5000,
    travelers: 2,
  };
  
  // Get all trains
  const trains = await fetch(
    `http://localhost:5000/api/trains/between?from=${params.from}&to=${params.to}`
  ).then(r => r.json());
  
  // Budget allocation: 40% for transport
  const transportBudget = params.budget * 0.4;
  const perPersonBudget = transportBudget / params.travelers;
  
  console.log(`\n💰 Plan for ${params.travelers} travelers:`);
  console.log(`Total Budget: ₹${params.budget}`);
  console.log(`Transport Budget (40%): ₹${transportBudget}`);
  console.log(`Per Person: ₹${perPersonBudget}\n`);
  
  // Show affordable options
  const affordable = trains.data.filter(t => {
    const baseFare = 2000; // Example estimate
    return (baseFare * params.travelers) <= transportBudget;
  });
  
  console.log(`Affordable trains: ${affordable.length}/${trains.data.length}`);
  affordable.slice(0, 3).forEach((train, i) => {
    const base = train.train_base;
    console.log(`${i + 1}. ${base.train_name}`);
    console.log(`   ⏱️  ${base.travel_time}`);
  });
}

// ============================================================================
// EXAMPLE 9: Real-time Search Integration
// ============================================================================

async function example9_realtimeSearch(fromCity, toCity, date) {
  try {
    console.log(`\n🔍 Searching trains from ${fromCity} to ${toCity}...`);
    
    const response = await fetch(
      `http://localhost:5000/api/trains/search?from=${fromCity}&to=${toCity}&date=${date}&sort=departure`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.log(`❌ ${data.message}`);
      return null;
    }
    
    console.log(`✅ Found ${data.data.length} trains\n`);
    
    return data.data.map(train => ({
      name: train.train_name,
      number: train.train_no,
      departure: train.departure,
      arrival: train.arrival,
      duration: train.duration,
      type: train.type,
      price: train.estimated_cost,
    }));
  } catch (error) {
    console.error('Search failed:', error.message);
    return null;
  }
}

// ============================================================================
// EXAMPLE 10: Error Handling
// ============================================================================

async function example10_errorHandling() {
  const testCases = [
    { from: 'InvalidCity', to: 'Mumbai', desc: 'Invalid source' },
    { from: 'Delhi', to: 'InvalidCity', desc: 'Invalid destination' },
    { from: 'Delhi', to: 'Mumbai', date: 'invalid-date', desc: 'Invalid date' },
    { from: 'Delhi', desc: 'Missing parameter' }, // Missing 'to'
  ];
  
  for (const test of testCases) {
    console.log(`\n❌ Testing: ${test.desc}`);
    
    try {
      const url = new URL('http://localhost:5000/api/trains/search');
      if (test.from) url.searchParams.append('from', test.from);
      if (test.to) url.searchParams.append('to', test.to);
      if (test.date) url.searchParams.append('date', test.date);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        console.log(`Found: ${data.data.length} trains`);
      } else {
        console.log(`Error: ${data.message}`);
      }
    } catch (error) {
      console.log(`Exception: ${error.message}`);
    }
  }
}

// ============================================================================
// USAGE - Uncomment to run examples
// ============================================================================

/*
console.log('=== TRAIN API EXAMPLES ===\n');

// Run examples
(async () => {
  // await example1_getBetweenCities();
  // await example2_trainsOnDate();
  // await example3_filterOptions();
  // await example4_timeBasedSearch();
  // await example5_trainRoute();
  // await example6_advancedSearch();
  // await example7_listStations();
  // await example8_budgetPlanning();
  // await example9_realtimeSearch('Delhi', 'Mumbai', '22-03-2026');
  // await example10_errorHandling();
})();
*/

// ============================================================================
// EXPORT FOR USE IN TESTS
// ============================================================================

module.exports = {
  example1_getBetweenCities,
  example2_trainsOnDate,
  example3_filterOptions,
  example4_timeBasedSearch,
  example5_trainRoute,
  example6_advancedSearch,
  example7_listStations,
  example8_budgetPlanning,
  example9_realtimeSearch,
  example10_errorHandling,
};
