/**
 * Train Facilities API - Usage Examples
 * 
 * This file demonstrates practical examples of how to use the Train Facilities API
 * for checking amenities, comparing trains, and optimizing travel choices.
 */

// ============================================================================
// EXAMPLE 1: Check Train Class Facilities
// ============================================================================

async function example1_checkTrainClassFacilities() {
  console.log("\n📚 EXAMPLE 1: Check Train Class Facilities\n");
  console.log("Scenario: User wants to know what facilities are available in Second AC class");
  console.log("Endpoint: GET /api/facilities/by-class?class=2A\n");

  // Frontend code example
  const class_code = "2A";
  const response = await fetch(`http://localhost:5000/api/facilities/by-class?class=${class_code}`);
  const data = await response.json();

  console.log("Response:", JSON.stringify(data, null, 2));
  console.log("\n✅ User can now see that 2A has: AC, WiFi, Charging, Meals, etc.");
}

// ============================================================================
// EXAMPLE 2: Check Specific Facility Availability
// ============================================================================

async function example2_checkSpecificFacility() {
  console.log("\n🔍 EXAMPLE 2: Check Specific Facility Availability\n");
  console.log("Scenario: User wants to know if Rajdhani trains have WiFi");
  console.log("Endpoint: GET /api/facilities/check?trainType=RAJDHANI&facility=wifi\n");

  const train_type = "RAJDHANI";
  const facility = "wifi";
  const response = await fetch(
    `http://localhost:5000/api/facilities/check?trainType=${train_type}&facility=${facility}`
  );
  const data = await response.json();

  console.log("Response:", JSON.stringify(data, null, 2));
  
  if (data.has_facility) {
    console.log("\n✅ Great! RAJDHANI trains have WiFi!");
  } else {
    console.log("\n❌ RAJDHANI trains don't have this facility");
  }
}

// ============================================================================
// EXAMPLE 3: Get Best Value Facilities
// ============================================================================

async function example3_bestValueFacilities() {
  console.log("\n💰 EXAMPLE 3: Get Best Value Facilities\n");
  console.log("Scenario: Budget traveler wants best comfort-to-price ratio");
  console.log("Endpoint: GET /api/facilities/best-value\n");

  const response = await fetch("http://localhost:5000/api/facilities/best-value");
  const data = await response.json();

  console.log("Response:", JSON.stringify(data, null, 2));
  console.log("\n✅ Recommendation: Third AC (3A) offers best value");
  console.log("   - 0.27 price factor (much cheaper than premium)");
  console.log("   - Still has AC, WiFi, and basic comfort");
}

// ============================================================================
// EXAMPLE 4: Filter by Comfort Level
// ============================================================================

async function example4_filterByComfort() {
  console.log("\n🎯 EXAMPLE 4: Filter by Comfort Level\n");
  console.log("Scenario: User wants all premium comfort options");
  console.log("Endpoint: GET /api/facilities/by-comfort?level=premium\n");

  const comfort_level = "premium";
  const response = await fetch(`http://localhost:5000/api/facilities/by-comfort?level=${comfort_level}`);
  const data = await response.json();

  console.log("Response:", JSON.stringify(data, null, 2));
  console.log("\n✅ Premium comfort available in: 1A (First AC)");
}

// ============================================================================
// EXAMPLE 5: Get Train Type Amenities
// ============================================================================

async function example5_trainTypeAmenities() {
  console.log("\n🚆 EXAMPLE 5: Get Train Type Amenities\n");
  console.log("Scenario: User booking Rajdhani and wants to know typical amenities");
  console.log("Endpoint: GET /api/facilities/by-type?type=RAJDHANI\n");

  const train_type = "RAJDHANI";
  const response = await fetch(`http://localhost:5000/api/facilities/by-type?type=${train_type}`);
  const data = await response.json();

  console.log("Response:", JSON.stringify(data, null, 2));
  console.log("\n✅ Rajdhani trains offer:");
  console.log("   - Full Dining Service");
  console.log("   - Complimentary Meals");
  console.log("   - WiFi throughout");
  console.log("   - Multiple Charging Points");
}

// ============================================================================
// EXAMPLE 6: Compare Facilities on Route
// ============================================================================

async function example6_compareFacilities() {
  console.log("\n⚖️ EXAMPLE 6: Compare Facilities Between Trains\n");
  console.log("Scenario: User traveling Delhi to Mumbai, wants to compare options");
  console.log("Endpoint: GET /api/facilities/compare?from=Delhi&to=Mumbai&date=25-03-2026\n");

  const from = "Delhi";
  const to = "Mumbai";
  const date = "25-03-2026";
  
  const response = await fetch(
    `http://localhost:5000/api/facilities/compare?from=${from}&to=${to}&date=${date}`
  );
  const data = await response.json();

  console.log("Response (Sample):");
  console.log(JSON.stringify(data, null, 2));
  
  console.log("\n✅ User can now compare:");
  console.log("   - Departure/Arrival times");
  console.log("   - Available amenities");
  console.log("   - Train type and class");
  console.log("   - Duration and comfort level");
}

