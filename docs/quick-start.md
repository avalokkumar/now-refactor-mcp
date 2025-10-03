# ServiceNow Code Intelligence MCP - Quick Start Guide

This quick start guide will help you get the ServiceNow Code Intelligence MCP server up and running in minutes.

## Prerequisites

- Node.js (v16+)
- npm (v8+)

## Installation

### Clone the Repository

```bash
git clone https://github.com/servicenow/code-intelligence-mcp.git
cd code-intelligence-mcp
```

### Install Dependencies

```bash
npm install
```

## Start the Server

```bash
npm run dev
```

This will start:
- MCP Server on port 8080
- Web Interface on port 3000

## Using the Web Interface

1. Open your browser and navigate to http://localhost:3000
2. Upload a JavaScript or TypeScript file
3. Click "Analyze" to process the file
4. View the analysis results:
   - Issues tab: Shows code issues with severity levels
   - Suggestions tab: Shows refactoring suggestions

## Key Features

### Code Analysis

The analyzer detects various issues in your code:
- GlideScript API usage issues
- Query performance problems
- TypeScript type issues
- And more...

### Refactoring Suggestions

Get suggestions on how to improve your code:
- Replace deprecated API calls
- Optimize database queries
- Improve type safety
- And more...

### Code Snippets

Click "Show Code" on any issue to see the relevant code snippet with the problematic line highlighted.

## Using the API

### Analyze Code

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "function example() { var x = 1; }", "fileName": "example.js"}'
```

### Upload and Analyze

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/your/file.js"
```

### Get Code Snippet

```bash
curl "http://localhost:3000/api/code-snippet?fileName=example.js&startLine=10&endLine=20"
```

## Next Steps

For more detailed information, refer to:
- [Full Usage Guide](mcp-server-usage-guide.md)
- [API Reference](api.md)
- [Rule Documentation](rules.md)

## Troubleshooting

### Server Won't Start

If the server won't start, check if the ports are already in use:

```bash
lsof -i :3000
lsof -i :8080
```

Kill the processes if needed:

```bash
kill $(lsof -t -i:3000)
kill $(lsof -t -i:8080)
```

### No Rules Detected

Make sure you're analyzing a supported file type (JavaScript or TypeScript) and that the file contains code that matches the rule patterns.

## Support

For issues or questions, please open an issue on our [GitHub repository](https://github.com/servicenow/code-intelligence-mcp/issues).
