# GlideScript Rules Documentation

This document describes the GlideScript-specific rules for detecting ServiceNow code anti-patterns and issues.

## Overview

GlideScript rules target common issues in ServiceNow server-side JavaScript code, including GlideRecord queries, API usage, and performance patterns.

## Query Rules

### Nested Query Rule

**ID**: `glide-nested-query`

**Category**: Performance

**Severity**: HIGH

**Description**: Detects nested GlideRecord queries which cause N+1 query problems and severe performance degradation.

**Problem**:

```javascript
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var gr2 = new GlideRecord('problem');  // Nested query!
  gr2.addQuery('incident', gr1.sys_id);
  gr2.query();
  while (gr2.next()) {
    // Process
  }
}
```

**Solution**:

```javascript
// Use GlideAggregate or optimize with a single query
var gr = new GlideRecord('problem');
gr.addQuery('incident', 'IN', incidentIds);
gr.query();
```

**Why It Matters**:

- Nested queries cause exponential performance degradation
- Each inner query executes once per outer record
- Can cause database timeouts and system slowdowns

### Query Without Conditions Rule

**ID**: `glide-query-no-conditions`

**Category**: Performance

**Severity**: MEDIUM

**Description**: Detects GlideRecord queries without addQuery conditions that may return too many records.

**Problem**:

```javascript
var gr = new GlideRecord('incident');
gr.query();  // No conditions - returns all records!
```

**Solution**:

```javascript
var gr = new GlideRecord('incident');
gr.addQuery('active', true);
gr.addQuery('priority', '<=', 3);
gr.query();
```

**Why It Matters**:

- Queries without conditions can return thousands of records
- Causes memory issues and slow response times
- Impacts system performance for all users

## API Rules

### Deprecated GlideAjax Rule

**ID**: `glide-deprecated-ajax`

**Category**: Deprecated

**Severity**: MEDIUM

**Description**: Detects usage of deprecated GlideAjax patterns.

**Problem**:

```javascript
var ga = new GlideAjax('MyScriptInclude');
ga.addParam('sysparm_name', 'myFunction');
ga.getXMLWait();  // Deprecated synchronous call
```

**Solution**:

```javascript
var ga = new GlideAjax('MyScriptInclude');
ga.addParam('sysparm_name', 'myFunction');
ga.getXML(function(response) {
  // Async callback
  var answer = response.responseXML.documentElement.getAttribute('answer');
});
```

**Why It Matters**:

- Synchronous AJAX calls block the UI thread
- Deprecated methods may be removed in future releases
- Async patterns provide better user experience

### Log Instead of Error Rule

**ID**: `glide-log-for-errors`

**Category**: Best Practice

**Severity**: LOW

**Description**: Detects gs.log() usage for error messages instead of gs.error().

**Problem**:

```javascript
gs.log('ERROR: Failed to process record');
gs.log('Exception occurred: ' + ex);
```

**Solution**:

```javascript
gs.error('Failed to process record');
gs.error('Exception occurred: ' + ex);
```

**Why It Matters**:

- Proper log levels enable better filtering and monitoring
- Error logs are tracked separately for alerting
- Helps with troubleshooting and debugging

## Performance Rules

### Hardcoded Values Rule

**ID**: `glide-hardcoded-values`

**Category**: Maintainability

**Severity**: LOW

**Description**: Detects hardcoded values that should be system properties.

**Problem**:

```javascript
var url = 'https://myinstance.service-now.com/api';
var email = 'admin@company.com';
var maxRecords = 1000;
```

**Solution**:

```javascript
var url = gs.getProperty('my.api.url');
var email = gs.getProperty('my.admin.email');
var maxRecords = parseInt(gs.getProperty('my.max.records', '1000'));
```

**Why It Matters**:

- Hardcoded values make code difficult to maintain
- Different values needed for dev/test/prod environments
- System properties allow runtime configuration changes

## Usage

### Registering GlideScript Rules

