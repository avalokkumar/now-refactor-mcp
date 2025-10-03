/**
 * Test Sample Files
 * This script will test the sample files to verify they can be analyzed
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

// Configuration
const config = {
  host: 'localhost',
  port: 3000,
  baseUrl: '/api'
};

// Sample files to test
const sampleFiles = [
  '/Users/alok.vishwakarma1/repo/clay_workspace/now-refactor-mcp/data/samples/incident_manager.js',
  '/Users/alok.vishwakarma1/repo/clay_workspace/now-refactor-mcp/data/samples/catalog_item_processor.js',
  '/Users/alok.vishwakarma1/repo/clay_workspace/now-refactor-mcp/data/samples/user_service.ts',
  '/Users/alok.vishwakarma1/repo/clay_workspace/now-refactor-mcp/data/samples/dashboard_component.ts'
];

// Function to make multipart form request
function makeFormRequest(path, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileName = filePath.split('/').pop();
    
    const postData = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      'Content-Type: application/javascript',
      '',
      fileContent,
      `--${boundary}--`
    ].join('\r\n');
    
    const options = {
      hostname: config.host,
      port: config.port,
      path: `${config.baseUrl}${path}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test file upload endpoint
async function testSampleFile(filePath) {
  console.log(`\nTesting sample file: ${filePath.split('/').pop()}`);
  try {
    const response = await makeFormRequest('/upload', filePath);
    if (response.statusCode === 200) {
      console.log(`✅ Analysis successful: ${response.statusCode} OK`);
      console.log(`   Analysis ID: ${response.data.analysisId}`);
      console.log(`   File ID: ${response.data.fileId}`);
      console.log(`   File Name: ${response.data.fileName}`);
      console.log(`   Issues: ${response.data.issues.length}`);
      console.log(`   Suggestions: ${response.data.suggestions.length}`);
      
      // Print issues
      if (response.data.issues.length > 0) {
        console.log('\n   Issues:');
        response.data.issues.slice(0, 3).forEach((issue, index) => {
          console.log(`     ${index + 1}. [${issue.severity}] ${issue.message} (Line ${issue.line})`);
        });
        if (response.data.issues.length > 3) {
          console.log(`     ... and ${response.data.issues.length - 3} more issues`);
        }
      }
      
      // Print suggestions
      if (response.data.suggestions.length > 0) {
        console.log('\n   Suggestions:');
        response.data.suggestions.slice(0, 3).forEach((suggestion, index) => {
          console.log(`     ${index + 1}. ${suggestion.title}`);
        });
        if (response.data.suggestions.length > 3) {
          console.log(`     ... and ${response.data.suggestions.length - 3} more suggestions`);
        }
      }
      
      return true;
    } else {
      console.log(`❌ Analysis failed: ${response.statusCode}`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Analysis error: ${error.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('Starting sample file tests...');
  
  let successCount = 0;
  
  for (const filePath of sampleFiles) {
    const success = await testSampleFile(filePath);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\nTest summary: ${successCount}/${sampleFiles.length} files analyzed successfully`);
}

// Run tests
runTests().catch(console.error);
