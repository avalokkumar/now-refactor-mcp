# API Documentation

This document describes the REST API endpoints for code analysis and refactoring.

## Overview

The API provides endpoints for analyzing code, retrieving analysis results, and applying refactoring suggestions. It supports both direct code submission and file uploads.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Authentication is not implemented in the current version. All endpoints are publicly accessible.

## Endpoints

### Code Analysis

#### Analyze Code

Analyzes code and returns issues and refactoring suggestions.

**Endpoint**: `POST /api/analyze`

**Request Body**:

```json
{
  "code": "var x = 5;",
  "fileName": "example.js",
  "language": "javascript"
}
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| code | string | Yes | Source code to analyze |
| fileName | string | Yes | Name of the file |
| language | string | Yes | Language of the code (javascript or typescript) |

**Response**:

```json
{
  "analysisId": "analysis-1633123456789",
  "fileName": "example.js",
  "language": "javascript",
  "stats": {
    "totalIssues": 1,
    "criticalIssues": 0,
    "highIssues": 0,
    "mediumIssues": 1,
    "lowIssues": 0
  },
  "issues": [
    {
      "id": "rule-id-12345",
      "type": "rule-id",
      "severity": "medium",
      "message": "Issue description",
      "line": 1,
      "column": 0,
      "fileName": "example.js"
    }
  ],
  "suggestions": [
    {
      "id": "suggestion-id-12345",
      "title": "Suggestion title",
      "description": "Suggestion description",
      "confidence": "high",
      "confidenceScore": 90,
      "impact": {
        "linesChanged": 1,
        "complexity": "low",
        "breakingChange": false,
        "testingRequired": false,
        "estimatedTime": "1 minute"
      }
    }
  ],
  "executionTime": 50
}
```

#### Upload and Analyze File

Uploads a file, analyzes it, and returns issues and refactoring suggestions.

**Endpoint**: `POST /api/upload`

**Request**: Multipart form data with a file field named `file`

**Supported File Types**: `.js`, `.jsx`, `.ts`, `.tsx`

**Response**: Same as `POST /api/analyze` with additional file information:

```json
{
  "analysisId": "analysis-1633123456789",
  "fileName": "example.js",
  "language": "javascript",
  "fileId": "file-1633123456789",
  "filePath": "/uploads/example.js",
  "stats": { ... },
  "issues": [ ... ],
  "suggestions": [ ... ],
  "executionTime": 50
}
```

### Analysis Results

#### Get Analysis Result

Retrieves a specific analysis result by ID.

**Endpoint**: `GET /api/analysis/:id`

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Analysis ID |

**Response**:

```json
{
  "metadata": {
    "id": "analysis-1633123456789",
    "fileName": "example.js",
    "fileSize": 10,
    "language": "javascript",
    "analysisDate": "2025-10-02T19:00:00.000Z",
    "duration": 50
  },
  "issues": [ ... ],
  "suggestions": [ ... ],
  "stats": { ... }
}
```

#### List Analysis Results

Lists all analysis results with optional filtering.

**Endpoint**: `GET /api/analyses`

**Query Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| language | string | No | Filter by language (javascript or typescript) |
| fileName | string | No | Filter by file name (partial match) |
| limit | number | No | Maximum number of results to return |
| offset | number | No | Number of results to skip |

**Response**:

```json
{
  "count": 2,
  "results": [
    {
      "metadata": { ... },
      "issues": [ ... ],
      "suggestions": [ ... ],
      "stats": { ... }
    },
    {
      "metadata": { ... },
      "issues": [ ... ],
      "suggestions": [ ... ],
      "stats": { ... }
    }
  ]
}
```

### Refactoring

#### Apply Refactoring

Applies a refactoring suggestion to code.

**Endpoint**: `POST /api/refactor/apply`

**Request Body**:

```json
{
  "suggestionId": "suggestion-id-12345",
  "code": "var x = 5;",
  "fileName": "example.js"
}
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| suggestionId | string | Yes | ID of the suggestion to apply |
| code | string | Yes | Source code to refactor |
| fileName | string | Yes | Name of the file |

**Response**:

```json
{
  "suggestionId": "suggestion-id-12345",
  "fileName": "example.js",
  "originalCode": "var x = 5;",
  "refactoredCode": "const x = 5;",
  "appliedAt": "2025-10-02T19:00:00.000Z",
  "success": true
}
```

**Note**: This endpoint is currently not fully implemented and will return a 501 Not Implemented response.

### Statistics

#### Get Statistics

Returns system statistics.

**Endpoint**: `GET /api/stats`

**Response**:

```json
{
  "analyses": {
    "totalAnalyses": 10,
    "javascriptAnalyses": 7,
    "typescriptAnalyses": 3,
    "totalIssues": 25
  },
  "rules": {
    "totalRules": 10,
    "enabledRules": 8,
    "disabledRules": 2
  },
  "refactoring": {
    "totalProviders": 5,
    "providersByRule": {
      "rule-id-1": "Provider1",
      "rule-id-2": "Provider2"
    }
  }
}
```

### Health Check

#### Health Check

Returns the health status of the API.

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T19:00:00.000Z",
  "uptime": 3600
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Error message"
}
```

### Common Error Types

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |
| 501 | Not Implemented | Feature not implemented |

### Examples

#### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Missing required fields: code, fileName, language"
}
```

#### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Analysis result analysis-123 not found"
}
```

## Usage Examples

### Analyze JavaScript Code

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 5;",
    "fileName": "example.js",
    "language": "javascript"
  }'
```

### Upload and Analyze a File

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/file.js"
```

### Get Analysis Result

```bash
curl -X GET http://localhost:3000/api/analysis/analysis-1633123456789
```

### List Analysis Results

```bash
curl -X GET "http://localhost:3000/api/analyses?language=javascript&limit=10&offset=0"
```

## Implementation Notes

### Server Configuration

The API server can be configured with the following options:

```typescript
const server = new APIServer({
  port: 3000,
  host: '0.0.0.0',
  corsOrigin: '*',
  maxRequestSize: '50mb',
});
```

### Starting and Stopping the Server

```typescript
// Start the server
await server.start();

// Stop the server
await server.stop();
```

### Middleware

The API server uses the following middleware:

- CORS: Cross-Origin Resource Sharing
- Body Parser: JSON and URL-encoded
- Request Logging: Logs all requests

### File Upload

File uploads are handled using Multer middleware with the following configuration:

- Maximum file size: 10MB
- Allowed extensions: `.js`, `.jsx`, `.ts`, `.tsx`
- Storage: Memory storage

## Future Enhancements

1. **Authentication**: Add JWT-based authentication
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Webhooks**: Add webhook support for analysis completion
4. **Batch Processing**: Support batch analysis of multiple files
5. **Refactoring Application**: Complete the refactoring application endpoint
6. **API Versioning**: Add API versioning support
7. **Swagger Documentation**: Add Swagger/OpenAPI documentation

## Related Documentation

- [Parser Documentation](parser.md)
- [Rules Documentation](rules.md)
- [Refactoring Documentation](refactor.md)
- [Testing Documentation](testing.md)
