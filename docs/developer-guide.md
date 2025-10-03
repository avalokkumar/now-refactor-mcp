# Developer Guide

This guide provides information for developers who want to extend or contribute to the ServiceNow Code Intelligence & Refactoring MCP.

## Table of Contents

- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Extending the System](#extending-the-system)
- [Testing](#testing)
- [Contributing](#contributing)

## Architecture

The system is built with a modular architecture consisting of several key components:

```
┌─────────────────────────────────────────┐
│                                         │
│              Web UI                     │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│                                         │
│              REST API                   │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│                                         │
│              MCP Server                 │
│                                         │
└────────┬────────────────────┬───────────┘
         │                    │
         ▼                    ▼
┌────────────────┐    ┌────────────────────┐
│                │    │                    │
│  Rule Engine   │    │ Refactoring Engine │
│                │    │                    │
└────────┬───────┘    └─────────┬──────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│                                         │
│              Parser                     │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│                                         │
│              Storage                    │
│                                         │
└─────────────────────────────────────────┘
```

### Key Components

1. **Web UI**: User interface for code analysis and refactoring
2. **REST API**: HTTP API for integration with external tools
3. **MCP Server**: Model Context Protocol server for ServiceNow Studio integration
4. **Rule Engine**: Analyzes code for issues and violations
5. **Refactoring Engine**: Generates and applies refactoring suggestions
6. **Parser**: Parses code into abstract syntax trees (ASTs)
7. **Storage**: Stores analysis results and files

## Development Setup

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Git

### Setup Steps

1. Clone the repository:

```bash
git clone https://github.com/servicenow/code-intelligence-mcp.git
cd code-intelligence-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Run tests:

```bash
npm test
```

5. Start the development server:

```bash
npm run dev
```

### Development Tools

- **TypeScript**: Type-safe JavaScript
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Project Structure

```
code-intelligence-mcp/
├── dist/                 # Compiled output
├── docs/                 # Documentation
├── samples/              # Sample code
│   ├── glide-script/     # GlideScript samples
│   └── typescript/       # TypeScript samples
├── src/                  # Source code
│   ├── api/              # REST API
│   ├── parser/           # Code parsers
│   ├── refactor/         # Refactoring engine
│   ├── rules/            # Rule engine
│   ├── server/           # MCP server
│   ├── storage/          # Storage layer
│   ├── ui/               # Web UI
│   └── index.ts          # Main entry point
├── templates/            # Refactoring templates
├── tests/                # Tests
│   ├── api/              # API tests
│   ├── e2e/              # End-to-end tests
│   ├── parser/           # Parser tests
│   ├── refactor/         # Refactoring tests
│   ├── rules/            # Rule tests
│   ├── server/           # Server tests
│   ├── storage/          # Storage tests
│   └── ui/               # UI tests
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── jest.config.js        # Jest configuration
├── package.json          # npm package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project README
```

## Core Components

### Parser

The parser converts source code into an abstract syntax tree (AST) that can be analyzed by the rule engine.

```typescript
import { parse } from '../parser';

const code = 'var x = 5;';
const ast = parse(code, 'example.js');
```

### Rule Engine

The rule engine analyzes code for issues and violations.

```typescript
import { getRuleEngine } from '../rules';

const ruleEngine = getRuleEngine();
const violations = await ruleEngine.execute(ast, 'example.js');
```

### Refactoring Engine

The refactoring engine generates and applies refactoring suggestions.

```typescript
import { getRefactoringEngine } from '../refactor';

const refactoringEngine = getRefactoringEngine();
const suggestions = await refactoringEngine.generateSuggestions(violations, ast, code);
const refactoredCode = await refactoringEngine.applyRefactoring(suggestionId, code);
```

### Storage

The storage layer manages persistence of analysis results and files.

```typescript
import { getDatabase } from '../storage';

const db = getDatabase();
await db.saveAnalysisResult(analysisResult);
const result = await db.getAnalysisResult(analysisId);
```

### MCP Server

The MCP server provides a Model Context Protocol interface for integration with ServiceNow Studio.

```typescript
import { getMCPServer } from '../server/mcp-server';

const mcpServer = getMCPServer({ port: 8080 });
mcpServer.registerHandler('analyzeCode', analyzeCodeHandler);
await mcpServer.start();
```

### API Server

The API server provides an HTTP API for integration with external tools.

```typescript
import { getAPIServer } from '../api/server';

const apiServer = getAPIServer({ port: 3000 });
await apiServer.start();
```

## Extending the System

### Adding a New Rule

1. Create a new rule class in `src/rules/`:

```typescript
// src/rules/my-custom-rule.ts
import { Rule, RuleContext, RuleViolation } from './types';

export class MyCustomRule implements Rule {
  id = 'my-custom-rule';
  description = 'My custom rule description';
  severity = 'medium';
  
  execute(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { ast, fileName } = context;
    
    // Analyze AST and add violations
    
    return violations;
  }
}
```

2. Register the rule in `src/rules/index.ts`:

```typescript
import { MyCustomRule } from './my-custom-rule';

// Add to rules array
rules.push(new MyCustomRule());
```

### Adding a New Refactoring Provider

1. Create a new refactoring provider in `src/refactor/`:

```typescript
// src/refactor/my-custom-refactoring-provider.ts
import { RefactoringProvider, RefactoringContext, RefactoringSuggestion } from './types';

export class MyCustomRefactoringProvider implements RefactoringProvider {
  ruleId = 'my-custom-rule';
  
  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }
  
  async generateSuggestions(context: RefactoringContext): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];
    const { violation, ast, code } = context;
    
    // Generate suggestions
    
    return suggestions;
  }
}
```

2. Register the provider in `src/refactor/index.ts`:

```typescript
import { MyCustomRefactoringProvider } from './my-custom-refactoring-provider';

