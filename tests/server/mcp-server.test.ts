/**
 * Unit tests for MCP Server
 */

import {
  MCPServer,
  MCPRequest,
  MCPRequestType,
  getServer,
  resetServer,
  RequestHandler,
} from '../../src/server/mcp-server';

describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer();
  });

  afterEach(() => {
    if (server.isServerRunning()) {
      server.stop();
    }
    resetServer();
  });

  describe('Server Lifecycle', () => {
    test('should start server', () => {
      expect(server.isServerRunning()).toBe(false);
      server.start();
      expect(server.isServerRunning()).toBe(true);
    });

    test('should stop server', () => {
      server.start();
      expect(server.isServerRunning()).toBe(true);
      server.stop();
      expect(server.isServerRunning()).toBe(false);
    });

    test('should throw error when starting already running server', () => {
      server.start();
      expect(() => server.start()).toThrow('Server is already running');
    });

    test('should throw error when stopping non-running server', () => {
      expect(() => server.stop()).toThrow('Server is not running');
    });

    test('should emit started event', (done) => {
      server.on('started', (data) => {
        expect(data.timestamp).toBeInstanceOf(Date);
        done();
      });
      server.start();
    });

    test('should emit stopped event', (done) => {
      server.start();
      server.on('stopped', (data) => {
        expect(data.timestamp).toBeInstanceOf(Date);
        done();
      });
      server.stop();
    });
  });

  describe('Configuration', () => {
    test('should use default configuration', () => {
      const config = server.getConfig();
      expect(config.name).toBe('ServiceNow Code Intelligence MCP');
      expect(config.version).toBe('1.0.0');
      expect(config.maxConcurrentRequests).toBe(10);
      expect(config.requestTimeout).toBe(30000);
    });

    test('should accept custom configuration', () => {
      const customServer = new MCPServer({
        name: 'Custom MCP',
        version: '2.0.0',
        maxConcurrentRequests: 5,
      });
      const config = customServer.getConfig();
      expect(config.name).toBe('Custom MCP');
      expect(config.version).toBe('2.0.0');
      expect(config.maxConcurrentRequests).toBe(5);
    });
  });

  describe('Handler Registration', () => {
    const mockHandler: RequestHandler = async () => ({ result: 'test' });

    test('should register handler', () => {
      server.registerHandler(MCPRequestType.HEALTH_CHECK, mockHandler);
      const stats = server.getStats();
      expect(stats.registeredHandlers).toBe(1);
    });

    test('should unregister handler', () => {
      server.registerHandler(MCPRequestType.HEALTH_CHECK, mockHandler);
      expect(server.getStats().registeredHandlers).toBe(1);

      server.unregisterHandler(MCPRequestType.HEALTH_CHECK);
      expect(server.getStats().registeredHandlers).toBe(0);
    });

    test('should allow multiple handler registrations', () => {
      server.registerHandler(MCPRequestType.HEALTH_CHECK, mockHandler);
      server.registerHandler(MCPRequestType.GET_ANALYSIS, mockHandler);
      expect(server.getStats().registeredHandlers).toBe(2);
    });
  });

  describe('Request Handling', () => {
    const createRequest = (type: MCPRequestType, params: Record<string, unknown> = {}): MCPRequest => ({
      id: `req-${Date.now()}`,
      type,
      params,
      timestamp: new Date(),
    });

    test('should return error when server not running', async () => {
      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      const response = await server.handleRequest(request);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('SERVER_NOT_RUNNING');
    });

    test('should return error when handler not found', async () => {
      server.start();
      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      const response = await server.handleRequest(request);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('HANDLER_NOT_FOUND');
    });

    test('should handle successful request', async () => {
      server.start();
      const mockHandler: RequestHandler = async () => ({ result: 'success' });
      server.registerHandler(MCPRequestType.HEALTH_CHECK, mockHandler);

      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      const response = await server.handleRequest(request);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 'success' });
      expect(response.requestId).toBe(request.id);
    });

    test('should handle handler error', async () => {
      server.start();
      const errorHandler: RequestHandler = async () => {
        throw new Error('Handler error');
      };
      server.registerHandler(MCPRequestType.HEALTH_CHECK, errorHandler);

      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      const response = await server.handleRequest(request);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('HANDLER_ERROR');
      expect(response.error?.message).toBe('Handler error');
    });

    test('should enforce concurrent request limit', async () => {
      const limitedServer = new MCPServer({ maxConcurrentRequests: 1 });
      limitedServer.start();

      let handlerStarted = false;
      let resolveHandler: ((value: void) => void) | undefined;

      const slowHandler: RequestHandler = async () => {
        handlerStarted = true;
        await new Promise<void>((resolve) => {
          resolveHandler = resolve;
        });
        return { result: 'slow' };
      };
      limitedServer.registerHandler(MCPRequestType.HEALTH_CHECK, slowHandler);

      // Start first request
      const req1 = createRequest(MCPRequestType.HEALTH_CHECK);
      const promise1 = limitedServer.handleRequest(req1);

      // Wait for handler to start
      while (!handlerStarted) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      // Try to add second request (should fail due to limit of 1)
      const req2 = createRequest(MCPRequestType.HEALTH_CHECK);
      const response2 = await limitedServer.handleRequest(req2);

      expect(response2.error?.code).toBe('TOO_MANY_REQUESTS');

      // Complete first request
      if (resolveHandler) {
        resolveHandler();
      }
      await promise1;

      limitedServer.stop();
    });

    test('should track active requests', async () => {
      server.start();
      const slowHandler: RequestHandler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { result: 'done' };
      };
      server.registerHandler(MCPRequestType.HEALTH_CHECK, slowHandler);

      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      const promise = server.handleRequest(request);

      // Check that request is active
      expect(server.getActiveRequestCount()).toBe(1);

      await promise;

      // Check that request is completed
      expect(server.getActiveRequestCount()).toBe(0);
    });

    test('should emit request events', async () => {
      server.start();
      const mockHandler: RequestHandler = async () => ({ result: 'test' });
      server.registerHandler(MCPRequestType.HEALTH_CHECK, mockHandler);

      const receivedEvents: string[] = [];
      server.on('requestReceived', () => receivedEvents.push('received'));
      server.on('requestCompleted', () => receivedEvents.push('completed'));

      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      await server.handleRequest(request);

      expect(receivedEvents).toEqual(['received', 'completed']);
    });

    test('should emit request failed event on error', async () => {
      server.start();
      const errorHandler: RequestHandler = async () => {
        throw new Error('Test error');
      };
      server.registerHandler(MCPRequestType.HEALTH_CHECK, errorHandler);

      let failedEventEmitted = false;
      server.on('requestFailed', () => {
        failedEventEmitted = true;
      });

      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      await server.handleRequest(request);

      expect(failedEventEmitted).toBe(true);
    });
  });

  describe('Statistics', () => {
    test('should return server statistics', () => {
      const mockHandler: RequestHandler = async () => ({ result: 'test' });
      server.registerHandler(MCPRequestType.HEALTH_CHECK, mockHandler);
      server.start();

      const stats = server.getStats();
      expect(stats.isRunning).toBe(true);
      expect(stats.activeRequests).toBe(0);
      expect(stats.registeredHandlers).toBe(1);
      expect(stats.config).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const server1 = getServer();
      const server2 = getServer();
      expect(server1).toBe(server2);
    });

    test('should reset instance', () => {
      const server1 = getServer();
      server1.start();
      expect(server1.isServerRunning()).toBe(true);

      resetServer();
      const server2 = getServer();
      expect(server2.isServerRunning()).toBe(false);
    });
  });
});
