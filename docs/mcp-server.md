# MCP Server Documentation

This document describes the Model Context Protocol (MCP) server implementation for the ServiceNow Code Intelligence & Refactoring system.

## Overview

The MCP server provides a standard interface for code intelligence operations, handling requests for code analysis, refactoring suggestions, and data retrieval. It implements the Model Context Protocol for communication with LLM-based systems.

## Architecture

### MCPServer Class

The core server class that manages request lifecyc

le, handler registration, and event emission.

**Key Features:**

- Event-driven architecture using Node.js EventEmitter
- Concurrent request limit enforcement
- Request timeout handling
- Handler registration system
- Singleton pattern for global access

### Request Types

The server supports the following request types:

```typescript
enum MCPRequestType {
  ANALYZE_CODE = 'analyzeCode',
  SUGGEST_REFACTOR = 'suggestRefactor',
  GET_ANALYSIS = 'getAnalysis',
  LIST_ANALYSES = 'listAnalyses',
  HEALTH_CHECK = 'healthCheck',
}
```

### Data Models

#### MCPRequest

```typescript
interface MCPRequest {
  id: string;
  type: MCPRequestType;
  params: Record<string, unknown>;
  timestamp: Date;
}
```

#### MCPResponse

```typescript
interface MCPResponse {
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
```

## Usage

### Starting the Server

```typescript
import { getServer, registerDefaultHandlers } from './server';

// Get server instance
const server = getServer({
  name: 'My MCP Server',
  maxConcurrentRequests: 10,
  requestTimeout: 30000,
});

// Register default handlers
registerDefaultHandlers(server);

// Start the server
server.start();
```

### Handling Requests

```typescript
// Create a request
const request: MCPRequest = {
  id: 'req-123',
  type: MCPRequestType.HEALTH_CHECK,
  params: {},
  timestamp: new Date(),
};

// Handle the request
const response = await server.handleRequest(request);

if (response.success) {
  console.log('Success:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### Custom Handlers

Register custom handlers for specific request types:

```typescript
import { MCPRequestType, RequestHandler } from './server';

const customHandler: RequestHandler = async (request) => {
  // Process request
  const result = processRequest(request.params);
  return result;
};

server.registerHandler(MCPRequestType.ANALYZE_CODE, customHandler);
```

### Event Handling

The server emits events for monitoring:

```typescript
server.on('started', (data) => {
  console.log('Server started at:', data.timestamp);
});

server.on('stopped', (data) => {
  console.log('Server stopped at:', data.timestamp);
});

server.on('requestReceived', ({ requestId, type }) => {
  console.log(`Request ${requestId} received: ${type}`);
});

server.on('requestCompleted', ({ requestId }) => {
  console.log(`Request ${requestId} completed`);
});

server.on('requestFailed', ({ requestId, error }) => {
  console.error(`Request ${requestId} failed:`, error);
});
```

## Default Handlers

The server includes default handlers for common operations:

### Health Check Handler

Returns server health status and database statistics.

```typescript
// Request
{
  type: MCPRequestType.HEALTH_CHECK,
  params: {}
}

// Response
{
  status: 'healthy',
  timestamp: Date,
  database: {
    analysisResultsCount: number,
    codeTemplatesCount: number,
    totalIssuesCount: number
  }
}
```

### Get Analysis Handler

Retrieves a specific analysis result.

```typescript
// Request
{
  type: MCPRequestType.GET_ANALYSIS,
  params: {
    analysisId: string
  }
}

// Response
{
  // AnalysisResult object
}
```

### List Analyses Handler

Lists all analysis results with optional filtering.

```typescript
// Request
{
  type: MCPRequestType.LIST_ANALYSES,
  params: {
    fileName?: string,
    language?: 'javascript' | 'typescript',
    severity?: IssueSeverity,
    limit?: number,
    offset?: number,
    sortBy?: 'date' | 'severity' | 'fileName',
    sortOrder?: 'asc' | 'desc'
  }
}

// Response
{
  count: number,
  results: AnalysisResult[]
}
```

### Analyze Code Handler (Placeholder)

Placeholder for code analysis functionality (implemented in Phase 2).

```typescript
// Request
{
  type: MCPRequestType.ANALYZE_CODE,
  params: {
    code: string,
    fileName: string,
    language: 'javascript' | 'typescript'
  }
}
```

### Suggest Refactor Handler (Placeholder)

Placeholder for refactoring suggestions (implemented in Phase 3).

```typescript
// Request
{
  type: MCPRequestType.SUGGEST_REFACTOR,
  params: {
    analysisId: string
  }
}
```

## Configuration

Server configuration options:

```typescript
interface MCPServerConfig {
  name: string;                  // Server name
  version: string;               // Server version
  maxConcurrentRequests: number; // Max concurrent requests
  requestTimeout: number;        // Request timeout in milliseconds
}
```

Default configuration:

- Name: "ServiceNow Code Intelligence MCP"
- Version: "1.0.0"
- Max Concurrent Requests: 10
- Request Timeout: 30000ms (30 seconds)

## Error Handling

The server returns standardized error responses:

### Error Codes

- `SERVER_NOT_RUNNING`: Server is not running
- `TOO_MANY_REQUESTS`: Server at maximum capacity
- `HANDLER_NOT_FOUND`: No handler registered for request type
- `HANDLER_ERROR`: Handler execution failed
- `REQUEST_TIMEOUT`: Request exceeded timeout limit

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: string,
    message: string
  }
}
```

## Testing

The server includes comprehensive test coverage:

- Server lifecycle (start/stop)
- Configuration management
- Handler registration
- Request handling
- Error handling
- Concurrent request limits
- Event emission
- Singleton pattern

Run tests with:

```bash
npm test -- tests/server/
```

## API Reference

### MCPServer Methods

#### `start(): void`

Starts the MCP server. Throws error if already running.

#### `stop(): void`

Stops the MCP server. Throws error if not running.

#### `isServerRunning(): boolean`

Returns server running status.

#### `registerHandler(type: MCPRequestType, handler: RequestHandler): void`

Registers a handler for a specific request type.

#### `unregisterHandler(type: MCPRequestType): void`

Unregisters a handler for a specific request type.

#### `handleRequest(request: MCPRequest): Promise<MCPResponse>`

Processes an incoming request and returns a response.

#### `getConfig(): MCPServerConfig`

Returns current server configuration.

#### `getActiveRequestCount(): number`

Returns number of currently active requests.

#### `getStats(): object`

Returns server statistics including running status, active requests, and registered handlers.

### Singleton Functions

#### `getServer(config?: Partial<MCPServerConfig>): MCPServer`

Returns the singleton server instance.

#### `resetServer(): void`

Resets the server instance (useful for testing).

## Integration with Storage

The MCP server integrates with the storage layer to retrieve and store analysis results:

```typescript
import { getDatabase } from '../storage';

const db = getDatabase();
const result = db.getAnalysisResult(analysisId);
```

## Future Enhancements

Planned improvements for future phases:

1. **WebSocket Support**: Real-time bidirectional communication
2. **Authentication**: Token-based authentication for API access
3. **Rate Limiting**: Request rate limiting per client
4. **Streaming Responses**: Support for streaming large responses
5. **Request Priority**: Priority queue for request processing
6. **Metrics Collection**: Built-in metrics for monitoring
7. **Request Caching**: Cache responses for repeated requests

## Related Documentation

- [Project Structure](project-structure.md)
- [Storage Implementation](storage.md)
- [API Documentation](api.md)
