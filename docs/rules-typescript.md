# TypeScript Rules Documentation

This document describes the TypeScript-specific rules for detecting code quality issues and anti-patterns in ServiceNow TypeScript code.

## Overview

TypeScript rules focus on type safety, module organization, and TypeScript-specific best practices for ServiceNow UI components and services.

## Type Rules

### Missing Type Definitions Rule

**ID**: `ts-missing-types`

**Category**: Best Practice

**Severity**: MEDIUM

**Description**: Detects functions and variables without explicit type definitions.

**Problem**:

```typescript
function processData(data) {  // Missing parameter type
  return data.map(item => item.value);  // Missing return type
}

const config = {  // Missing type annotation
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
```

**Solution**:

```typescript
interface DataItem {
  value: string;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}

interface Config {
  apiUrl: string;
  timeout: number;
}

const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
```

**Why It Matters**:

- Type annotations catch errors at compile time
- Improves code documentation and readability
- Enables better IDE support and autocomplete
- Prevents runtime type errors

### No Any Type Rule

**ID**: `ts-no-any`

**Category**: Best Practice

**Severity**: MEDIUM

**Description**: Detects usage of the `any` type which bypasses TypeScript's type checking.

**Problem**:

```typescript
function handleData(data: any): any {
  return data.process();
}

const items: any[] = [];
```

**Solution**:

```typescript
interface ProcessableData {
  process(): Result;
}

function handleData(data: ProcessableData): Result {
  return data.process();
}

const items: DataItem[] = [];

// Or use unknown for truly unknown types
function handleUnknown(data: unknown): void {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}
```

**Why It Matters**:

- `any` defeats the purpose of TypeScript
- Loses type safety and IDE support
- Can hide bugs that would be caught by the compiler
- Use `unknown` for truly unknown types

## Module Rules

### Unused Imports Rule

**ID**: `ts-unused-imports`

**Category**: Maintainability

**Severity**: LOW

**Description**: Detects unused import statements that should be removed.

**Problem**:

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Only Component and OnInit are used
export class MyComponent implements OnInit {
  // ...
}
```

**Solution**:

```typescript
import { Component, OnInit } from '@angular/core';

export class MyComponent implements OnInit {
  // ...
}
```

**Why It Matters**:

- Reduces bundle size
- Improves code clarity
- Faster compilation times
- Easier to maintain

## Performance Rules

### Large Loops Rule

**ID**: `ts-large-loops`

**Category**: Performance

**Severity**: MEDIUM

**Description**: Detects large loops that may need optimization.

**Problem**:

```typescript
const results = [];
for (let i = 0; i < data.length; i++) {
  for (let j = 0; j < data[i].items.length; j++) {
    results.push(processItem(data[i].items[j]));
  }
}
```

**Solution**:

```typescript
// Use functional programming
const results = data.flatMap(item => 
  item.items.map(subItem => processItem(subItem))
);

// Or use async/await for I/O operations
const results = await Promise.all(
  data.flatMap(item => 
    item.items.map(subItem => processItemAsync(subItem))
  )
);
```

**Why It Matters**:

- Nested loops can cause performance issues
- Functional approaches are often more readable
- Async operations prevent blocking

## ServiceNow-Specific TypeScript Patterns

### Component Type Safety

```typescript
// Good: Strongly typed component
interface ComponentProps {
  title: string;
  data: DataItem[];
  onUpdate: (item: DataItem) => void;
}

export class MyComponent {
  constructor(private props: ComponentProps) {}
  
  handleUpdate(item: DataItem): void {
    this.props.onUpdate(item);
  }
}
```

### Service Type Safety

```typescript
// Good: Typed service methods
interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

class UserServiceImpl implements UserService {
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async deleteUser(id: string): Promise<void> {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  }
}
```

### State Management Types

```typescript
// Good: Typed state
interface AppState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
```

## Usage

### Registering TypeScript Rules

```typescript
import { getRuleEngine } from './rules';
import {
  MissingTypeDefinitionsRule,
  NoAnyTypeRule,
} from './rules/typescript/type-rules';
import {
  UnusedImportsRule,
} from './rules/typescript/module-rules';
import {
  LargeLoopsRule,
} from './rules/typescript/performance-rules';

const engine = getRuleEngine();

// Register type rules
engine.registerRule(new MissingTypeDefinitionsRule());
engine.registerRule(new NoAnyTypeRule());

// Register module rules
engine.registerRule(new UnusedImportsRule());

// Register performance rules
engine.registerRule(new LargeLoopsRule());
```

### Running Rules

```typescript
import { getTypeScriptParser } from './parser';

const parser = getTypeScriptParser();
const code = `
  function process(data: any) {
    return data.value;
  }
`;

const parseResult = parser.parse(code, 'component.ts');
const result = await engine.execute(parseResult, 'component.ts');

console.log(`Found ${result.totalViolations} violations`);
```

## Best Practices

### Type Definitions

1. **Always specify types**: Don't rely on type inference for public APIs
2. **Use interfaces**: For object shapes and contracts
3. **Use type aliases**: For union types and complex types
4. **Avoid any**: Use `unknown` or specific types
5. **Use generics**: For reusable, type-safe code

### Module Organization

1. **One component per file**: Keep files focused
2. **Barrel exports**: Use index.ts for clean imports
3. **Dependency injection**: Use interfaces for dependencies
4. **Avoid circular dependencies**: Structure imports carefully
5. **Group related code**: Keep related files together

### Performance

1. **Lazy loading**: Load modules on demand
2. **Tree shaking**: Export only what's needed
3. **Avoid large bundles**: Split code into chunks
4. **Optimize loops**: Use functional programming
5. **Async operations**: Don't block the main thread

## Testing

Example test for TypeScript rules:

```typescript
describe('NoAnyTypeRule', () => {
  let rule: NoAnyTypeRule;
  let parser: TypeScriptParser;

  beforeEach(() => {
    rule = new NoAnyTypeRule();
    parser = getTypeScriptParser();
  });

  test('should detect any type usage', () => {
    const code = 'function test(data: any): any { return data; }';
    
    const parseResult = parser.parse(code, 'test.ts');
    const context = {
      parseResult,
      fileName: 'test.ts',
      sourceCode: code,
    };

    const violations = rule.check(context);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('any');
  });

  test('should not flag proper types', () => {
    const code = 'function test(data: string): number { return data.length; }';
    
    const parseResult = parser.parse(code, 'test.ts');
    const context = {
      parseResult,
      fileName: 'test.ts',
      sourceCode: code,
    };

    const violations = rule.check(context);
    expect(violations).toHaveLength(0);
  });
});
```

## Future Rules

Planned TypeScript rules:

1. **Strict Null Checks**: Enforce null safety
2. **No Implicit Any**: Detect implicit any types
3. **Consistent Type Imports**: Use `import type` for types
4. **No Non-Null Assertion**: Avoid `!` operator
5. **Prefer Readonly**: Use readonly for immutable data
6. **No Empty Interfaces**: Detect empty interface definitions

## Related Documentation

- [Rules Engine](rules.md)
- [GlideScript Rules](rules-glide-script.md)
- [Parser Documentation](parser.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