// Add to providers array
providers.push(new MyCustomRefactoringProvider());
```

### Adding a New API Endpoint

1. Create a new controller in `src/api/controllers.ts`:

```typescript
export async function myCustomEndpoint(req: Request, res: Response) {
  try {
    // Handle request
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
```

2. Add the route in `src/api/routes.ts`:

```typescript
router.post('/my-custom-endpoint', myCustomEndpoint);
```

### Adding a New UI Component

1. Create a new component in `src/ui/components/`:

```javascript
// src/ui/components/my-component.js
const MyComponent = (function() {
  // Private variables
  let container = null;
  
  // DOM creation
  function createDOM() {
    const template = `
      <div class="my-component">
        <h2>My Component</h2>
        <button id="my-button">Click Me</button>
      </div>
    `;
    
    container.innerHTML = template;
    
    // Initialize event listeners
    const button = container.querySelector('#my-button');
    button.addEventListener('click', handleClick);
  }
  
  // Event handlers
  function handleClick() {
    console.log('Button clicked');
  }
  
  // Public API
  return {
    init: function(options) {
      container = options.container;
      createDOM();
      return this;
    }
  };
})();

// Export for global use
window.MyComponent = MyComponent;
```

2. Add the component to `src/ui/index.html`:

```html
<script src="components/my-component.js"></script>
```

3. Initialize the component in `src/ui/app.js`:

```javascript
if (window.MyComponent) {
  window.MyComponent.init({
    container: document.getElementById('my-component-container')
  });
}
```

## Testing

### Unit Tests

Unit tests are located in the `tests/` directory and are organized by component.

```bash
# Run all tests
npm test

# Run specific tests
npm test -- tests/rules/
npm test -- tests/refactor/
npm test -- tests/api/
```

### Writing Tests

1. Create a test file with the `.test.ts` extension:

```typescript
// tests/rules/my-custom-rule.test.ts
import { MyCustomRule } from '../../src/rules/my-custom-rule';
import { parse } from '../../src/parser';

describe('MyCustomRule', () => {
  const rule = new MyCustomRule();
  
  test('should detect violations', () => {
    const code = 'var x = 5;';
    const ast = parse(code, 'example.js');
    const context = { ast, fileName: 'example.js', code };
    
    const violations = rule.execute(context);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('my-custom-rule');
  });
  
  test('should not detect violations in valid code', () => {
    const code = 'const x = 5;';
    const ast = parse(code, 'example.js');
    const context = { ast, fileName: 'example.js', code };
    
    const violations = rule.execute(context);
    
    expect(violations).toHaveLength(0);
  });
});
```

2. Run the tests:

```bash
npm test -- tests/rules/my-custom-rule.test.ts
```

### End-to-End Tests

End-to-end tests are located in the `tests/e2e/` directory and test the complete workflow.

```bash
# Run end-to-end tests
npm test -- tests/e2e/
```

## Contributing

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for your changes
5. Run the tests
6. Submit a pull request

### Code Style

The project uses ESLint and Prettier for code style. You can run the linter with:

```bash
npm run lint
```

And format the code with:

```bash
npm run format
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add new rule for detecting unused variables
fix: resolve issue with nested query detection
docs: update API documentation
test: add tests for refactoring engine
```

### Pull Requests

When submitting a pull request, please:

1. Reference any related issues
2. Provide a clear description of the changes
3. Include tests for new functionality
4. Update documentation as needed
5. Ensure all tests pass

### Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a new release tag
4. Publish to npm

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ESLint Documentation](https://eslint.org/docs/user-guide/)
- [Prettier Documentation](https://prettier.io/docs/en/)
