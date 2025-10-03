# Parser Documentation

This document describes the code parser implementation for JavaScript/GlideScript and TypeScript files.

## Overview

The parser module provides functionality to parse source code into Abstract Syntax Trees (AST) for analysis and transformation. It uses industry-standard parsing libraries:

- **Acorn** for JavaScript/GlideScript
- **TypeScript Compiler API** for TypeScript

## Architecture

### AST Models

All AST node types are defined in `src/parser/ast-models.ts`:

- **ASTNode**: Base interface for all nodes
- **ParseResult**: Complete parse result with metadata
- **SourceLocation**: Position information
- **Specialized nodes**: Function, Variable, Call Expression, etc.

### JavaScript Parser

The `JavaScriptParser` class provides comprehensive JavaScript parsing capabilities.

**Key Features:**

- Parse JavaScript/GlideScript code into AST
- AST traversal with visitor pattern
- Node finding utilities
- Error handling and recovery
- ServiceNow GlideScript support

### TypeScript Parser

The `TypeScriptParser` class provides TypeScript parsing using the TypeScript Compiler API.

**Key Features:**

- Parse TypeScript code with full type information
- Access to TypeScript's type system
- Find TypeScript-specific constructs (interfaces, type aliases, decorators)
- Support for generics and advanced types
- Module and import/export analysis

## Usage

### Basic Parsing

```typescript
import { getJavaScriptParser } from './parser';

const parser = getJavaScriptParser();

// Parse code
const code = 'var gr = new GlideRecord("incident");';
const result = parser.parse(code, 'myScript.js');

// Check for errors
if (result.errors.length > 0) {
  console.error('Parse errors:', result.errors);
} else {
  console.log('AST:', result.ast);
}
```

### Parse Result

```typescript
interface ParseResult {
  ast: ASTNode;              // Parsed AST
  sourceCode: string;        // Original source code
  fileName: string;          // File name
  language: 'javascript' | 'typescript';
  parseTime: number;         // Parse duration in ms
  errors: ParseError[];      // Parse errors if any
}
```

### AST Traversal

Use the visitor pattern to traverse the AST:

```typescript
parser.traverse(result.ast, {
  visitor: {
    enter: (node, parent) => {
      console.log('Entering:', node.type);
    },
    exit: (node, parent) => {
      console.log('Exiting:', node.type);
    },
  },
});
```

### Skip Node Types

```typescript
parser.traverse(result.ast, {
  visitor: {
    enter: (node) => {
      // Process node
    },
  },
  skipTypes: ['Literal', 'Identifier'], // Skip these types
});
```

### Finding Nodes

#### Find by Type

```typescript
const varDecls = parser.findNodesByType(result.ast, 'VariableDeclaration');
```

#### Find Functions

```typescript
const functions = parser.findFunctions(result.ast);
// Returns FunctionDeclaration, FunctionExpression, ArrowFunctionExpression
```

#### Find Variable Declarations

```typescript
const variables = parser.findVariableDeclarations(result.ast);
```

#### Find Call Expressions

```typescript
// Find all calls
const allCalls = parser.findCallExpressions(result.ast);

// Find specific function calls
const logCalls = parser.findCallExpressions(result.ast, 'log');
const queryCalls = parser.findCallExpressions(result.ast, 'query');
```

#### Find Loops

```typescript
const loops = parser.findLoops(result.ast);
// Returns ForStatement, WhileStatement, DoWhileStatement, ForInStatement, ForOfStatement
```

## GlideScript Support

The parser fully supports ServiceNow GlideScript code:

### GlideRecord

```typescript
const code = `
  var gr = new GlideRecord('incident');
  gr.addQuery('active', true);
  gr.query();
  while (gr.next()) {
    gs.log(gr.number);
  }
`;

const result = parser.parse(code, 'gliderecord.js');
```

### GlideAjax

```typescript
const code = `
  var ga = new GlideAjax('MyScriptInclude');
  ga.addParam('sysparm_name', 'myFunction');
  ga.getXML(callback);
`;

const result = parser.parse(code, 'glideajax.js');
```

### GlideSystem (gs)

```typescript
const code = `
  gs.log("Message");
  gs.error("Error");
  gs.addInfoMessage("Info");
`;

const result = parser.parse(code, 'gs-utils.js');
```

## TypeScript Parser Usage

### Basic TypeScript Parsing

```typescript
import { getTypeScriptParser } from './parser';

const parser = getTypeScriptParser();

// Parse TypeScript code
const code = 'const x: number = 5;';
const result = parser.parse(code, 'test.ts');

// Parse with full type information
const sourceFile = parser.parseWithTypes(code, 'test.ts');
```

### Finding TypeScript Constructs

```typescript
const code = `
  interface User {
    name: string;
    age: number;
  }
  
  class UserService {
    getUser(id: string): User {
      // ...
    }
  }
`;

const sourceFile = parser.parseWithTypes(code, 'user.ts');

// Find interfaces
const interfaces = parser.findInterfaces(sourceFile);

// Find classes
const classes = parser.findClasses(sourceFile);

// Find type aliases
const types = parser.findTypeAliases(sourceFile);

// Find imports/exports
const imports = parser.findImports(sourceFile);
const exports = parser.findExports(sourceFile);
```

## Configuration

### Default Configuration

