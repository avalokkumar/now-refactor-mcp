# Getting Started Guide

This guide will help you get started with the ServiceNow Code Intelligence & Refactoring MCP.

## Overview

The ServiceNow Code Intelligence & Refactoring MCP is a tool for analyzing and refactoring ServiceNow GlideScript and TypeScript code. It provides:

- Code analysis to detect common issues and anti-patterns
- Refactoring suggestions to improve code quality
- A web UI for interactive code analysis and refactoring
- An API for integration with other tools
- An MCP server for integration with ServiceNow Studio

## Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Git (for cloning the repository)

## Installation

### Option 1: Clone from Git

```bash
# Clone the repository
git clone https://github.com/servicenow/code-intelligence-mcp.git

# Navigate to the project directory
cd code-intelligence-mcp

# Install dependencies
npm install
```

### Option 2: Install from npm

```bash
# Install globally
npm install -g servicenow-code-intelligence-mcp

# Or install locally
npm install servicenow-code-intelligence-mcp
```

## Configuration

The application can be configured using environment variables or a configuration file.

### Environment Variables

```bash
# Server configuration
export MCP_PORT=8080
export MCP_HOST=0.0.0.0
export API_PORT=3000
export API_HOST=0.0.0.0
export CORS_ORIGIN=*

# Storage configuration
export DATA_DIR=./data
```

### Configuration File

Create a `.env` file in the project root:

```
MCP_PORT=8080
MCP_HOST=0.0.0.0
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGIN=*
DATA_DIR=./data
```

## Running the Application

### Start the Server

```bash
# Start the application
npm start

# Or start in development mode
npm run dev
```

### Access the Web UI

Open your browser and navigate to:

```
http://localhost:3000
```

### Access the API

The API is available at:

```
http://localhost:3000/api
```

### Access the MCP Server

The MCP server is available at:

```
http://localhost:8080
```

## Quick Start Guide

### Analyzing Code

1. Open the web UI at `http://localhost:3000`
2. Upload a JavaScript or TypeScript file
3. Click "Analyze Code"
4. View the analysis results

### Applying Refactorings

1. In the analysis results, click on a refactoring suggestion
2. Review the proposed changes in the code comparison view
3. Click "Apply Changes" to apply the refactoring

### Using the API

```bash
# Analyze code
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 5;",
    "fileName": "example.js",
    "language": "javascript"
  }'

# Upload and analyze a file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/file.js"

# Get analysis result
curl -X GET http://localhost:3000/api/analysis/{analysisId}
```

## Next Steps

- Read the [User Guide](user-guide.md) for detailed usage instructions
- Check out the [API Documentation](api.md) for API details
- Explore the [Sample Code](samples.md) for examples
- Read the [Developer Guide](developer-guide.md) for extending the system

## Troubleshooting

### Common Issues

#### Server Won't Start

```
Error: Address already in use
```

Solution: Change the port using environment variables:

```bash
export MCP_PORT=8081
export API_PORT=3001
npm start
```

#### Analysis Fails

```
Error: Failed to parse code
```

Solution: Check that the file is valid JavaScript or TypeScript.

#### Refactoring Fails

```
Error: Failed to apply refactoring
```

Solution: Check that the code hasn't been modified since analysis.

### Getting Help

- Check the [FAQ](faq.md) for common questions
- Open an issue on GitHub
- Contact ServiceNow support
