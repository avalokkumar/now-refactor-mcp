# Testing Documentation

This document describes the testing approach, setup, and guidelines for the ServiceNow Code Intelligence & Refactoring MCP project.

## Overview

The project uses **Jest** as the testing framework with **ts-jest** for TypeScript support. All tests are located in the `tests/` directory, mirroring the structure of the `src/` directory.

## Test Structure

```
tests/
├── storage/
│   ├── in-memory-db.test.ts    (26 tests)
│   └── file-storage.test.ts    (24 tests)
├── server/
│   ├── mcp-server.test.ts      (22 tests)
│   └── handlers.test.ts        (17 tests)
├── parser/
│   ├── js-parser.test.ts       (27 tests)
│   └── ts-parser.test.ts       (25 tests)
├── rules/
│   ├── rule-engine.test.ts     (13 tests)
│   ├── glide-script/
│   │   └── query-rules.test.ts (5 tests)
│   └── typescript/
│       └── type-rules.test.ts  (6 tests)
├── refactor/                    (Future)
├── api/                         (Future)
├── ui/                          (Future)
└── e2e/                         (Future)
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test File

```bash
npm test -- tests/storage/in-memory-db.test.ts
```

### Test Directory

```bash
npm test -- tests/storage/
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

## Test Coverage

### Current Coverage (Phase 1, 2 & 3 & 4)

- **Storage Layer**: 50 tests
  - In-Memory Database: 26 tests
  - File Storage: 24 tests
- **Server Layer**: 39 tests
  - MCP Server: 22 tests
  - Request Handlers: 17 tests
- **Parser Layer**: 52 tests
  - JavaScript Parser: 27 tests
  - TypeScript Parser: 25 tests
- **Rules Layer**: 24 tests
  - Rule Engine: 13 tests
  - GlideScript Rules: 5 tests
  - TypeScript Rules: 6 tests
- **Refactoring Layer**: 37 tests
  - Refactoring Engine: 13 tests
  - Confidence Scoring: 8 tests
  - GlideScript Refactors: 8 tests
  - TypeScript Refactors: 8 tests
- **API Layer**: 26 tests
  - API Server: 7 tests
  - API Routes: 6 tests
  - API Controllers: 13 tests

**Total: 228 tests — ALL PASSING**

### Coverage Goals

- Unit test coverage: >80%
- Integration test coverage: >70%
- Critical paths: 100%

## Testing Patterns

### AAA Pattern

All tests follow the Arrange-Act-Assert pattern:

```typescript
test('should save and retrieve analysis result', () => {
  // Arrange
  const db = new InMemoryDatabase();
  const mockResult = createMockAnalysisResult();

  // Act
  db.saveAnalysisResult(mockResult);
  const retrieved = db.getAnalysisResult('test-1');

  // Assert
  expect(retrieved).toEqual(mockResult);
});
```

### Test Organization

Tests are organized into describe blocks:

```typescript
describe('InMemoryDatabase', () => {
  describe('Analysis Results', () => {
    test('should save and retrieve analysis result', () => {
      // ...
    });
  });

  describe('Code Templates', () => {
    test('should save and retrieve code template', () => {
      // ...
    });
  });
});
```

### Setup and Teardown

Use `beforeEach` and `afterEach` for test isolation:

```typescript
describe('FileStorage', () => {
  let storage: FileStorage;

  beforeEach(async () => {
    storage = new FileStorage(TEST_CONFIG);
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.clearAll();
    resetFileStorage();
  });

  test('should save file', async () => {
    // Test implementation
  });
});
```

## Test Categories

### Unit Tests

Test individual components in isolation.

**Location**: `tests/<module>/`

**Examples**:

- `tests/storage/in-memory-db.test.ts`
- `tests/server/mcp-server.test.ts`

**Characteristics**:

- Fast execution
- No external dependencies
- Mock external services
- Test single responsibility

### Integration Tests

Test interactions between components.

**Location**: `tests/<module>/`

**Examples**:

- `tests/server/handlers.test.ts` (tests handler integration with storage)

**Characteristics**:

- Test component interactions
- May use real dependencies
- Slower than unit tests

### End-to-End Tests

Test complete workflows from start to finish.

**Location**: `tests/e2e/`

**Examples** (Future):

- `tests/e2e/upload-analyze-refactor.test.ts`

**Characteristics**:

- Test complete user workflows
- Use real components
- Slowest tests
- Run less frequently

## Testing Guidelines

### Test Naming

Use descriptive test names that explain what is being tested:

```typescript
// Good
test('should return error when server not running', () => {});
test('should filter analysis results by language', () => {});

// Bad
test('test1', () => {});
test('works', () => {});
```

### Test Data

Create helper functions for test data:

