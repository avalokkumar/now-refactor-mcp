# Sample Code and Templates Documentation

This document describes the sample code and refactoring templates provided with the ServiceNow Code Intelligence & Refactoring MCP.

## Overview

The project includes sample code files and refactoring templates to help users understand common code issues and how to fix them. These samples can be used for:

1. Testing the code analysis and refactoring functionality
2. Learning about common code issues and best practices
3. Demonstrating the capabilities of the system
4. Training developers on code quality standards

## Sample Code

### GlideScript Samples

Located in `samples/glide-script/`, these files contain common ServiceNow server-side JavaScript patterns and issues.

#### incident-processor.js

This file demonstrates common patterns and issues when working with incidents in ServiceNow:

- Nested GlideRecord queries
- Error logging with gs.log instead of gs.error
- Hardcoded API configuration values
- Deprecated GlideAjax methods

**Key Issues:**

| Line | Issue | Rule ID |
|------|-------|---------|
| 57-73 | Nested query in getIncidentsWithProblems | glide-nested-query |
| 93 | Using gs.log for errors | glide-log-for-errors |
| 107-112 | Hardcoded API configuration | glide-hardcoded-values |
| 126 | Using deprecated getXMLWait | glide-deprecated-ajax |

#### user-utils.js

This file demonstrates common patterns and issues when working with users in ServiceNow:

- Missing query conditions
- Nested GlideRecord queries
- Error logging with gs.log instead of gs.error

**Key Issues:**

| Line | Issue | Rule ID |
|------|-------|---------|
| 10 | Missing query conditions in getAllUsers | glide-query-no-conditions |
| 76-96 | Nested query in getUsersWithGroups | glide-nested-query |
| 142 | Using gs.log for errors | glide-log-for-errors |

### TypeScript Samples

Located in `samples/typescript/`, these files contain common TypeScript patterns and issues.

#### data-service.ts

This file demonstrates common issues in Angular services:

- Missing type annotations
- Using `any` type
- Large nested loops

**Key Issues:**

| Line | Issue | Rule ID |
|------|-------|---------|
| 13-14 | Missing type annotations | ts-missing-types |
| 17 | Using any type | ts-no-any |
| 31-60 | Multiple any types in methods | ts-no-any |
| 63-77 | Large nested loops | ts-large-loops |

#### user-component.ts

This file demonstrates common issues in Angular components:

- Missing type annotations
- Using `any` type
- Unused imports
- Large nested loops

**Key Issues:**

| Line | Issue | Rule ID |
|------|-------|---------|
| 9-10 | Unused imports | ts-unused-imports |
| 20-23 | Missing type annotations | ts-missing-types |
| 26-27 | Using any type | ts-no-any |
| 30-31 | Missing type annotations | ts-missing-types |
| 131-147 | Large nested loops | ts-large-loops |

## Refactoring Templates

Located in `templates/refactoring/`, these markdown files provide guidance on how to refactor common code issues.

### glide-nested-query.md

This template provides strategies for refactoring nested GlideRecord queries:

1. Using GlideAggregate for counting
2. Using encoded queries with IN operator
3. Using GlideRecord getReference()

**Example Transformation:**

```javascript
// Before
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var gr2 = new GlideRecord('problem');
  gr2.addQuery('incident', gr1.sys_id);
  gr2.query();
  // Process gr2
}

// After
var incidentIds = [];
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  incidentIds.push(gr1.sys_id.toString());
}

var gr2 = new GlideRecord('problem');
gr2.addQuery('incident', 'IN', incidentIds.join(','));
gr2.query();
// Process gr2
```

### ts-no-any.md

This template provides strategies for refactoring TypeScript `any` types:

1. Using `unknown` type
2. Creating specific interfaces
3. Using generics
4. Using union types

**Example Transformation:**

```typescript
// Before
function processData(data: any): any {
  return data.value;
}

// After
interface DataItem {
  value: unknown;
}

function processData(data: DataItem): unknown {
  return data.value;
}
```

### functional-loops.md

This template provides strategies for refactoring nested loops using functional programming:

1. Using array methods (map, filter, reduce)
2. Using flatMap for nested arrays
3. Using reduce for accumulation
4. Using async/await with Promise.all

**Example Transformation:**

```typescript
// Before
const results = [];
for (let i = 0; i < data.length; i++) {
  for (let j = 0; j < data[i].items.length; j++) {
    results.push(processItem(data[i].items[j]));
  }
}

// After
const results = data.flatMap(item => 
  item.items.map(subItem => processItem(subItem))
);
```

## Using the Samples

### For Testing

1. Upload the sample files to the system
2. Run code analysis to detect issues
3. Generate refactoring suggestions
4. Apply refactorings and verify the results

### For Learning

1. Review the sample files to understand common issues
2. Study the refactoring templates to learn best practices
3. Compare before and after code examples

### For Demonstration

1. Use the sample files in presentations or demos
2. Show how the system detects issues
3. Demonstrate how refactorings improve code quality

## Creating Your Own Samples

You can create your own sample files to test specific issues or patterns:

1. Create a new file in the appropriate directory
2. Include comments to indicate issues
3. Add the file to this documentation

## Related Documentation

- [Rules Documentation](rules.md)
- [Refactoring Documentation](refactor.md)
- [Testing Documentation](testing.md)
