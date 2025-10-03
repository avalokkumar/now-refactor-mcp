/**
 * UI Test Script for Features
 * This script will test the UI features including refactoring suggestions and code snippets
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testUIFeatures() {
  console.log('Starting UI features test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the main page
    console.log('\n1. Loading main page...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.file-upload');
    console.log('✅ Main page loaded successfully');
    
    // Set up file for upload
    console.log('\n2. Setting up file for upload...');
    const filePath = '/Users/alok.vishwakarma1/repo/clay_workspace/now-refactor-mcp/data/samples/incident_manager.js';
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Set file input
    const fileInput = await page.$('#file-input');
    await fileInput.uploadFile(filePath);
    
    // Wait for file info to appear
    await page.waitForSelector('#file-info:not(.hidden)');
    const fileName = await page.$eval('#file-name', el => el.textContent);
    console.log(`✅ File selected: "${fileName}"`);
    
    // Click analyze button
    console.log('\n3. Clicking analyze button...');
    await page.click('#analyze-btn');
    
    // Wait for results to appear
    try {
      await page.waitForSelector('#results-container:not(.hidden)', { timeout: 10000 });
      console.log('✅ Analysis results displayed');
      
      // Check for issues
      const issueCount = await page.evaluate(() => {
        const issueTab = document.querySelector('.tab-content[data-tab="issues"]');
        return issueTab ? issueTab.querySelectorAll('.issue-item').length : 0;
      });
      
      console.log(`✅ Found ${issueCount} issues in the UI`);
      
      // Check for suggestions
      const suggestionCount = await page.evaluate(() => {
        // Click on suggestions tab
        const suggestionsTab = document.querySelector('.tab[data-tab="suggestions"]');
        suggestionsTab.click();
        
        // Wait a bit for the tab to switch
        return new Promise(resolve => {
          setTimeout(() => {
            const suggestionsTab = document.querySelector('.tab-content[data-tab="suggestions"]');
            const count = suggestionsTab ? suggestionsTab.querySelectorAll('.suggestion-item').length : 0;
            resolve(count);
          }, 500);
        });
      });
      
      console.log(`✅ Found ${suggestionCount} suggestions in the UI`);
      
      // Switch back to issues tab
      await page.evaluate(() => {
        const issuesTab = document.querySelector('.tab[data-tab="issues"]');
        issuesTab.click();
      });
      
      // Test code snippet feature
      console.log('\n4. Testing code snippet feature...');
      const snippetButtonExists = await page.evaluate(() => {
        const buttons = document.querySelectorAll('.toggle-snippet-btn');
        return buttons.length > 0;
      });
      
      if (snippetButtonExists) {
        console.log('✅ Code snippet buttons found');
        
        // Click the first snippet button
        await page.evaluate(() => {
          const button = document.querySelector('.toggle-snippet-btn');
          button.click();
        });
        
        // Wait for snippet to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if snippet is displayed
        const snippetVisible = await page.evaluate(() => {
          const snippet = document.querySelector('.code-snippet:not(.hidden)');
          return snippet !== null;
        });
        
        if (snippetVisible) {
          console.log('✅ Code snippet displayed successfully');
          
          // Get snippet content
          const snippetContent = await page.evaluate(() => {
            const snippet = document.querySelector('.code-snippet:not(.hidden) code');
            return snippet ? snippet.textContent : '';
          });
          
          console.log('Code snippet preview:');
          console.log(snippetContent.substring(0, 100) + '...');
        } else {
          console.log('❌ Code snippet not displayed');
        }
      } else {
        console.log('❌ Code snippet buttons not found');
      }
      
    } catch (error) {
      console.log(`❌ Error waiting for results: ${error.message}`);
    }
    
    console.log('\nUI features test completed');
    
  } catch (error) {
    console.error(`❌ Error during UI features test: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run test
testUIFeatures().catch(console.error);
