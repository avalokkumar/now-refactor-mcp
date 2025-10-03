# Project Structure

This document describes the organization and structure of the ServiceNow Code Intelligence & Refactoring MCP project.

## Directory Layout

```
now-refactor-mcp/
├── .windsurf/              # Windsurf IDE configuration
│   └── workflows/          # Development workflows
├── docs/                   # Project documentation
│   ├── requirement.md      # Project requirements
│   ├── project-structure.md # This file
│   ├── storage.md          # Storage implementation docs
│   ├── mcp-server.md       # MCP server documentation
│   └── ...                 # Additional documentation
├── planning/               # Feature planning and implementation plans
│   └── code-intelligence-mcp/
│       ├── feature.md      # Feature specification
│       ├── brainstorming.md # Design decisions and notes
│       └── implementation_plan.md # Detailed implementation plan
├── src/                    # Source code
│   ├── storage/           # Storage layer (in-memory DB, file storage)
│   ├── parser/            # Code parsers (JavaScript, TypeScript)
│   ├── rules/             # Rule engine and anti-pattern detectors
│   ├── refactor/          # Refactoring engine and suggestions
│   ├── api/               # REST API endpoints and controllers
│   ├── server/            # MCP server implementation
│   ├── ui/                # Web UI components
│   └── index.ts           # Main application entry point
├── tests/                  # Test files (mirrors src structure)
│   ├── storage/
│   ├── parser/
│   ├── rules/
│   ├── refactor/
│   ├── api/
│   ├── server/
│   ├── ui/
│   └── e2e/               # End-to-end tests
├── samples/                # Sample code for testing and demonstration
│   ├── glide-script/      # Sample GlideScript files
│   └── typescript/        # Sample TypeScript files
├── templates/              # Code templates
│   └── refactoring/       # Refactoring templates
├── package.json            # Project configuration and dependencies
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest testing configuration
├── .eslintrc.js            # ESLint configuration
├── .prettierrc.js          # Prettier configuration
├── .gitignore              # Git ignore rules
└── README.md               # Project overview and getting started
```

## Module Organization

### Storage Layer (`src/storage/`)
Handles all data persistence needs:
- **In-memory database**: Stores analysis results and templates during runtime
- **File storage**: Manages temporary code uploads and file-based persistence
- **Models**: Data models for analysis results, templates, and configurations

### Parser Layer (`src/parser/`)
Code parsing and AST generation:
- **JavaScript/GlideScript parser**: Uses Acorn for parsing ServiceNow server-side code
- **TypeScript parser**: Uses TypeScript Compiler API for UI/component code
- **AST utilities**: Helper functions for working with abstract syntax trees

### Rules Engine (`src/rules/`)
Detection of code issues and anti-patterns:
- **Rule engine**: Core engine for running rules against parsed code
- **GlideScript rules**: ServiceNow-specific rules for server-side code
- **TypeScript rules**: Rules for UI components and client code
- **Rule definitions**: Declarative rule specifications

### Refactoring Engine (`src/refactor/`)
Generation of code improvements:
- **Refactoring engine**: Core engine for generating suggestions
- **Language-specific refactorings**: GlideScript and TypeScript refactorings
- **Confidence scoring**: Algorithms for scoring suggestion confidence
- **Code transformations**: AST transformation utilities

### API Layer (`src/api/`)
REST API for external interactions:
- **Server**: Express server setup
- **Routes**: API endpoint definitions
- **Controllers**: Request handlers and business logic
- **Middleware**: Authentication, validation, file upload handling
- **Services**: Business logic services

### MCP Server (`src/server/`)
Model Context Protocol implementation:
- **MCP server**: Core MCP protocol handler
- **Request handlers**: Handlers for MCP requests
- **LLM integration**: Communication with language models

### UI (`src/ui/`)
Web user interface:
- **HTML/CSS/JS**: Simple web interface components
- **File upload**: Code upload interface
- **Results display**: Analysis results visualization
- **Code comparison**: Side-by-side before/after views
- **Report generation**: Downloadable reports

## Coding Standards

### TypeScript
- Use strict mode with all type checking enabled
- Explicit return types for all exported functions
- Prefer interfaces over type aliases for object shapes
- Use PascalCase for component names
- Use camelCase for variables and functions

### File Organization
- One main export per file
- Group related functionality in directories
- Use `index.ts` for module exports
- Keep files focused and under 300 lines

### Testing
- Mirror source structure in tests directory
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Aim for >80% code coverage

### Documentation
- Add JSDoc comments for all exported functions and classes
- Include examples in documentation
- Keep documentation up-to-date with code changes

## Build and Deployment

### Development
```bash
npm run dev        # Start development server with hot reload
npm run test:watch # Run tests in watch mode
```

### Production
```bash
npm run build      # Compile TypeScript to JavaScript
npm start          # Run production build
```

### Quality Checks
```bash
npm run lint       # Check code quality
npm run format     # Format code
npm test           # Run all tests
npm run test:coverage # Generate coverage report
```

## Configuration Files

- **package.json**: Defines dependencies, scripts, and project metadata
- **tsconfig.json**: TypeScript compiler options
- **jest.config.js**: Test runner configuration
- **.eslintrc.js**: Code linting rules
- **.prettierrc.js**: Code formatting rules
- **.gitignore**: Files to exclude from version control

## Environment Variables

Store sensitive configuration in `.env` files (not committed to version control):

```
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

## Dependencies

### Core Dependencies
- **acorn**: JavaScript parser for GlideScript
- **typescript**: TypeScript compiler and language support
- **express**: Web server framework
- **multer**: File upload handling

### Development Dependencies
- **jest**: Testing framework
- **ts-jest**: TypeScript support for Jest
- **eslint**: Code linting
- **prettier**: Code formatting
- **ts-node**: TypeScript execution for development

## Next Steps

1. Implement storage layer (Phase 1)
2. Build code analysis engine (Phase 2)
3. Create refactoring engine (Phase 3)
4. Develop REST API (Phase 4)
5. Build UI components (Phase 5)
6. Integration and testing (Phase 6)

Refer to `planning/code-intelligence-mcp/implementation_plan.md` for detailed implementation steps.