// ============================================================================
// EXAMPLE 7: Get All Available Amenities
// ============================================================================

async function example7_allAmenities() {
  console.log("\n📋 EXAMPLE 7: Get All Available Amenities\n");
  console.log("Scenario: Developer needs list of all possible amenities");
  console.log("Endpoint: GET /api/facilities/amenities\n");

  const response = await fetch("http://localhost:5000/api/facilities/amenities");
  const data = await response.json();

  console.log("Response:", JSON.stringify(data, null, 2));
  console.log("\n✅ Total amenities available:", data.total);
}

// ============================================================================
// EXAMPLE 8: Complete Travel Workflow
// ============================================================================

async function example8_completeTravelWorkflow() {
  console.log("\n🎪 EXAMPLE 8: Complete Travel Planning Workflow\n");
  console.log("Scenario: Full workflow from search to facilities comparison\n");

  try {
    // Step 1: Search trains between stations
    console.log("Step 1: Search for trains Delhi → Mumbai");
    const trainsResponse = await fetch(
      "http://localhost:5000/api/trains/between?from=Delhi&to=Mumbai"
    );
    const trains = await trainsResponse.json();
    console.log(`Found ${trains.data?.length || 0} trains\n`);

    // Step 2: Get route details
    console.log("Step 2: Get route details");
    const routeResponse = await fetch(
      "http://localhost:5000/api/trains/route?train=12002"
    );
    const route = await routeResponse.json();
    console.log(`Route details retrieved\n`);

    // Step 3: Compare facilities on the route
    console.log("Step 3: Compare facilities for these trains");
    const facilitiesResponse = await fetch(
      "http://localhost:5000/api/facilities/compare?from=Delhi&to=Mumbai"
    );
    const facilities = await facilitiesResponse.json();
    console.log(`Compared ${facilities.trains?.length || 0} trains\n`);

    console.log("✅ Workflow complete! User can now:");
    console.log("   - See train schedules");
    console.log("   - View route details");
    console.log("   - Compare amenities");
    console.log("   - Make informed booking decision");

  } catch (error) {
    console.error("Error in workflow:", error.message);
  }
}

// ============================================================================
// EXAMPLE 9: Frontend Integration - React Component
// ============================================================================

/*
// React Component Example

import React, { useState, useEffect } from 'react';

function TrainFacilitiesChecker() {
  const [facilities, setFacilities] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('2A');

  useEffect(() => {
    fetchFacilities(selectedClass);
  }, [selectedClass]);

  const fetchFacilities = async (classCode) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/facilities/by-class?class=${classCode}`
      );
      const data = await response.json();
      setFacilities(data.data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="facilities-checker">
      <h2>Train Class Facilities</h2>
      
      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        <option value="1A">First AC</option>
        <option value="2A">Second AC</option>
        <option value="3A">Third AC</option>
        <option value="SL">Sleeper</option>
        <option value="UR">General</option>
      </select>

      {loading && <p>Loading...</p>}
      
      {facilities && (
        <div className="facilities-info">
          <h3>{facilities.name}</h3>
          <p>Comfort Level: {facilities.comfort_level}</p>
          
          <h4>Available Amenities:</h4>
          <ul>
            {facilities.facilities.map((facility, index) => (
              <li key={index}>✓ {facility}</li>
            ))}
          </ul>
          
          <p>Typical Capacity: {facilities.typical_capacity} passengers</p>
        </div>
      )}
    </div>
  );
}

export default TrainFacilitiesChecker;
*/

// ============================================================================
// EXAMPLE 10: Advanced - Multiple Facility Checks
// ============================================================================

