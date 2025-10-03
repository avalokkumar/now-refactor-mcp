# Integration Documentation

This document describes the integration approach for the ServiceNow Code Intelligence & Refactoring MCP.

## Overview

The application integrates multiple components into a cohesive system:

1. **MCP Server**: Provides Model Context Protocol services for code analysis and refactoring
2. **REST API**: Exposes HTTP endpoints for web and IDE clients
3. **Storage Layer**: Manages persistence of analysis results and files
4. **Rule Engine**: Analyzes code for issues and violations
5. **Refactoring Engine**: Generates and applies code transformations
6. **UI Layer**: Provides web interface for code analysis and refactoring

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Web Browser   │     │   IDE Plugin    │
│                 │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│                                         │
│              REST API Server            │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     │
                     ▼
┌─────────────────────────────────────────┐
│                                         │
│              MCP Server                 │
│                                         │
└────────┬────────────────────┬───────────┘
         │                    │
         │                    │
         ▼                    ▼
┌────────────────┐    ┌────────────────────┐
│                │    │                    │
│  Rule Engine   │    │ Refactoring Engine │
│                │    │                    │
└────────┬───────┘    └─────────┬──────────┘
         │                      │
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│                                         │
│              Storage Layer              │
│                                         │
└─────────────────────────────────────────┘
```

## Integration Points

### 1. Entry Point (`src/index.ts`)

The main application entry point initializes and connects all components:

```typescript
async function startApplication() {
  // Initialize storage
  await initializeStorage();
  
  // Initialize engines
  const { ruleEngine, refactoringEngine } = initializeEngines();
  
  // Start servers
  const mcpServer = await initializeMCPServer();
  const apiServer = await initializeAPIServer();
}
```

### 2. MCP Server → Handlers

MCP handlers connect the server to the rule and refactoring engines:

```typescript
function registerHandlers(mcpServer) {
  // Analysis handlers
  mcpServer.registerHandler('analyzeCode', analyzeCodeHandler);
  
  // Refactoring handlers
  mcpServer.registerHandler('generateRefactorings', generateRefactoringsHandler);
  mcpServer.registerHandler('applyRefactoring', applyRefactoringHandler);
}
```

### 3. API Server → Controllers

API controllers connect HTTP endpoints to the underlying services:

```typescript
// Analysis controller
export async function analyzeCode(req, res) {
  const { code, fileName, language } = req.body;
  const parser = language === 'javascript' ? getJavaScriptParser() : getTypeScriptParser();
  const parseResult = parser.parse(code, fileName);
  const ruleResult = await getRuleEngine().execute(parseResult, fileName);
  // ...
}
```

### 4. UI → API Service

The UI connects to the API through the API service:

```javascript
// API Service
const ApiService = {
  analyzeCode: async (code, fileName, language) => {
    return await makeRequest('/analyze', {
      method: 'POST',
      body: JSON.stringify({ code, fileName, language })
    });
  }
};
```

## Data Flow

### Code Analysis Flow

1. User uploads code via UI or IDE plugin
2. API receives code and forwards to parser
3. Parser generates AST
4. Rule engine analyzes AST for issues
5. Refactoring engine generates suggestions
6. Results stored in database
7. Results returned to client

### Refactoring Application Flow

1. User selects refactoring suggestion
2. API receives refactoring request
3. Refactoring engine applies transformation
4. Transformed code returned to client

## Configuration

The application uses environment variables for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| MCP_PORT | MCP server port | 8080 |
| MCP_HOST | MCP server host | 0.0.0.0 |
| API_PORT | API server port | 3000 |
| API_HOST | API server host | 0.0.0.0 |
| CORS_ORIGIN | CORS origin for API | * |
| DATA_DIR | Data directory | ./data |

## Startup Sequence

1. Initialize storage
2. Initialize rule and refactoring engines
3. Start MCP server and register handlers
4. Start API server
5. Log successful startup

## Shutdown Sequence

1. Stop API server
2. Stop MCP server
3. Exit process

## Error Handling

- Component initialization failures are caught and logged
- Server errors are logged and returned as 500 responses
- API validation errors are returned as 400 responses

## Testing Integration

End-to-end tests verify the complete integration:

```typescript
test('should analyze code and apply refactoring', async () => {
  // Upload code
  const response = await request(app)
    .post('/api/analyze')
    .send({ code, fileName, language });
  
  // Get suggestion
  const suggestionId = response.body.suggestions[0].id;
  
  // Apply refactoring
  const refactoredResponse = await request(app)
    .post('/api/refactor/apply')
    .send({ suggestionId, code, fileName });
  
  // Verify result
  expect(refactoredResponse.body.refactoredCode).toBeDefined();
});
```

## Deployment

The application can be deployed as:

1. **Standalone Application**: Run directly with Node.js
2. **Docker Container**: Using the provided Dockerfile
3. **Cloud Service**: Deploy to cloud platforms with the provided configuration

## Integration Checklist

- [x] Storage layer initialized
- [x] Rule engine configured
- [x] Refactoring engine configured
- [x] MCP server started with handlers
- [x] API server started with controllers
- [x] UI connected to API
- [x] Error handling implemented
- [x] Graceful shutdown implemented
- [x] End-to-end tests passing
