# Rules Engine Documentation

This document describes the rule engine implementation for detecting code issues and anti-patterns in ServiceNow code.

## Overview

The rule engine executes a collection of rules against parsed code to identify issues, anti-patterns, and opportunities for improvement. It supports both JavaScript/GlideScript and TypeScript code.

## Architecture

### Rule Engine

The `RuleEngine` class manages rule registration, configuration, and execution.

**Key Features:**

- Rule registration and management
- Enable/disable individual rules
- Execute rules against parsed code
- Convert violations to storage format
- Performance tracking and statistics

### Rule Interface

All rules implement the `Rule` interface:

```typescript
interface Rule {
  metadata: RuleMetadata;
  check(context: RuleContext): RuleViolation[];
}
```

### Rule Categories

Rules are organized into categories:

- **Performance**: Performance-related issues
- **Best Practice**: Code quality and maintainability
- **Security**: Security vulnerabilities
- **Maintainability**: Code organization and readability
- **Deprecated**: Usage of deprecated APIs

## Usage

### Basic Usage

```typescript
import { getRuleEngine } from './rules';
import { getJavaScriptParser } from './parser';
import { NestedQueryRule } from './rules/glide-script/query-rules';

// Get rule engine instance
const engine = getRuleEngine();

// Register rules
engine.registerRule(new NestedQueryRule());

// Parse code
const parser = getJavaScriptParser();
const code = `
  var gr1 = new GlideRecord('incident');
  gr1.query();
  while (gr1.next()) {
    var gr2 = new GlideRecord('problem');
    gr2.query();  // Nested query!
  }
`;
const parseResult = parser.parse(code, 'script.js');

// Execute rules
const result = await engine.execute(parseResult, 'script.js');

console.log(`Found ${result.totalViolations} violations`);
result.violations.forEach(v => {
  console.log(`${v.ruleId}: ${v.message} at line ${v.line}`);
});
```

### Rule Configuration

```typescript
// Enable/disable rules
engine.enableRule('glide-nested-query');
engine.disableRule('glide-query-no-conditions');

// Get configuration
const config = engine.getConfig();

// Get statistics
const stats = engine.getStats();
console.log(`Total rules: ${stats.totalRules}`);
console.log(`Enabled rules: ${stats.enabledRules}`);
```

## Rule Development

### Creating a Custom Rule

```typescript
import {
  Rule,
  RuleMetadata,
  RuleContext,
  RuleViolation,
  RuleCategory,
} from './rules/models';
import { IssueSeverity } from './storage';

export class MyCustomRule implements Rule {
  metadata: RuleMetadata = {
    id: 'my-custom-rule',
    name: 'My Custom Rule',
    description: 'Detects a specific pattern',
    category: RuleCategory.BEST_PRACTICE,
    severity: IssueSeverity.MEDIUM,
    language: 'javascript',
    tags: ['custom'],
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    
    // Analyze the code
    const { parseResult, sourceCode } = context;
    
    // Find issues and create violations
    if (sourceCode.includes('badPattern')) {
      violations.push({
        ruleId: this.metadata.id,
        message: 'Bad pattern detected',
        severity: this.metadata.severity,
        line: 1,
        column: 0,
      });
    }
    
    return violations;
  }
}
```

### Rule Context

The `RuleContext` provides access to:

```typescript
interface RuleContext {
  parseResult: ParseResult;  // Parsed AST
  fileName: string;          // File name
  sourceCode: string;        // Original source code
  options?: Record<string, unknown>;  // Rule-specific options
}
```

### Rule Violations

Violations include:

```typescript
interface RuleViolation {
  ruleId: string;
  message: string;
  severity: IssueSeverity;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  node?: ASTNode;
  fix?: RuleFix;  // Optional auto-fix suggestion
}
```

## Available Rules

### GlideScript Rules

See [GlideScript Rules Documentation](rules-glide-script.md) for details on:

- Nested query detection
- Query optimization
- Deprecated API usage
- Logging best practices
- Performance patterns

### TypeScript Rules

See [TypeScript Rules Documentation](rules-typescript.md) for details on:

