#!/usr/bin/env node
// Test using native Node http module

const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve ({
          status: res.statusCode,
          body: body.length > 2 ? JSON.parse(body) : null,
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    console.log('Testing Phagwara to Patna optimization...\n');
    
    const response = await makeRequest('/api/travelplan/optimize', 'POST', {
      source: 'Phagwara',
      destination: 'Patna',
      budget: 3000,
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      travelers: 2,
    });

    console.log('Status:', response.status);
    if (response.body?.response?.transports) {
      console.log('\n📊 Transport Options:');
      response.body.response.transports.slice(0, 5).forEach((t, i) => {
        console.log(`${i+1}. ${t.mode} - ₹${t.totalCost}`);
      });

      const modes = new Set(response.body.response.transports.map(t => t.mode));
      console.log(`\n✓ Modes: ${[...modes].join(', ')}`);
      console.log(`✓ Has trains: ${ modes.has('train') ? 'YES ✅' : 'NO ❌'}`);
      console.log(`✓ Has rickshaw: ${modes.has('rickshaw') ? 'YES' : 'NO ✅'}`);
    } else if (response.body?.error) {
      console.log('Error:', response.body.error);
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

test();