```typescript
import { getRuleEngine } from './rules';
import {
  NestedQueryRule,
  QueryWithoutConditionsRule,
} from './rules/glide-script/query-rules';
import {
  DeprecatedGlideAjaxRule,
  LogInsteadOfErrorRule,
} from './rules/glide-script/api-rules';
import {
  HardcodedValuesRule,
} from './rules/glide-script/performance-rules';

const engine = getRuleEngine();

// Register query rules
engine.registerRule(new NestedQueryRule());
engine.registerRule(new QueryWithoutConditionsRule());

// Register API rules
engine.registerRule(new DeprecatedGlideAjaxRule());
engine.registerRule(new LogInsteadOfErrorRule());

// Register performance rules
engine.registerRule(new HardcodedValuesRule());
```

### Running Rules

```typescript
import { getJavaScriptParser } from './parser';

const parser = getJavaScriptParser();
const code = `
  var gr = new GlideRecord('incident');
  gr.query();
  while (gr.next()) {
    var gr2 = new GlideRecord('problem');
    gr2.query();
  }
`;

const parseResult = parser.parse(code, 'script.js');
const result = await engine.execute(parseResult, 'script.js');

console.log(`Found ${result.totalViolations} violations`);
```

## Rule Configuration

### Adjusting Severity

```typescript
// Override severity for specific rules
const config = engine.getConfig();
config.rules.get('glide-nested-query')!.severity = IssueSeverity.CRITICAL;
```

### Disabling Rules

```typescript
// Disable specific rules
engine.disableRule('glide-hardcoded-values');
```

## Best Practices

### GlideRecord Optimization

1. **Always use addQuery**: Filter records at the database level
2. **Limit fields**: Use `gr.addQuery()` to select only needed fields
3. **Set row limits**: Use `gr.setLimit()` to prevent large result sets
4. **Avoid nested queries**: Use joins or aggregate queries instead
5. **Use encoded queries**: For complex conditions, use encoded queries

### API Usage

1. **Use async patterns**: Avoid synchronous AJAX calls
2. **Check API versions**: Use current API methods
3. **Handle errors**: Always include error handling
4. **Use proper log levels**: gs.error() for errors, gs.log() for info
5. **Validate inputs**: Check parameters before using them

### Performance

1. **Cache system properties**: Don't call gs.getProperty() repeatedly
2. **Batch operations**: Process multiple records in one transaction
3. **Use GlideAggregate**: For counting and aggregation
4. **Optimize queries**: Add indexes for frequently queried fields
5. **Monitor execution time**: Use gs.debug() to track performance

## Testing

Example test for GlideScript rules:

```typescript
describe('NestedQueryRule', () => {
  let rule: NestedQueryRule;
  let parser: JavaScriptParser;

  beforeEach(() => {
    rule = new NestedQueryRule();
    parser = getJavaScriptParser();
  });

  test('should detect nested GlideRecord query', () => {
    const code = `
      var gr1 = new GlideRecord('incident');
      gr1.query();
      while (gr1.next()) {
        var gr2 = new GlideRecord('problem');
        gr2.query();
      }
    `;
    
    const parseResult = parser.parse(code, 'test.js');
    const context = {
      parseResult,
      fileName: 'test.js',
      sourceCode: code,
    };

    const violations = rule.check(context);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('glide-nested-query');
  });
});
```

## Future Rules

Planned GlideScript rules:

1. **GlideRecord in Loops**: Detect GlideRecord instantiation inside loops
2. **Missing setLimit**: Warn when queries don't have row limits
3. **Synchronous Operations**: Detect blocking operations
4. **Script Include Best Practices**: Check for proper structure
5. **Business Rule Optimization**: Detect inefficient business rules
6. **Client-Server Separation**: Warn about server-side code in client scripts

## Related Documentation

- [Rules Engine](rules.md)
- [TypeScript Rules](rules-typescript.md)
- [Parser Documentation](parser.md)
- [ServiceNow Best Practices](https://docs.servicenow.com/)
