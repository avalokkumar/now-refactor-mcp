/**
 * MCP Server Implementation
 * Implements the Model Context Protocol for code intelligence and refactoring
 */

import { EventEmitter } from 'events';

/**
 * MCP Request types
 */
export enum MCPRequestType {
  ANALYZE_CODE = 'analyzeCode',
  SUGGEST_REFACTOR = 'suggestRefactor',
  GET_ANALYSIS = 'getAnalysis',
  LIST_ANALYSES = 'listAnalyses',
  HEALTH_CHECK = 'healthCheck',
}

/**
 * MCP Request interface
 */
export interface MCPRequest {
  id: string;
  type: MCPRequestType;
  params: Record<string, unknown>;
  timestamp: Date;
}

/**
 * MCP Response interface
 */
export interface MCPResponse {
  id: string;
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
  timestamp: Date;
}

/**
 * Server configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  maxConcurrentRequests: number;
  requestTimeout: number; // milliseconds
}

/**
 * Default server configuration
 */
const DEFAULT_CONFIG: MCPServerConfig = {
  name: 'ServiceNow Code Intelligence MCP',
  version: '1.0.0',
  maxConcurrentRequests: 10,
  requestTimeout: 30000, // 30 seconds
};

/**
 * MCP Server class
 * Handles incoming requests and coordinates with handlers
 */
export class MCPServer extends EventEmitter {
  private config: MCPServerConfig;
  private isRunning: boolean;
  private activeRequests: Map<string, MCPRequest>;
  private requestHandlers: Map<MCPRequestType, RequestHandler>;

  constructor(config?: Partial<MCPServerConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isRunning = false;
    this.activeRequests = new Map();
    this.requestHandlers = new Map();
  }

  /**
   * Start the MCP server
   */
  start(): void {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    this.isRunning = true;
    this.emit('started', { timestamp: new Date() });
    console.log(`[MCP Server] ${this.config.name} v${this.config.version} started`);
  }

  /**
   * Stop the MCP server
   */
  stop(): void {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    this.isRunning = false;
    this.activeRequests.clear();
    this.emit('stopped', { timestamp: new Date() });
    console.log('[MCP Server] Server stopped');
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Register a request handler
   * @param type - Request type
   * @param handler - Handler function
   */
  registerHandler(type: MCPRequestType, handler: RequestHandler): void {
    this.requestHandlers.set(type, handler);
    console.log(`[MCP Server] Registered handler for ${type}`);
  }

  /**
   * Unregister a request handler
   * @param type - Request type
   */
  unregisterHandler(type: MCPRequestType): void {
    this.requestHandlers.delete(type);
    console.log(`[MCP Server] Unregistered handler for ${type}`);
  }

  /**
   * Process an incoming request
   * @param request - MCP request
   * @returns MCP response
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!this.isRunning) {
      return this.createErrorResponse(request, 'SERVER_NOT_RUNNING', 'Server is not running');
    }

    // Check concurrent request limit
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return this.createErrorResponse(
        request,
        'TOO_MANY_REQUESTS',
        'Server is at maximum capacity'
      );
    }

    // Add to active requests
    this.activeRequests.set(request.id, request);
    this.emit('requestReceived', { requestId: request.id, type: request.type });

    try {
      // Find handler
      const handler = this.requestHandlers.get(request.type);
      if (!handler) {
        return this.createErrorResponse(
          request,
          'HANDLER_NOT_FOUND',
          `No handler registered for request type: ${request.type}`
        );
      }

      // Execute handler with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.config.requestTimeout);
      });

      const resultPromise = handler(request);
      const result = await Promise.race([resultPromise, timeoutPromise]);

      const response: MCPResponse = {
        id: this.generateId(),
        requestId: request.id,
        success: true,
        data: result,
        timestamp: new Date(),
      };

      this.emit('requestCompleted', { requestId: request.id });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('requestFailed', { requestId: request.id, error: errorMessage });
      return this.createErrorResponse(request, 'HANDLER_ERROR', errorMessage);
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Create an error response
   */
  private createErrorResponse(
    request: MCPRequest,
    code: string,
    message: string
  ): MCPResponse {
    return {
      id: this.generateId(),
      requestId: request.id,
      success: false,
      error: { code, message },
      timestamp: new Date(),
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get server configuration
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Get server statistics
   */
  getStats(): {
    isRunning: boolean;
    activeRequests: number;
    registeredHandlers: number;
    config: MCPServerConfig;
  } {
    return {
      isRunning: this.isRunning,
      activeRequests: this.activeRequests.size,
      registeredHandlers: this.requestHandlers.size,
      config: this.getConfig(),
    };
  }
}

/**
 * Request handler function type
 */
export type RequestHandler = (request: MCPRequest) => Promise<unknown>;

// Singleton instance
let serverInstance: MCPServer | null = null;

/**
 * Get the singleton server instance
 * @param config - Optional server configuration
 * @returns The MCP server instance
 */
export function getServer(config?: Partial<MCPServerConfig>): MCPServer {
  if (!serverInstance) {
    serverInstance = new MCPServer(config);
  }
  return serverInstance;
}

/**
 * Reset the server instance (useful for testing)
 */
export function resetServer(): void {
  if (serverInstance && serverInstance.isServerRunning()) {
    serverInstance.stop();
  }
  serverInstance = null;
}
