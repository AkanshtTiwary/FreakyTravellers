#!/usr/bin/env node
/**
 * Test script to identify the 400 Bad Request issue
 * Tests what the client sends vs what the server expects
 */

const axios = require('axios');
const http = require('http');

const SERVER_URL = 'http://localhost:5000/api';

// Test cases
const testCases = [
  {
    name: 'Valid Request - All Required Fields',
    data: {
      source: 'Mumbai',
      destination: 'Goa',
      totalBudget: '5000',
      numberOfTravelers: 2,
      numberOfDays: 3,
    },
  },
  {
    name: 'Missing totalBudget',
    data: {
      source: 'Mumbai',
      destination: 'Goa',
      numberOfTravelers: 2,
      numberOfDays: 3,
    },
  },
  {
    name: 'Empty totalBudget',
    data: {
      source: 'Mumbai',
      destination: 'Goa',
      totalBudget: '',
      numberOfTravelers: 2,
      numberOfDays: 3,
    },
  },
  {
    name: 'totalBudget as number',
    data: {
      source: 'Mumbai',
      destination: 'Goa',
      totalBudget: 5000,
      numberOfTravelers: 2,
      numberOfDays: 3,
    },
  },
  {
    name: 'Budget below minimum',
    data: {
      source: 'Mumbai',
      destination: 'Goa',
      totalBudget: '100',
      numberOfTravelers: 1,
      numberOfDays: 1,
    },
  },
  {
    name: 'Budget exceeds maximum',
    data: {
      source: 'Mumbai',
      destination: 'Goa',
      totalBudget: '9999999',
      numberOfTravelers: 1,
      numberOfDays: 1,
    },
  },
  {
    name: 'Short city name',
    data: {
      source: 'M',
      destination: 'Goa',
      totalBudget: '5000',
      numberOfTravelers: 1,
      numberOfDays: 1,
    },
  },
];

async function runTests() {
  console.log('🧪 Testing /api/trips/optimize endpoint...\n');
  
  for (const testCase of testCases) {
    try {
      console.log(`📝 Test: ${testCase.name}`);
      console.log(`   Payload: ${JSON.stringify(testCase.data)}`);
      
      const response = await axios.post(`${SERVER_URL}/trips/optimize`, testCase.data, {
        validateStatus: () => true, // Don't throw on any status code
      });
      
      if (response.status === 200) {
        console.log(`   ✅ Status 200: Success\n`);
      } else if (response.status === 400) {
        console.log(`   ❌ Status 400: Bad Request`);
        console.log(`   Error Details:`);
        console.log(`   ${JSON.stringify(response.data, null, 2)}\n`);
      } else {
        console.log(`   ⚠️ Status ${response.status}`);
        console.log(`   ${JSON.stringify(response.data, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}\n`);
    }
  }
}

// Wait for server to be ready, then run tests
setTimeout(() => {
  runTests().catch(console.error).finally(() => process.exit(0));
}, 2000);
