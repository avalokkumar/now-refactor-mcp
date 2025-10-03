/**
 * UI Component Test Script
 * This script will check if all UI components are loaded and functioning correctly
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

// List of UI files to check
const uiFiles = [
  '/',
  '/styles.css',
  '/app.js',
  '/components/file-upload.js',
  '/components/file-upload.css',
  '/components/results-display.js',
  '/components/results-display.css',
  '/components/code-comparison.js',
  '/components/code-comparison.css',
  '/components/report-generator.js',
  '/components/report-generator.css',
  '/services/api-service.js'
];

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 100) + '...' // Just show the first 100 chars
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Check all UI files
async function checkUIComponents() {
  console.log('Checking UI Components...\n');
  
  let allPassed = true;
  
  for (const file of uiFiles) {
    try {
      const url = `http://localhost:3000${file}`;
      const response = await makeRequest(url);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${file} - OK (${response.statusCode})`);
      } else {
        console.log(`❌ ${file} - FAILED (${response.statusCode})`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${file} - ERROR: ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\nSummary:');
  if (allPassed) {
    console.log('✅ All UI components are available and loading correctly.');
  } else {
    console.log('❌ Some UI components failed to load. Check the errors above.');
  }
}

// Check API endpoints
async function checkAPIEndpoints() {
  console.log('\nChecking API Endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/api/stats' },
    { method: 'GET', path: '/api/analyses' }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const url = `http://localhost:3000${endpoint.path}`;
      const response = await makeRequest(url);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${endpoint.method} ${endpoint.path} - OK (${response.statusCode})`);
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path} - FAILED (${response.statusCode})`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ERROR: ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\nSummary:');
  if (allPassed) {
    console.log('✅ All API endpoints are available and responding correctly.');
  } else {
    console.log('❌ Some API endpoints failed to respond. Check the errors above.');
  }
}

// Run tests
async function runTests() {
  await checkUIComponents();
  await checkAPIEndpoints();
}

runTests().catch(console.error);
