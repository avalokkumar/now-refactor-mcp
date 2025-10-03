/**
 * Unit tests for API server
 */

import request from 'supertest';
import { APIServer, getAPIServer, resetAPIServer } from '../../src/api/server';

describe('APIServer', () => {
  let server: APIServer;

  beforeEach(() => {
    resetAPIServer();
    // Use a different port for each test to avoid conflicts
    server = getAPIServer({
      port: 0, // Use random available port
      host: 'localhost',
    });
  });

  afterEach(async () => {
    try {
      await server.stop();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('Server Configuration', () => {
    test('should use default configuration', () => {
      const defaultServer = new APIServer();
      const config = defaultServer.getConfig();

      expect(config.port).toBe(3000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.corsOrigin).toBe('*');
      expect(config.maxRequestSize).toBe('50mb');
    });

    test('should override configuration', () => {
      const customServer = new APIServer({
        port: 4000,
        host: '127.0.0.1',
        corsOrigin: 'https://example.com',
        maxRequestSize: '10mb',
      });

      const config = customServer.getConfig();
      expect(config.port).toBe(4000);
      expect(config.host).toBe('127.0.0.1');
      expect(config.corsOrigin).toBe('https://example.com');
      expect(config.maxRequestSize).toBe('10mb');
    });
  });

  describe('Server Lifecycle', () => {
    test('should start and stop server', async () => {
      // Create a new server instance for this test
      const testServer = new APIServer({ port: 0 });
      await testServer.start();
      await testServer.stop();
      // If we got here without errors, the test passes
      expect(true).toBe(true);
    });
  });

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      // Don't start the server, just test the route handler directly
      const app = server.getApp();
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('404 Handler', () => {
    test('should handle 404 errors', async () => {
      // Don't start the server, just test the route handler directly
      const app = server.getApp();
      const response = await request(app).get('/non-existent-route');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const server1 = getAPIServer();
      const server2 = getAPIServer();
      expect(server1).toBe(server2);
    });

    test('should reset instance', () => {
      const server1 = getAPIServer();
      resetAPIServer();
      const server2 = getAPIServer();
      expect(server1).not.toBe(server2);
    });
  });
});
