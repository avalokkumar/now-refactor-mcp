# ServiceNow Code Intelligence MCP - Usage Guide

This comprehensive guide explains how to deploy, run, and use the ServiceNow Code Intelligence MCP server. The MCP (Micro-services Communication Protocol) server provides code analysis, refactoring suggestions, and other intelligence features for ServiceNow platform development.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the Server](#running-the-server)
4. [Using the Web Interface](#using-the-web-interface)
5. [API Reference](#api-reference)
6. [Configuration Options](#configuration-options)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)
9. [Integrating with IDEs](#integrating-with-ides)
10. [FAQ](#faq)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher
- **Git**: For cloning the repository

You can verify your installations with:

```bash
node --version
npm --version
git --version
```

## Installation

### Option 1: Clone from GitHub

1. Clone the repository:
   ```bash
   git clone https://github.com/servicenow/code-intelligence-mcp.git
   cd code-intelligence-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Option 2: Use the NPM Package

1. Install the package globally:
   ```bash
   npm install -g @servicenow/code-intelligence-mcp
   ```

### Option 3: Docker Installation

1. Pull the Docker image:
   ```bash
   docker pull servicenow/code-intelligence-mcp:latest
   ```

## Running the Server

### Standard Method

Start the server in development mode:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

The server will start on the following ports by default:
- MCP Server: http://localhost:8080
- Web Interface: http://localhost:3000

### Using Docker

Run the Docker container:

```bash
docker run -p 8080:8080 -p 3000:3000 servicenow/code-intelligence-mcp:latest
```

### Environment Variables

You can configure the server using environment variables:

```bash
# Set custom ports
PORT=4000 MCP_PORT=9090 npm run dev

# Or using .env file
echo "PORT=4000\nMCP_PORT=9090" > .env
npm run dev
```

## Using the Web Interface

The web interface provides an easy way to interact with the code intelligence features.

### Analyzing Code

1. Open your browser and navigate to `http://localhost:3000`
2. Use the file upload form to select a JavaScript or TypeScript file
3. Click "Analyze" to process the file
4. View the analysis results, including:
   - Issues detected in the code
   - Refactoring suggestions
   - Code metrics

### Understanding Analysis Results

The analysis results are divided into two main tabs:

#### Issues Tab

Shows code issues detected by the analyzer:
- Each issue includes type, severity, and location information
- Click the "Show Code" button to view the relevant code snippet
- Issues are categorized by severity (Critical, High, Medium, Low)

#### Suggestions Tab

Provides refactoring suggestions to improve the code:
- Each suggestion includes a description and estimated effort
- View the before/after code comparison
- Suggestions are linked to specific issues

## API Reference

The MCP server exposes several API endpoints for programmatic access.

### Base URLs

- MCP Server: `http://localhost:8080`
- API Server: `http://localhost:3000/api`

### Key Endpoints

#### Analyze Code

```
POST /api/analyze
```

Request body:
```json
{
  "code": "function example() { var x = 1; }",
  "fileName": "example.js",
  "language": "javascript"
}
```

#### Upload and Analyze

```
POST /api/upload
```

Use `multipart/form-data` with a `file` field containing the code file.

#### Get Analysis Results

```
GET /api/analysis/:id
```

#### Get Code Snippet

```
GET /api/code-snippet?fileName=example.js&startLine=10&endLine=20
```

#### List Analyses

```
GET /api/analyses
```

#### Apply Refactoring

```
POST /api/refactor/apply
```

Request body:
```json
{
  "suggestionId": "suggestion-123",
  "analysisId": "analysis-456"
}
```

### MCP Protocol Handlers

The MCP server supports the following handlers:

- `healthCheck`: Check server health
- `getAnalysis`: Get analysis results
- `listAnalyses`: List available analyses
- `analyzeCode`: Analyze code
- `suggestRefactor`: Get refactoring suggestions

## Configuration Options

### Server Configuration

Edit the `config.js` file to customize:

- Server ports
- Storage locations
- Analysis settings
- Rule configurations

### Rule Configuration

You can enable/disable specific rules or adjust their severity:

```js
// config.js
module.exports = {
  rules: {
    'glide-nested-query': {
      enabled: true,
      severity: 'high'
    },
    'ts-no-any': {
      enabled: true,
      severity: 'medium'
    }
    // Other rules...
  }
};
```

## Troubleshooting

### Common Issues

#### Server Won't Start

Check if the ports are already in use:
```bash
lsof -i :3000
lsof -i :8080
```

Kill the processes if needed:
```bash
kill $(lsof -t -i:3000)
kill $(lsof -t -i:8080)
```

#### Analysis Fails

- Ensure the file is valid JavaScript or TypeScript
- Check server logs for specific errors
- Verify file size is under the maximum limit (default: 10MB)

#### No Rules Detected

- Make sure rules are properly initialized
- Check that the file type is supported
- Verify rule configurations

### Logs

View server logs for detailed error information:

```bash
# Development logs
npm run dev

# Production logs
npm start > server.log 2>&1
```

## Advanced Usage

### Custom Rules

You can extend the analyzer with custom rules:

1. Create a rule file in `src/rules/custom/my-rule.ts`
2. Implement the rule interface
3. Register your rule in `src/rules/initializer.ts`

Example custom rule:

```typescript
import { Rule, RuleViolation } from '../models';

export class MyCustomRule implements Rule {
  id = 'custom-rule-id';
  name = 'My Custom Rule';
  description = 'Detects a specific pattern in code';
  severity = 'medium';

  analyze(parseResult) {
    const violations: RuleViolation[] = [];
    // Implement analysis logic
    return violations;
  }
}
```

### Custom Refactoring Providers

Similarly, you can create custom refactoring providers:

1. Create a provider file in `src/refactor/custom/my-provider.ts`
2. Implement the provider interface
3. Register your provider in `src/refactor/initializer.ts`

### Batch Processing

For analyzing multiple files:

```bash
# Using the CLI
npx code-intelligence-mcp analyze --dir ./my-project --output results.json

# Using the API
curl -X POST http://localhost:3000/api/analyze-batch \
  -H "Content-Type: application/json" \
  -d '{"files": ["file1.js", "file2.js"]}'
```

## Integrating with IDEs

### VS Code Extension

1. Install the ServiceNow Code Intelligence extension from the VS Code marketplace
2. Configure the extension to point to your MCP server
3. Use the extension features:
   - In-editor code analysis
   - Quick fixes based on refactoring suggestions
   - Command palette integration

### JetBrains IDEs (WebStorm, IntelliJ)

1. Install the ServiceNow Code Intelligence plugin
2. Configure the plugin settings with your MCP server URL
3. Access features through the Tools menu or context actions

### Other IDEs

For other IDEs, you can use the API directly or create custom integrations using the API endpoints.

## FAQ

### What file types are supported?

The analyzer currently supports:
- JavaScript (.js)
- TypeScript (.ts)
- ServiceNow GlideScript files

### How are refactoring suggestions generated?

Refactoring suggestions are created by specialized providers that analyze rule violations and generate appropriate code transformations. Each suggestion includes:
- Description of the issue
- Proposed solution
- Before/after code comparison
- Confidence score
- Estimated effort

### Can I run the server in a CI/CD pipeline?

Yes, the server can be integrated into CI/CD pipelines:

```bash
# Example in a GitHub Actions workflow
npm install -g @servicenow/code-intelligence-mcp
code-intelligence-mcp analyze --dir ./src --format junit > code-analysis.xml
```

### Is the analysis performed locally or in the cloud?

All analysis is performed locally on your machine or server. No code is sent to external services.

### How can I contribute to the project?

Contributions are welcome! Please see our [contribution guidelines](CONTRIBUTING.md) for details on how to submit issues, feature requests, and pull requests.

## Support and Resources

- [GitHub Repository](https://github.com/servicenow/code-intelligence-mcp)
- [Documentation](https://docs.servicenow.com/code-intelligence)
- [Community Forum](https://community.servicenow.com/community?id=community_forum&sys_id=code-intelligence)
- [Issue Tracker](https://github.com/servicenow/code-intelligence-mcp/issues)

---

For more information, please refer to the other documentation files in this directory.
