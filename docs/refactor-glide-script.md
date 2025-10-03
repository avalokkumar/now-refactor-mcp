# GlideScript Refactoring Documentation

This document describes the GlideScript-specific refactoring providers and their usage.

## Overview

GlideScript refactoring providers generate automated code improvements for ServiceNow server-side JavaScript issues.

## Available Providers

### Nested Query Refactoring Provider

**Rule ID**: `glide-nested-query`

**Purpose**: Fixes nested GlideRecord queries that cause N+1 query problems.

**Suggestions**:

1. **Use GlideAggregate** (Confidence: MEDIUM - 65%)
   - Replaces nested queries with GlideAggregate for counting
   - Best for aggregation operations

2. **Use Encoded Query with IN** (Confidence: HIGH - 85%)
   - Collects IDs and uses single query with IN operator
   - Best for fetching related records

**Example**:

```javascript
// Before: Nested query (BAD)
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var gr2 = new GlideRecord('problem');
  gr2.addQuery('incident', gr1.sys_id);
  gr2.query();
  while (gr2.next()) {
    // Process
  }
}

// After: GlideAggregate
var ga = new GlideAggregate('problem');
ga.addAggregate('COUNT');
ga.groupBy('incident');
ga.query();
while (ga.next()) {
  var incidentId = ga.incident;
  var count = ga.getAggregate('COUNT');
}

// After: IN operator
var incidentIds = [];
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  incidentIds.push(gr1.sys_id.toString());
}

var gr2 = new GlideRecord('problem');
gr2.addQuery('incident', 'IN', incidentIds.join(','));
gr2.query();
while (gr2.next()) {
  // Process
}
```

### Query Conditions Refactoring Provider

**Rule ID**: `glide-query-no-conditions`

**Purpose**: Adds query conditions to prevent returning too many records.

**Suggestions**:

1. **Add Query Conditions** (Confidence: LOW - 40%)
   - Suggests adding addQuery() conditions
   - Requires domain knowledge

**Example**:

```javascript
// Before: No conditions
var gr = new GlideRecord('incident');
gr.query();

// After: With conditions
var gr = new GlideRecord('incident');
gr.addQuery('active', true);
gr.addQuery('priority', '<=', 3);
gr.setLimit(100);
gr.query();
```

### Deprecated GlideAjax Refactoring Provider

**Rule ID**: `glide-deprecated-ajax`

**Purpose**: Converts synchronous GlideAjax calls to asynchronous patterns.

**Suggestions**:

1. **Replace with Async getXML** (Confidence: HIGH - 90%)
   - Direct replacement of deprecated method
   - Uses callback pattern

**Example**:

```javascript
// Before: Synchronous (deprecated)
var ga = new GlideAjax('MyScriptInclude');
ga.addParam('sysparm_name', 'myFunction');
var response = ga.getXMLWait();
var answer = response.responseXML.documentElement.getAttribute('answer');
processAnswer(answer);

// After: Asynchronous
var ga = new GlideAjax('MyScriptInclude');
ga.addParam('sysparm_name', 'myFunction');
ga.getXML(function(response) {
  var answer = response.responseXML.documentElement.getAttribute('answer');
  processAnswer(answer);
});
```

### Log to Error Refactoring Provider

**Rule ID**: `glide-log-for-errors`

**Purpose**: Uses proper log levels for error messages.

**Suggestions**:

1. **Replace gs.log with gs.error** (Confidence: HIGH - 95%)
   - Simple string replacement
   - No breaking changes

**Example**:

```javascript
// Before: Wrong log level
gs.log('ERROR: Failed to process record');
gs.log('Exception occurred: ' + ex);

// After: Correct log level
gs.error('Failed to process record');
gs.error('Exception occurred: ' + ex);
```

### Hardcoded Values Refactoring Provider

**Rule ID**: `glide-hardcoded-values`

**Purpose**: Moves hardcoded values to system properties.

**Suggestions**:

1. **Replace with System Property** (Confidence: MEDIUM - 70%)
   - Moves value to system property
   - Requires creating the property

**Example**:

```javascript
// Before: Hardcoded values
var apiUrl = 'https://api.example.com';
var maxRetries = 3;
var timeout = 30000;

// After: System properties
var apiUrl = gs.getProperty('my.api.url', 'https://api.example.com');
var maxRetries = parseInt(gs.getProperty('my.max.retries', '3'));
var timeout = parseInt(gs.getProperty('my.timeout', '30000'));

// Note: Create these system properties:
// - my.api.url
// - my.max.retries
// - my.timeout
```

## Usage

### Register Providers

```typescript
import { getRefactoringEngine } from './refactor';
import {
  NestedQueryRefactoringProvider,
  QueryConditionsRefactoringProvider,
  DeprecatedGlideAjaxRefactoringProvider,
  LogToErrorRefactoringProvider,
  HardcodedValuesRefactoringProvider,
} from './refactor/glide-script';

const engine = getRefactoringEngine();

// Register all GlideScript providers
engine.registerProvider(new NestedQueryRefactoringProvider());
engine.registerProvider(new QueryConditionsRefactoringProvider());
engine.registerProvider(new DeprecatedGlideAjaxRefactoringProvider());
engine.registerProvider(new LogToErrorRefactoringProvider());
engine.registerProvider(new HardcodedValuesRefactoringProvider());
```

### Generate Suggestions

```typescript
const parseResult = parser.parse(glideScriptCode, 'script.js');
const ruleResult = await ruleEngine.execute(parseResult, 'script.js');
const suggestions = await engine.generateSuggestions(
  parseResult,
  ruleResult.violations,
  'script.js'
);
```

## Best Practices

### Query Optimization

1. **Always add conditions**: Filter at database level
2. **Use setLimit()**: Prevent large result sets
3. **Avoid nested queries**: Use joins or aggregates
4. **Select specific fields**: Use addQuery for field selection
5. **Use encoded queries**: For complex conditions

### API Usage

1. **Use async patterns**: Avoid blocking operations
2. **Handle errors**: Always include error handling
3. **Use proper log levels**: gs.error() for errors
4. **Validate inputs**: Check parameters before use
5. **Cache when possible**: Reduce repeated calls

### Performance

1. **Batch operations**: Process multiple records together
2. **Use GlideAggregate**: For counting and aggregation
3. **Monitor execution**: Track query performance
4. **Optimize queries**: Add indexes for frequent queries
5. **Test thoroughly**: Verify performance improvements

## Testing

Example test:

```typescript
describe('NestedQueryRefactoringProvider', () => {
  test('should generate GlideAggregate suggestion', async () => {
    const code = `
      var gr1 = new GlideRecord('incident');
      gr1.query();
      while (gr1.next()) {
        var gr2 = new GlideRecord('problem');
        gr2.query();
      }
    `;
    
    const parseResult = parser.parse(code, 'test.js');
    const violation = {
      ruleId: 'glide-nested-query',
      message: 'Nested query',
      severity: IssueSeverity.HIGH,
      line: 6,
      column: 10,
    };

    const context = { parseResult, violation, fileName: 'test.js', sourceCode: code };
    const suggestions = await provider.generateSuggestions(context);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].preview).toContain('GlideAggregate');
  });
});
```

## Related Documentation

- [Refactoring Engine](refactor.md)
- [GlideScript Rules](rules-glide-script.md)
- [Confidence Scoring](confidence-scoring.md)
