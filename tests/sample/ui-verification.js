/**
 * UI Verification Script
 * This script will verify all UI components and API interactions
 */

const puppeteer = require('puppeteer');

async function verifyUI() {
  console.log('Starting UI verification...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test main page loading
    console.log('\n1. Testing main page loading...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.file-upload');
    console.log('✅ Main page loaded successfully');
    
    // Test documentation link
    console.log('\n2. Testing documentation link...');
    await page.click('a[href="/docs/user-guide"]');
    await page.waitForSelector('.content-section');
    const docTitle = await page.$eval('h2', el => el.textContent);
    console.log(`✅ Documentation page loaded successfully: "${docTitle}"`);
    
    // Test about link
    console.log('\n3. Testing about link...');
    await page.click('a[href="/about"]');
    await page.waitForSelector('.content-section');
    const aboutTitle = await page.$eval('h2', el => el.textContent);
    console.log(`✅ About page loaded successfully: "${aboutTitle}"`);
    
    // Go back to main page
    console.log('\n4. Going back to main page...');
    await page.click('a[href="/"]');
    await page.waitForSelector('.file-upload');
    console.log('✅ Returned to main page successfully');
    
    // Test file upload component
    console.log('\n5. Testing file upload component...');
    const fileInputHandle = await page.$('#file-input');
    
    // Create a simple JavaScript file
    const fileContent = 'var x = 5;\nfunction test() {\n  return x + 10;\n}';
    
    // Set file input value
    await page.evaluate(fileContent => {
      const dataTransfer = new DataTransfer();
      const file = new File([fileContent], 'test.js', { type: 'application/javascript' });
      dataTransfer.items.add(file);
      const fileInput = document.querySelector('#file-input');
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, fileContent);
    
    // Wait for file info to appear
    await page.waitForSelector('#file-info:not(.hidden)');
    const fileName = await page.$eval('#file-name', el => el.textContent);
    console.log(`✅ File upload component working: "${fileName}" selected`);
    
    // Test analyze button
    console.log('\n6. Testing analyze button...');
    await page.click('#analyze-btn');
    
    // Wait for either results or error modal
    try {
      await Promise.race([
        page.waitForSelector('#results-container:not(.hidden)', { timeout: 5000 }),
        page.waitForSelector('#modal.active', { timeout: 5000 })
      ]);
      
      // Check if modal is active (error)
      const isModalActive = await page.evaluate(() => {
        return document.querySelector('#modal.active') !== null;
      });
      
      if (isModalActive) {
        const modalTitle = await page.$eval('#modal-title', el => el.textContent);
        const modalMessage = await page.$eval('#modal-message', el => el.textContent);
        console.log(`⚠️ Analyze button clicked but got error: "${modalTitle}: ${modalMessage}"`);
        
        // Close modal
        await page.click('#modal-cancel');
      } else {
        console.log('✅ Analyze button working: Results displayed');
        
        // Test results display component
        console.log('\n7. Testing results display component...');
        const resultsTitle = await page.$eval('#results-container .card-header h2', el => el.textContent);
        console.log(`✅ Results display component working: "${resultsTitle}" shown`);
      }
    } catch (error) {
      console.log(`❌ Analyze button test failed: ${error.message}`);
    }
    
    console.log('\nUI verification completed');
    
  } catch (error) {
    console.error(`❌ Error during UI verification: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Install puppeteer if not already installed
const { execSync } = require('child_process');
try {
  require.resolve('puppeteer');
  console.log('Puppeteer is already installed');
  verifyUI();
} catch (error) {
  console.log('Installing puppeteer...');
  execSync('npm install puppeteer', { stdio: 'inherit' });
  console.log('Puppeteer installed successfully');
  verifyUI();
}
