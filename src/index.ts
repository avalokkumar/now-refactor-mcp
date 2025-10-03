/**
 * ServiceNow Code Intelligence & Refactoring MCP
 * Main application entry point
 */

import { getServer as getMCPServer, MCPRequestType } from './server/mcp-server';
import { getAPIServer } from './api/server';
import { registerDefaultHandlers } from './server/handlers';
import { getDatabase } from './storage';
import { getRuleEngine, initializeRules } from './rules';
import { getRefactoringEngine, initializeRefactoringProviders } from './refactor';
import * as path from 'path';
import * as fs from 'fs';

// Configuration
const config = {
  mcp: {
    port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 8080,
    host: process.env.MCP_HOST || '0.0.0.0',
  },
  api: {
    port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000,
    host: process.env.API_HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  storage: {
    dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
  },
};

/**
 * Initialize storage
 */
async function initializeStorage() {
  const dataDir = config.storage.dataDir;
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Initialize database
  const db = getDatabase();
  // Database is already initialized by getDatabase()
  
  console.log(`Storage initialized: ${dataDir}`);
  return db;
}

/**
 * Initialize MCP server
 */
async function initializeMCPServer() {
  const mcpServer = getMCPServer({
    name: 'ServiceNow Code Intelligence MCP',
    version: '1.0.0',
    maxConcurrentRequests: 10,
    requestTimeout: 30000
  });
  
  // Register handlers
  registerDefaultHandlers(mcpServer);
  
  // Start server
  await mcpServer.start();
  
  console.log(`MCP Server started: http://${config.mcp.host}:${config.mcp.port}`);
  return mcpServer;
}

/**
 * Initialize API server
 */
async function initializeAPIServer() {
  const apiServer = getAPIServer({
    port: config.api.port,
    host: config.api.host,
    corsOrigin: config.api.corsOrigin,
  });
  
  // Start server
  await apiServer.start();
  
  console.log(`API Server started: http://${config.api.host}:${config.api.port}`);
  return apiServer;
}

/**
 * Initialize engines
 */
function initializeEngines() {
  // Initialize rule engine
  const ruleEngine = getRuleEngine();
  
  // Register all rules
  initializeRules();
  
  // Initialize refactoring engine
  const refactoringEngine = getRefactoringEngine();
  
  // Register all refactoring providers
  initializeRefactoringProviders();
  
  console.log('Engines initialized');
  return { ruleEngine, refactoringEngine };
}

/**
 * Start application
 */
async function startApplication() {
  try {
    console.log('Starting ServiceNow Code Intelligence & Refactoring MCP...');
    
    // Initialize components
    await initializeStorage();
    const { ruleEngine, refactoringEngine } = initializeEngines();
    const mcpServer = await initializeMCPServer();
    const apiServer = await initializeAPIServer();
    
    console.log('Application started successfully');
    
    // Handle shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      await apiServer.stop();
      await mcpServer.stop();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start application if this file is run directly
if (require.main === module) {
  startApplication();
}

// Export for testing and programmatic usage
export { startApplication, initializeStorage, initializeMCPServer, initializeAPIServer, initializeEngines };
