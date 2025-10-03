/**
 * API Verification Script
 * This script will verify all API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  host: 'localhost',
  port: 3000,
  baseUrl: '/api'
};

// Test file path
const testFilePath = path.join(__dirname, 'test-sample.js');

// Function to make HTTP request
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: `${config.baseUrl}${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

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

// Test health endpoint
async function testHealthEndpoint() {
  console.log('\n1. Testing health endpoint...');
  try {
    // Health endpoint is at root level, not under /api
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/health',
      method: 'GET'
    };
    
    const response = await new Promise((resolve, reject) => {
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
      
      req.end();
    });
    
    if (response.statusCode === 200) {
      console.log(`✅ Health endpoint: ${response.statusCode} OK`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Timestamp: ${response.data.timestamp}`);
      return true;
    } else {
      console.log(`❌ Health endpoint: ${response.statusCode} Failed`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error.message}`);
    return false;
  }
}

// Test analyze code endpoint
async function testAnalyzeEndpoint() {
  console.log('\n2. Testing analyze endpoint...');
  try {
    const data = {
      code: 'var x = 5;\nfunction test() {\n  return x + 10;\n}',
      fileName: 'test.js',
      language: 'javascript'
    };
    
    const response = await makeRequest('POST', '/analyze', data);
    if (response.statusCode === 200) {
      console.log(`✅ Analyze endpoint: ${response.statusCode} OK`);
      console.log(`   Analysis ID: ${response.data.analysisId}`);
      console.log(`   File Name: ${response.data.fileName}`);
      console.log(`   Language: ${response.data.language}`);
      return response.data.analysisId;
    } else {
      console.log(`❌ Analyze endpoint: ${response.statusCode} Failed`);
      console.log(response.data);
      return null;
    }
  } catch (error) {
    console.log(`❌ Analyze endpoint error: ${error.message}`);
    return null;
  }
}

// Test get analysis endpoint
async function testGetAnalysisEndpoint(analysisId) {
  console.log('\n3. Testing get analysis endpoint...');
  try {
    const response = await makeRequest('GET', `/analysis/${analysisId}`);
    if (response.statusCode === 200) {
      console.log(`✅ Get analysis endpoint: ${response.statusCode} OK`);
      console.log(`   Analysis ID: ${response.data.metadata.id}`);
      console.log(`   File Name: ${response.data.metadata.fileName}`);
      console.log(`   Language: ${response.data.metadata.language}`);
      return true;
    } else {
      console.log(`❌ Get analysis endpoint: ${response.statusCode} Failed`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get analysis endpoint error: ${error.message}`);
    return false;
  }
}

// Test list analyses endpoint
async function testListAnalysesEndpoint() {
  console.log('\n4. Testing list analyses endpoint...');
  try {
    const response = await makeRequest('GET', '/analyses');
    if (response.statusCode === 200) {
      console.log(`✅ List analyses endpoint: ${response.statusCode} OK`);
      console.log(`   Count: ${response.data.count}`);
      return true;
    } else {
      console.log(`❌ List analyses endpoint: ${response.statusCode} Failed`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ List analyses endpoint error: ${error.message}`);
    return false;
  }
}

// Test stats endpoint
async function testStatsEndpoint() {
  console.log('\n5. Testing stats endpoint...');
  try {
    const response = await makeRequest('GET', '/stats');
    if (response.statusCode === 200) {
      console.log(`✅ Stats endpoint: ${response.statusCode} OK`);
      console.log(`   Total Analyses: ${response.data.analyses.totalAnalyses}`);
      return true;
    } else {
      console.log(`❌ Stats endpoint: ${response.statusCode} Failed`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Stats endpoint error: ${error.message}`);
    return false;
  }
}

// Test file upload endpoint
async function testFileUploadEndpoint() {
  console.log('\n6. Testing file upload endpoint...');
  try {
    const response = await makeFormRequest('/upload', testFilePath);
    if (response.statusCode === 200) {
      console.log(`✅ File upload endpoint: ${response.statusCode} OK`);
      console.log(`   Analysis ID: ${response.data.analysisId}`);
      console.log(`   File ID: ${response.data.fileId}`);
      console.log(`   File Name: ${response.data.fileName}`);
      return true;
    } else {
      console.log(`❌ File upload endpoint: ${response.statusCode} Failed`);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ File upload endpoint error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting API verification...');
  
  // Test health endpoint
  await testHealthEndpoint();
  
  // Test analyze endpoint
  const analysisId = await testAnalyzeEndpoint();
  
  // Test get analysis endpoint
  if (analysisId) {
    await testGetAnalysisEndpoint(analysisId);
  }
  
  // Test list analyses endpoint
  await testListAnalysesEndpoint();
  
  // Test stats endpoint
  await testStatsEndpoint();
  
  // Test file upload endpoint
  await testFileUploadEndpoint();
  
  console.log('\nAPI verification completed');
}

// Run tests
runTests().catch(console.error);