```typescript
{
  ecmaVersion: 2020,
  sourceType: 'script',
  locations: true,
  ranges: true,
  allowHashBang: true,
  allowAwaitOutsideFunction: true,
  allowReturnOutsideFunction: true
}
```

### Custom Configuration

```typescript
const parser = new JavaScriptParser({
  ecmaVersion: 2018,
  sourceType: 'module',
});
```

## Error Handling

The parser handles syntax errors gracefully:

```typescript
const code = 'var x = ;'; // Invalid syntax
const result = parser.parse(code, 'test.js');

if (result.errors.length > 0) {
  result.errors.forEach((error) => {
    console.error(`Error at ${error.line}:${error.column}: ${error.message}`);
  });
}
```

## AST Node Types

### Common Node Types

- **Program**: Root node
- **VariableDeclaration**: var, let, const declarations
- **FunctionDeclaration**: Function definitions
- **FunctionExpression**: Function expressions
- **ArrowFunctionExpression**: Arrow functions
- **CallExpression**: Function calls
- **MemberExpression**: Property access (obj.prop)
- **Identifier**: Variable/function names
- **Literal**: String, number, boolean literals
- **IfStatement**: Conditional statements
- **ForStatement**: For loops
- **WhileStatement**: While loops
- **ReturnStatement**: Return statements
- **BlockStatement**: Code blocks

### Node Structure

Each node has:

```typescript
{
  type: string;              // Node type
  loc?: SourceLocation;      // Location in source
  range?: [number, number];  // Character range
  // ... type-specific properties
}
```

## Performance

### Parse Times

Typical parse times:
- Small files (<100 lines): <10ms
- Medium files (100-500 lines): 10-50ms
- Large files (500-1000 lines): 50-200ms

### Optimization Tips

1. **Reuse parser instance**: Use singleton pattern
2. **Skip unnecessary nodes**: Use `skipTypes` in traversal
3. **Cache parse results**: Store parsed ASTs for reuse
4. **Limit traversal depth**: Stop early when possible

## Testing

The parser includes comprehensive tests:

```bash
npm test -- tests/parser/js-parser.test.ts
```

**Test Coverage:**
- Basic parsing (5 tests)
- Error handling (3 tests)
- AST traversal (3 tests)
- Node finding (6 tests)
- GlideScript specific (3 tests)
- Configuration (2 tests)
- Complex code (3 tests)
- Singleton pattern (2 tests)

**Total: 27 tests**

## Examples

### Example 1: Find All GlideRecord Queries

```typescript
const code = `
  var gr1 = new GlideRecord('incident');
  gr1.query();
  
  var gr2 = new GlideRecord('problem');
  gr2.query();
`;

const result = parser.parse(code, 'script.js');
const queryCalls = parser.findCallExpressions(result.ast, 'query');
console.log(`Found ${queryCalls.length} query calls`);
```

### Example 2: Count Functions

```typescript
const code = `
  function test1() {}
  const test2 = function() {};
  const test3 = () => {};
`;

const result = parser.parse(code, 'functions.js');
const functions = parser.findFunctions(result.ast);
console.log(`Found ${functions.length} functions`);
```

### Example 3: Find Nested Loops

```typescript
const code = `
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      // Nested loop
    }
  }
`;

const result = parser.parse(code, 'loops.js');
const loops = parser.findLoops(result.ast);

// Check for nested loops
let hasNestedLoops = false;
parser.traverse(result.ast, {
  visitor: {
    enter: (node, parent) => {
      if (node.type.includes('Statement') && 
          parent && parent.type.includes('Statement')) {
        hasNestedLoops = true;
      }
    },
  },
});
```

## API Reference

### JavaScriptParser

#### Constructor

```typescript
constructor(config?: Partial<ParserConfig>)
```

#### Methods

**`parse(code: string, fileName: string): ParseResult`**

Parses JavaScript code into AST.

**`traverse(ast: ASTNode, options: TraversalOptions): void`**

Traverses AST with visitor pattern.

**`findNodesByType(ast: ASTNode, nodeType: string): ASTNode[]`**

Finds all nodes of a specific type.

**`findFunctions(ast: ASTNode): ASTNode[]`**

Finds all function nodes.

**`findVariableDeclarations(ast: ASTNode): ASTNode[]`**

Finds all variable declarations.

**`findCallExpressions(ast: ASTNode, calleeName?: string): ASTNode[]`**

Finds call expressions, optionally filtered by callee name.

**`findLoops(ast: ASTNode): ASTNode[]`**

Finds all loop statements.

**`getConfig(): ParserConfig`**

Returns current parser configuration.

### Singleton Functions

**`getJavaScriptParser(config?: Partial<ParserConfig>): JavaScriptParser`**

Returns the singleton parser instance.

**`resetJavaScriptParser(): void`**

Resets the parser instance (useful for testing).

## Future Enhancements

Planned improvements:

1. **Source Maps**: Generate source maps for transformations
2. **Comments**: Preserve comments in AST
3. **JSX Support**: Parse React JSX syntax
4. **Performance**: Optimize for large files
5. **Incremental Parsing**: Parse only changed portions
6. **Custom Plugins**: Allow custom AST transformations

## Related Documentation

- [Project Structure](project-structure.md)
- [Rules Engine](rules.md)
- [Refactoring Engine](refactor.md)
- [Testing](testing.md)