```typescript
const createMockAnalysisResult = (id: string): AnalysisResult => ({
  metadata: {
    id,
    fileName: 'test.js',
    fileSize: 1024,
    language: 'javascript',
    analysisDate: new Date(),
    duration: 100,
  },
  issues: [],
  suggestions: [],
  stats: {
    totalIssues: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
  },
});
```

### Assertions

Use specific assertions:

```typescript
// Good
expect(result).toBe(true);
expect(array).toHaveLength(3);
expect(object).toHaveProperty('id');
expect(fn).toThrow('Error message');

// Avoid
expect(result).toBeTruthy();
expect(array.length).toBe(3);
```

### Async Testing

Always use async/await for asynchronous tests:

```typescript
test('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Error Testing

Test both success and error cases:

```typescript
test('should throw error when input is invalid', async () => {
  await expect(handler({ invalid: 'params' })).rejects.toThrow(
    'Invalid input'
  );
});
```

## Mocking

### Mock Functions

```typescript
const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });
server.registerHandler(MCPRequestType.HEALTH_CHECK, mockHandler);
```

### Mock Modules

```typescript
jest.mock('../storage', () => ({
  getDatabase: jest.fn(() => mockDatabase),
}));
```

### Spy on Methods

```typescript
const spy = jest.spyOn(server, 'handleRequest');
await server.handleRequest(request);
expect(spy).toHaveBeenCalledWith(request);
```

## Test Isolation

### Reset State

Always reset state between tests:

```typescript
afterEach(() => {
  resetDatabase();
  resetServer();
  resetFileStorage();
});
```

### Avoid Test Dependencies

Tests should not depend on each other:

```typescript
// Bad
test('create user', () => {
  user = createUser();
});

test('update user', () => {
  updateUser(user); // Depends on previous test
});

// Good
test('update user', () => {
  const user = createUser();
  updateUser(user);
});
```

## Performance Testing

### Test Timeouts

Set appropriate timeouts for slow tests:

```typescript
test('should handle large file', async () => {
  // Test implementation
}, 10000); // 10 second timeout
```

### Performance Benchmarks

```typescript
test('should complete analysis within 30 seconds', async () => {
  const startTime = Date.now();
  await analyzeCode(largeCodebase);
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(30000);
});
```

## Continuous Integration

Tests run automatically on:

- Every commit
- Pull requests
- Before deployment

### CI Configuration

Tests must pass before code can be merged:

```bash
npm run lint
npm test
npm run build
```

## Test Fixtures

Store test data in fixtures:

```
tests/
└── fixtures/
    ├── sample-code/
    │   ├── glide-script/
    │   └── typescript/
    └── expected-results/
```

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should save and retrieve"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Verbose Output

```bash
npm test -- --verbose
```

## Best Practices

1. **Write tests first** (TDD when possible)
2. **Keep tests simple** and focused
3. **Test behavior**, not implementation
4. **Use descriptive names** for tests
5. **Isolate tests** from each other
6. **Mock external dependencies**
7. **Test edge cases** and error conditions
8. **Maintain test coverage** above 80%
9. **Run tests frequently** during development
10. **Keep tests fast** (< 1s per test when possible)

## Common Patterns

### Testing Promises

```typescript
test('should resolve promise', async () => {
  await expect(asyncFunction()).resolves.toBe('success');
});

test('should reject promise', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error');
});
```

### Testing Events

```typescript
test('should emit event', (done) => {
  server.on('started', (data) => {
    expect(data.timestamp).toBeInstanceOf(Date);
    done();
  });
  server.start();
});
```

### Testing Timeouts

```typescript
test('should timeout after 30 seconds', async () => {
  jest.useFakeTimers();
  const promise = longRunningOperation();
  jest.advanceTimersByTime(30000);
  await expect(promise).rejects.toThrow('Timeout');
  jest.useRealTimers();
});
```

## Test Metrics

Track these metrics:

- Total test count
- Test pass rate
- Code coverage percentage
- Test execution time
- Flaky test count

## Future Testing Needs

### Phase 2: Code Analysis Engine

- Parser tests for JavaScript/TypeScript
- AST manipulation tests
- Rule engine tests
- Anti-pattern detection tests

### Phase 3: Refactoring Engine

- Refactoring transformation tests
- Confidence scoring tests
- Before/after code comparison tests

### Phase 4: Backend API

- API endpoint tests
- Request/response validation tests
- Authentication tests
- Rate limiting tests

### Phase 5: UI

- Component tests
- User interaction tests
- Accessibility tests

### Phase 6: Integration

- End-to-end workflow tests
- Performance tests
- Load tests
- Security tests

## Related Documentation

- [Project Structure](project-structure.md)
- [Storage Implementation](storage.md)
- [MCP Server](mcp-server.md)
