/**
 * Test Pages
 * This script will test the Documentation and About pages
 */

const http = require('http');

// Configuration
const config = {
  host: 'localhost',
  port: 3000
};

// Pages to test
const pages = [
  { path: '/', name: 'Main Page' },
  { path: '/docs/user-guide', name: 'Documentation Page' },
  { path: '/about', name: 'About Page' }
];

// Function to make HTTP request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: path,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test page
async function testPage(page) {
  console.log(`\nTesting ${page.name}: ${page.path}`);
  try {
    const response = await makeRequest(page.path);
    if (response.statusCode === 200) {
      console.log(`✅ Page loaded successfully: ${response.statusCode} OK`);
      
      // Check for key elements
      const data = response.data.toString();
      
      // Check for HTML structure
      const hasHtml = data.includes('<!DOCTYPE html>');
      console.log(`   Has HTML structure: ${hasHtml ? '✅' : '❌'}`);
      
      // Check for header
      const hasHeader = data.includes('<header>');
      console.log(`   Has header: ${hasHeader ? '✅' : '❌'}`);
      
      // Check for footer
      const hasFooter = data.includes('<footer>');
      console.log(`   Has footer: ${hasFooter ? '✅' : '❌'}`);
      
      // Check for content section
      const hasContentSection = data.includes('content-section');
      console.log(`   Has content section: ${hasContentSection ? '✅' : '❌'}`);
      
      // Check for callout (only for docs and about)
      if (page.path !== '/') {
        const hasCallout = data.includes('callout');
        console.log(`   Has callout styling: ${hasCallout ? '✅' : '❌'}`);
      }
      
      // Check for CSS
      const hasCSS = data.includes('docs-styles.css');
      if (page.path !== '/') {
        console.log(`   Has docs-styles.css: ${hasCSS ? '✅' : '❌'}`);
      }
      
      return true;
    } else {
      console.log(`❌ Page failed to load: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Request error: ${error.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('Starting page tests...');
  
  let successCount = 0;
  
  for (const page of pages) {
    const success = await testPage(page);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\nTest summary: ${successCount}/${pages.length} pages loaded successfully`);
}

// Run tests
runTests().catch(console.error);
