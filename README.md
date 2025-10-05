# GlideScript & Typescript Code Intelligence & Refactoring MCP

A Model Context Protocol (MCP) server that provides real-time code intelligence and refactoring suggestions for ServiceNow developers working with GlideScript (Server-side JS) and TypeScript (UI/Now Experience components).

## Features

- **Code Analysis Engine**: Parse and analyze GlideScript and TypeScript files
- **Anti-Pattern Detection**: Identify common code smells and ServiceNow-specific anti-patterns
- **Refactoring Suggestions**: Generate before/after code snippets with explanations
- **Performance Analysis**: Detect performance bottlenecks like nested queries and inefficient loops
- **Simple UI**: Web interface for code upload and results visualization
- **REST API**: Backend endpoints for code analysis and refactoring

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Start development server
npm run dev

# Build project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
now-refactor-mcp/
├── src/                    # Source code
│   ├── storage/           # Storage implementations (in-memory, file-based)
│   ├── parser/            # Code parsers for JS/TS
│   ├── rules/             # Rule engine and anti-pattern detectors
│   ├── refactor/          # Refactoring engine
│   ├── api/               # REST API
│   ├── server/            # MCP server
│   └── ui/                # Web UI components
├── tests/                 # Test files
├── docs/                  # Documentation
├── samples/               # Sample code for testing
└── templates/             # Refactoring templates
```

## Documentation

### Guides

- [Getting Started Guide](docs/getting-started.md) - Quick start guide for new users
- [User Guide](docs/user-guide.md) - Detailed usage instructions
- [Developer Guide](docs/developer-guide.md) - Guide for extending the system

### Architecture

- [Project Structure](docs/project-structure.md) - Overview of project organization
- [Integration](docs/integration.md) - Integration approach and architecture

### Components

- [Storage Implementation](docs/storage.md) - Storage layer documentation
- [MCP Server](docs/mcp-server.md) - MCP server documentation
- [API Documentation](docs/api.md) - REST API documentation
- [UI Documentation](docs/ui.md) - Web UI documentation

### Technical Documentation

- [Rules Documentation](docs/rules.md) - Rule engine documentation
- [Refactoring Documentation](docs/refactor.md) - Refactoring engine documentation
- [Parser Documentation](docs/parser.md) - Parser documentation
- [Testing Documentation](docs/testing.md) - Testing approach and guidelines

### Resources

- [Sample Code](docs/samples.md) - Sample code and templates

## Testing

The project includes comprehensive testing:

- Unit tests for core components
- Integration tests for API endpoints
- End-to-end tests for complete workflows

## Contributing

See the implementation plan in `planning/code-intelligence-mcp/` for detailed development guidelines.

## License

MIT