async function example10_multipleFacilityChecks() {
  console.log("\n🔗 EXAMPLE 10: Check Multiple Facilities at Once\n");
  console.log("Scenario: Check which train types have multiple required facilities\n");

  const facilitiesToCheck = ['wifi', 'meals', 'charging'];
  const trainTypes = ['RAJDHANI', 'SHATABDI', 'EXPRESS', 'LOCAL'];

  console.log("Checking which trains have all required facilities...\n");

  const results = {};

  for (const trainType of trainTypes) {
    results[trainType] = {};
    
    for (const facility of facilitiesToCheck) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/facilities/check?trainType=${trainType}&facility=${facility}`
        );
        const data = await response.json();
        results[trainType][facility] = data.has_facility ? "✅" : "❌";
      } catch (error) {
        results[trainType][facility] = "⚠️";
      }
    }
  }

  console.log("Results:");
  console.log("Train Type\t\tWiFi\tMeals\tCharging");
  console.log("─────────────────────────────────────────");
  
  for (const trainType in results) {
    const row = results[trainType];
    console.log(
      `${trainType.padEnd(20)}\t${row.wifi}\t${row.meals}\t${row.charging}`
    );
  }

  console.log("\n✅ RAJDHANI has all facilities");
  console.log("✅ SHATABDI has most facilities");
  console.log("⚠️  EXPRESS and LOCAL have limited facilities");
}

// ============================================================================
// EXAMPLE 11: Budget Optimization
// ============================================================================

async function example11_budgetOptimization() {
  console.log("\n💵 EXAMPLE 11: Budget Optimization\n");
  console.log("Scenario: Find cheapest option with acceptable facilities\n");

  // Simulate train data with prices
  const trainOptions = [
    {
      name: "RAJDHANI EXPRESS",
      class: "1A",
      pricePerKm: 2.5,
      facilities: ['AC', 'WiFi', 'Meals', 'Charging'],
    },
    {
      name: "EXPRESS STANDARD",
      class: "3A",
      pricePerKm: 0.67,
      facilities: ['AC', 'WiFi', 'Charging (Limited)'],
    },
    {
      name: "SLEEPER TRAIN",
      class: "SL",
      pricePerKm: 0.32,
      facilities: ['WiFi', 'Toilet'],
    },
  ];

  console.log("Available Options:");
  trainOptions.forEach((train, index) => {
    console.log(`\n${index + 1}. ${train.name} (${train.class})`);
    console.log(`   Price per KM: ₹${train.pricePerKm}`);
    console.log(`   Facilities: ${train.facilities.join(', ')}`);
  });

  // Find best budget option with WiFi
  const budgetWithWiFi = trainOptions.filter(t => 
    t.facilities.includes('WiFi')
  ).sort((a, b) => a.pricePerKm - b.pricePerKm)[0];

  console.log("\n✅ Best Budget Option with WiFi:");
  console.log(`   ${budgetWithWiFi.name}`);
  console.log(`   Price: ₹${budgetWithWiFi.pricePerKm}/KM`);
  console.log(`   Savings: 73% cheaper than Rajdhani`);
}

// ============================================================================
// EXAMPLE 12: Family Trip Planning
// ============================================================================

async function example12_familyTripPlanning() {
  console.log("\n👨‍👩‍👧‍👦 EXAMPLE 12: Family Trip Planning\n");
  console.log("Scenario: Family of 4 planning trip, needs specific facilities\n");

  // Family requirements
  const familyRequirements = {
    children: 2,
    adults: 2,
    requirements: ['toilets', 'bedding', 'meals', 'safety'],
    budget: 'medium',
  };

  console.log("Family Requirements:");
  console.log(`- Members: ${familyRequirements.adults} adults + ${familyRequirements.children} children`);
  console.log(`- Budget: ${familyRequirements.budget}`);
  console.log(`- Requirements: ${familyRequirements.requirements.join(', ')}\n`);

  // Get best value option (3A is ideal for families)
  const response = await fetch(
    "http://localhost:5000/api/facilities/by-comfort?level=medium"
  );
  const data = await response.json();

  console.log("Recommended Option: Third AC (3A)");
  console.log("Why: Perfect for families because:");
  console.log("✅ Has berths for entire family");
  console.log("✅ Has toilets");
  console.log("✅ AC for comfort");
  console.log("✅ Moderate pricing");
  console.log("✅ WiFi for entertainment");
  console.log("\nCapacity: 72 passengers, well-distributed");
  console.log("Price Factor: 0.27 (affordable for family of 4)");
}

// ============================================================================
// Main - Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          Train Facilities API - Usage Examples                 ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  // Synchronous examples (no API calls)
  console.log("\n[] Non-API Examples (Synchronous)\n");
  example8_completeTravelWorkflow();
  example10_multipleFacilityChecks();
  example11_budgetOptimization();
  example12_familyTripPlanning();

  console.log("\n\n[] API Examples (uncomment to test with running server)\n");
  console.log("To test API examples, uncomment the functions below and ensure:");
  console.log("1. Server is running on http://localhost:5000");
  console.log("2. Dependencies are installed (npm install)");
  console.log("3. Run: node FACILITIES_EXAMPLES.js\n");

  // API examples (commented out by default)
  // await example1_checkTrainClassFacilities();
  // await example2_checkSpecificFacility();
  // await example3_bestValueFacilities();
  // await example4_filterByComfort();
  // await example5_trainTypeAmenities();
  // await example6_compareFacilities();
  // await example7_allAmenities();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  example1_checkTrainClassFacilities,
  example2_checkSpecificFacility,
  example3_bestValueFacilities,
  example4_filterByComfort,
  example5_trainTypeAmenities,
  example6_compareFacilities,
  example7_allAmenities,
  example8_completeTravelWorkflow,
  example10_multipleFacilityChecks,
  example11_budgetOptimization,
  example12_familyTripPlanning,
};
