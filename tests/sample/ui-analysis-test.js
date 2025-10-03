/**
 * UI Analysis Test Script
 * This script will test the UI analysis functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testUIAnalysis() {
  console.log('Starting UI analysis test...');
  
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
      
      // Check issue details
      if (issueCount > 0) {
        const firstIssue = await page.evaluate(() => {
          const issueItem = document.querySelector('.issue-item');
          if (!issueItem) return null;
          
          return {
            type: issueItem.querySelector('.issue-title') ? issueItem.querySelector('.issue-title').textContent : 'Unknown',
            message: issueItem.querySelector('.issue-message') ? issueItem.querySelector('.issue-message').textContent : 'Unknown',
            location: issueItem.querySelector('.issue-location') ? issueItem.querySelector('.issue-location').textContent : 'Unknown'
          };
        });
        
        if (firstIssue) {
          console.log('\n4. First issue details:');
          console.log(`   Type: ${firstIssue.type}`);
          console.log(`   Message: ${firstIssue.message}`);
          console.log(`   Location: ${firstIssue.location}`);
        }
      }
      
      // Check summary stats
      const stats = await page.evaluate(() => {
        return {
          total: document.querySelector('.stat-card:nth-child(1) h3').textContent,
          critical: document.querySelector('.stat-card:nth-child(2) h3').textContent,
          high: document.querySelector('.stat-card:nth-child(3) h3').textContent,
          medium: document.querySelector('.stat-card:nth-child(4) h3').textContent,
          low: document.querySelector('.stat-card:nth-child(5) h3').textContent
        };
      });
      
      console.log('\n5. Analysis statistics:');
      console.log(`   Total Issues: ${stats.total}`);
      console.log(`   Critical: ${stats.critical}`);
      console.log(`   High: ${stats.high}`);
      console.log(`   Medium: ${stats.medium}`);
      console.log(`   Low: ${stats.low}`);
      
    } catch (error) {
      console.log(`❌ Error waiting for results: ${error.message}`);
      
      // Check if error modal is displayed
      const isModalVisible = await page.evaluate(() => {
        const modal = document.getElementById('modal');
        return modal && modal.classList.contains('active');
      });
      
      if (isModalVisible) {
        const modalTitle = await page.$eval('#modal-title', el => el.textContent);
        const modalMessage = await page.$eval('#modal-message', el => el.textContent);
        console.log(`❌ Error modal displayed: "${modalTitle}: ${modalMessage}"`);
      }
    }
    
    console.log('\nUI analysis test completed');
    
  } catch (error) {
    console.error(`❌ Error during UI analysis test: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run test
testUIAnalysis().catch(console.error);