- Type definition requirements
- Avoiding `any` type
- Module organization
- Import/export patterns

## Rule Execution

### Execution Flow

1. **Filter Rules**: Only enabled rules for the target language are executed
2. **Execute Each Rule**: Rules run in parallel with timeout protection
3. **Collect Violations**: All violations are aggregated
4. **Convert to Issues**: Violations are converted to `CodeIssue` format
5. **Return Results**: Complete results with timing information

### Performance

- **Timeout Protection**: Each rule has a maximum execution time (default: 5 seconds)
- **Error Handling**: Rule errors don't stop execution of other rules
- **Parallel Execution**: Rules can execute concurrently (future enhancement)

### Execution Result

```typescript
interface RuleEngineResult {
  fileName: string;
  language: 'javascript' | 'typescript';
  totalViolations: number;
  violations: RuleViolation[];
  ruleResults: RuleExecutionResult[];
  totalExecutionTime: number;
  issues: CodeIssue[];  // Converted to storage format
}
```

## Configuration

### Engine Configuration

```typescript
interface RuleEngineConfig {
  rules: Map<string, RuleConfig>;
  maxExecutionTime?: number;  // milliseconds per rule
}
```

### Rule Configuration

```typescript
interface RuleConfig {
  enabled: boolean;
  severity?: IssueSeverity;  // Override default severity
  options?: Record<string, unknown>;  // Rule-specific options
}
```

## Testing

Rules should include comprehensive tests:

```typescript
describe('MyCustomRule', () => {
  let rule: MyCustomRule;
  let parser: JavaScriptParser;

  beforeEach(() => {
    rule = new MyCustomRule();
    parser = getJavaScriptParser();
  });

  test('should detect bad pattern', () => {
    const code = 'var x = badPattern();';
    const parseResult = parser.parse(code, 'test.js');
    
    const context: RuleContext = {
      parseResult,
      fileName: 'test.js',
      sourceCode: code,
    };

    const violations = rule.check(context);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('Bad pattern');
  });
});
```

## Best Practices

### Rule Development

1. **Single Responsibility**: Each rule should check for one specific issue
2. **Clear Messages**: Provide actionable error messages
3. **Performance**: Keep rules fast and efficient
4. **Testing**: Test both positive and negative cases
5. **Documentation**: Document what the rule checks and why

### Rule Naming

- Use descriptive IDs: `glide-nested-query`, `ts-no-any`
- Follow category prefixes: `glide-`, `ts-`, `security-`
- Use kebab-case for IDs

### Severity Guidelines

- **CRITICAL**: Security vulnerabilities, data loss risks
- **HIGH**: Performance issues, major anti-patterns
- **MEDIUM**: Code quality issues, deprecated APIs
- **LOW**: Style issues, minor improvements

## Integration

### With Storage

Rule violations are automatically converted to `CodeIssue` format for storage:

```typescript
const result = await engine.execute(parseResult, 'script.js');

// Save issues to database
const db = getDatabase();
const analysisResult = {
  metadata: {
    id: 'analysis-1',
    fileName: 'script.js',
    // ...
  },
  issues: result.issues,  // Already in CodeIssue format
  // ...
};
db.saveAnalysisResult(analysisResult);
```

### With MCP Server

The rule engine integrates with MCP server handlers:

```typescript
// In analyzeCode handler
const parseResult = parser.parse(code, fileName);
const ruleResult = await engine.execute(parseResult, fileName);

return {
  violations: ruleResult.totalViolations,
  issues: ruleResult.issues,
  executionTime: ruleResult.totalExecutionTime,
};
```

## Future Enhancements

Planned improvements:

1. **Auto-fix Support**: Automatic code fixes for violations
2. **Rule Composition**: Combine multiple rules
3. **Custom Severity**: Per-project severity overrides
4. **Rule Dependencies**: Rules that depend on other rules
5. **Incremental Analysis**: Only analyze changed code
6. **Rule Marketplace**: Share and discover community rules

## Related Documentation

- [GlideScript Rules](rules-glide-script.md)
- [TypeScript Rules](rules-typescript.md)
- [Parser Documentation](parser.md)
- [Testing Guide](testing.md)
