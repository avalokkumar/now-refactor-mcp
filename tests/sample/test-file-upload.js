/**
 * Test File Upload and Analysis
 * This script tests the file upload and analysis functionality
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const FormData = require('form-data');

// Test file path
const testFilePath = path.join(__dirname, 'test-sample.js');

// Function to upload file and analyze
async function uploadAndAnalyze() {
  console.log('Testing File Upload and Analysis...\n');
  
  try {
    // Read test file
    const fileContent = fs.readFileSync(testFilePath, 'utf8');
    console.log(`Test file: ${testFilePath}`);
    console.log(`File size: ${fileContent.length} bytes`);
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    
    // Make request
    console.log('\nSending request to /api/upload...');
    
    return new Promise((resolve, reject) => {
      const request = http.request({
        method: 'POST',
        host: 'localhost',
        port: 3000,
        path: '/api/upload',
        headers: form.getHeaders()
      }, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            console.log(`✅ Upload successful (${response.statusCode})`);
            try {
              const result = JSON.parse(data);
              console.log('\nAnalysis Result:');
              console.log(`- Analysis ID: ${result.analysisId}`);
              console.log(`- File ID: ${result.fileId}`);
              console.log(`- File Name: ${result.fileName}`);
              console.log(`- Language: ${result.language}`);
              console.log(`- Issues: ${result.issues.length}`);
              console.log(`- Suggestions: ${result.suggestions.length}`);
              
              resolve(result);
            } catch (error) {
              console.log(`❌ Failed to parse response: ${error.message}`);
              reject(error);
            }
          } else {
            console.log(`❌ Upload failed (${response.statusCode})`);
            console.log(data);
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
      });
      
      request.on('error', (error) => {
        console.log(`❌ Request error: ${error.message}`);
        reject(error);
      });
      
      form.pipe(request);
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    throw error;
  }
}

// Run test
uploadAndAnalyze()
  .then((result) => {
    console.log('\n✅ Test completed successfully');
  })
  .catch((error) => {
    console.log('\n❌ Test failed');
    console.error(error);
  });
