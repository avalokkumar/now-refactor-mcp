# TypeScript Refactoring Documentation

This document describes the TypeScript-specific refactoring providers and their usage.

## Overview

TypeScript refactoring providers generate automated code improvements for TypeScript code issues, focusing on type safety, module organization, and performance.

## Available Providers

### Missing Type Definitions Refactoring Provider

**Rule ID**: `ts-missing-types`

**Purpose**: Adds explicit type annotations to improve type safety.

**Suggestions**:

1. **Add Explicit Type Annotations** (Confidence: MEDIUM - 60%)
   - Adds type annotations to functions, parameters, and variables
   - Improves code documentation and IDE support

**Example**:

```typescript
// Before: Missing type annotations
function processData(data) {
  return data.map(item => item.value);
}

const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// After: With type annotations
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

### No Any Type Refactoring Provider

**Rule ID**: `ts-no-any`

**Purpose**: Replaces `any` type with more specific types.

**Suggestions**:

1. **Replace with unknown** (Confidence: HIGH - 85%)
   - Uses `unknown` type with type guards
   - Type-safe alternative to `any`

2. **Create Specific Interface** (Confidence: MEDIUM - 70%)
   - Defines specific interfaces for data structures
   - Best for well-defined data shapes

**Example**:

```typescript
// Before: Using any
function handleData(data: any): any {
  return data.process();
}

// After: Using unknown with type guard
function handleData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null && 'process' in data) {
    return (data as { process: () => unknown }).process();
  }
  throw new Error('Invalid data');
}

// After: Using specific interface
interface ProcessableData {
  process(): Result;
}

interface Result {
  success: boolean;
  data?: unknown;
}

function handleData(data: ProcessableData): Result {
  return data.process();
}
```

### Unused Imports Refactoring Provider

**Rule ID**: `ts-unused-imports`

**Purpose**: Removes unused import statements.

**Suggestions**:

1. **Remove Unused Imports** (Confidence: HIGH - 90%)
   - Removes import statements not used in the code
   - Improves code clarity and bundle size

**Example**:

```typescript
// Before: Unused imports
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export class MyComponent implements OnInit {
  // Only Component and OnInit are used
}

// After: Only used imports
import { Component, OnInit } from '@angular/core';

export class MyComponent implements OnInit {
  // Clean imports
}
```

### Large Loops Refactoring Provider

**Rule ID**: `ts-large-loops`

**Purpose**: Optimizes complex loops with functional programming.

**Suggestions**:

1. **Use Functional Programming** (Confidence: MEDIUM - 75%)
   - Replaces nested loops with functional methods
   - More readable and maintainable code

**Example**:

```typescript
// Before: Nested loops
const results = [];
for (let i = 0; i < data.length; i++) {
  for (let j = 0; j < data[i].items.length; j++) {
    results.push(processItem(data[i].items[j]));
  }
}

// After: Functional approach
const results = data.flatMap(item => 
  item.items.map(subItem => processItem(subItem))
);

// Or with async operations
const results = await Promise.all(
  data.flatMap(item => 
    item.items.map(subItem => processItemAsync(subItem))
  )
);
```

## Usage

### Register Providers

```typescript
import { getRefactoringEngine } from './refactor';
import {
  MissingTypeRefactoringProvider,
  NoAnyRefactoringProvider,
  UnusedImportsRefactoringProvider,
  LargeLoopsRefactoringProvider,
} from './refactor/typescript';

const engine = getRefactoringEngine();

// Register all TypeScript providers
engine.registerProvider(new MissingTypeRefactoringProvider());
engine.registerProvider(new NoAnyRefactoringProvider());
engine.registerProvider(new UnusedImportsRefactoringProvider());
engine.registerProvider(new LargeLoopsRefactoringProvider());
```

### Generate Suggestions

```typescript
const parseResult = parser.parse(typescriptCode, 'component.ts');
const ruleResult = await ruleEngine.execute(parseResult, 'component.ts');
const suggestions = await engine.generateSuggestions(
  parseResult,
  ruleResult.violations,
  'component.ts'
);
```

## Best Practices

### Type Safety

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

Example test:

```typescript
describe('NoAnyRefactoringProvider', () => {
  test('should provide unknown type suggestion', async () => {
    const code = 'function test(data: any) { }';
    const parseResult = parser.parse(code, 'test.ts');
    const violation = {
      ruleId: 'ts-no-any',
      message: 'Avoid any',
      severity: IssueSeverity.MEDIUM,
      line: 1,
      column: 20,
    };

    const context = { parseResult, violation, fileName: 'test.ts', sourceCode: code };
    const suggestions = await provider.generateSuggestions(context);
    const unknownSuggestion = suggestions.find(s => s.title.includes('unknown'));

    expect(unknownSuggestion).toBeDefined();
    expect(unknownSuggestion?.preview).toContain('unknown');
  });
});
```

## ServiceNow TypeScript Patterns

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

## Related Documentation

- [Refactoring Engine](refactor.md)
- [TypeScript Rules](rules-typescript.md)
- [Confidence Scoring](confidence-scoring.md)
