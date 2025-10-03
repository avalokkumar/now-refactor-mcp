/**
 * End-to-end test for the complete workflow
 */

import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { getAPIServer } from '../../src/api/server';
import { getMCPServer } from '../../src/server/mcp-server';
import { getDatabase } from '../../src/storage';
import { registerHandlers } from '../../src/server/handlers';
import { getRuleEngine } from '../../src/rules';
import { getRefactoringEngine } from '../../src/refactor';

describe('End-to-End Tests', () => {
  const apiPort = 3001;
  const mcpPort = 8081;
  
  let apiServer: any;
  let mcpServer: any;
  let app: any;
  
  // Read test fixtures
  const glideScriptSample = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'glide-script-sample.js'),
    'utf-8'
  );
  
  const typescriptSample = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'typescript-sample.ts'),
    'utf-8'
  );
  
  beforeAll(async () => {
    // Initialize database
    const db = getDatabase();
    await db.initialize();
    
    // Initialize rule and refactoring engines
    getRuleEngine();
    getRefactoringEngine();
    
    // Start MCP server
    mcpServer = getMCPServer({
      port: mcpPort,
      host: 'localhost',
    });
    registerHandlers(mcpServer);
    await mcpServer.start();
    
    // Start API server
    apiServer = getAPIServer({
      port: apiPort,
      host: 'localhost',
      corsOrigin: '*',
    });
    await apiServer.start();
    
    app = apiServer.getApp();
  }, 10000);
  
  afterAll(async () => {
    // Stop servers
    await apiServer.stop();
    await mcpServer.stop();
  });
  
  describe('GlideScript Analysis and Refactoring', () => {
    let analysisId: string;
    let suggestionId: string;
    
    test('should analyze GlideScript code', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({
          code: glideScriptSample,
          fileName: 'test-glide-script.js',
          language: 'javascript',
        })
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.analysisId).toBeDefined();
      expect(response.body.issues).toBeDefined();
      expect(response.body.issues.length).toBeGreaterThan(0);
      expect(response.body.suggestions).toBeDefined();
      expect(response.body.suggestions.length).toBeGreaterThan(0);
      
      // Save for next test
      analysisId = response.body.analysisId;
      suggestionId = response.body.suggestions[0].id;
    }, 15000);
    
    test('should retrieve analysis result', async () => {
      const response = await request(app)
        .get(`/api/analysis/${analysisId}`)
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.metadata.id).toBe(analysisId);
      expect(response.body.issues).toBeDefined();
      expect(response.body.suggestions).toBeDefined();
    });
    
    test('should apply refactoring suggestion', async () => {
      const response = await request(app)
        .post('/api/refactor/apply')
        .send({
          suggestionId,
          code: glideScriptSample,
          fileName: 'test-glide-script.js',
        })
        .expect(501); // Currently returns 501 Not Implemented
      
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Not Implemented');
    });
  });
  
  describe('TypeScript Analysis and Refactoring', () => {
    let analysisId: string;
    
    test('should analyze TypeScript code', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({
          code: typescriptSample,
          fileName: 'test-typescript.ts',
          language: 'typescript',
        })
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.analysisId).toBeDefined();
      expect(response.body.issues).toBeDefined();
      expect(response.body.issues.length).toBeGreaterThan(0);
      expect(response.body.suggestions).toBeDefined();
      expect(response.body.suggestions.length).toBeGreaterThan(0);
      
      // Save for next test
      analysisId = response.body.analysisId;
    }, 15000);
    
    test('should retrieve analysis result', async () => {
      const response = await request(app)
        .get(`/api/analysis/${analysisId}`)
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.metadata.id).toBe(analysisId);
      expect(response.body.issues).toBeDefined();
      expect(response.body.suggestions).toBeDefined();
    });
  });
  
  describe('File Upload and Analysis', () => {
    test('should upload and analyze file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from(glideScriptSample), {
          filename: 'upload-test.js',
          contentType: 'application/javascript',
        })
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.analysisId).toBeDefined();
      expect(response.body.fileId).toBeDefined();
      expect(response.body.issues).toBeDefined();
      expect(response.body.issues.length).toBeGreaterThan(0);
    }, 15000);
  });
  
  describe('System Statistics', () => {
    test('should retrieve system statistics', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.analyses).toBeDefined();
      expect(response.body.rules).toBeDefined();
      expect(response.body.refactoring).toBeDefined();
    });
  });
});
