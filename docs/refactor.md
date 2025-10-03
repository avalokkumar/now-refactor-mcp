# Refactoring Engine Documentation

This document describes the refactoring engine implementation for generating code improvement suggestions.

## Overview

The refactoring engine analyzes rule violations and generates actionable refactoring suggestions with confidence scores. It provides automated code transformations to fix detected issues.

## Architecture

### Refactoring Engine

The `RefactoringEngine` class manages refactoring providers and generates suggestions.

**Key Features:**

- Provider registration system
- Suggestion generation from violations
- Code transformation application
- Auto-fix identification
- Confidence-based filtering

### Refactoring Providers

Providers implement the `RefactoringProvider` interface to generate suggestions for specific rules.

```typescript
interface RefactoringProvider {
  ruleId: string;
  canRefactor(violation: RuleViolation): boolean;
  generateSuggestions(context: RefactoringContext): Promise<RefactoringSuggestion[]>;
}
```

### Confidence Scoring

The `ConfidenceScorer` calculates confidence scores (0-100) for refactoring suggestions based on:

- Syntax complexity
- Transformation count
- Code impact
- Breaking changes
- Testing requirements
- Rule-specific confidence

## Usage

### Basic Usage

```typescript
import { getRefactoringEngine } from './refactor';
import { getRuleEngine } from './rules';
import { getJavaScriptParser } from './parser';

// Parse code
const parser = getJavaScriptParser();
const code = `
  var gr1 = new GlideRecord('incident');
  gr1.query();
  while (gr1.next()) {
    var gr2 = new GlideRecord('problem');
    gr2.query();
  }
`;
const parseResult = parser.parse(code, 'script.js');

// Run rules
const ruleEngine = getRuleEngine();
const ruleResult = await ruleEngine.execute(parseResult, 'script.js');

// Generate refactoring suggestions
const refactorEngine = getRefactoringEngine();
const suggestions = await refactorEngine.generateSuggestions(
  parseResult,
  ruleResult.violations,
  'script.js'
);

console.log(`Generated ${suggestions.totalSuggestions} suggestions`);
suggestions.suggestions.forEach(s => {
  console.log(`${s.title} (confidence: ${s.confidenceScore}%)`);
});
```

### Applying Refactorings

```typescript
// Apply a suggestion
const suggestion = suggestions.suggestions[0];
const result = await refactorEngine.applyRefactoring(
  suggestion,
  code,
  'script.js'
);

if (result.success) {
  console.log('Refactored code:');
  console.log(result.refactoredCode);
} else {
  console.error('Refactoring failed:', result.error);
}
```

### Auto-fix

```typescript
// Enable auto-fix
const autoFixEngine = getRefactoringEngine({
  enableAutoFix: true,
  minConfidenceForAutoFix: 85,
});

// Get auto-fixable suggestions
const autoFixable = autoFixEngine.getAutoFixableSuggestions(
  suggestions.suggestions
);

console.log(`${autoFixable.length} suggestions can be auto-fixed`);
```

## Refactoring Types

### Replace

Replace code at a specific location:

```typescript
{
  type: RefactoringType.REPLACE,
  startLine: 1,
  startColumn: 0,
  endLine: 1,
  endColumn: 6,
  originalCode: 'gs.log',
  newCode: 'gs.error',
  description: 'Replace gs.log with gs.error'
}
```

### Insert

Insert code at a specific location:

```typescript
{
  type: RefactoringType.INSERT,
  startLine: 2,
  startColumn: 0,
  endLine: 2,
  endColumn: 0,
  originalCode: '',
  newCode: "gr.addQuery('active', true);\n",
  description: 'Add query condition'
}
```

### Delete

Remove code at a specific location:

```typescript
{
  type: RefactoringType.DELETE,
  startLine: 5,
  startColumn: 0,
  endLine: 5,
  endColumn: 50,
  originalCode: "import { unused } from 'module';",
  newCode: '',
  description: 'Remove unused import'
}
```

## Confidence Levels

### HIGH (80-100%)

- Safe to auto-apply
- Simple transformations
- No breaking changes
- Minimal testing required

**Examples:**

- Replace `gs.log` with `gs.error`
- Replace `getXMLWait()` with `getXML(callback)`
- Remove unused imports

### MEDIUM (50-79%)

- Review recommended
- Moderate complexity
- May require testing
- Context-dependent changes

**Examples:**

- Add type annotations
- Replace `any` with `unknown`
- Refactor nested loops

### LOW (0-49%)

- Manual review required
- Complex transformations
- Potential breaking changes
- Significant testing needed

**Examples:**

- Add query conditions (requires domain knowledge)
- Complex refactorings with multiple transformations

## Refactoring Suggestions

### Suggestion Structure

```typescript
interface RefactoringSuggestion {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  transformations: CodeTransformation[];
  confidence: ConfidenceLevel;
  confidenceScore: number;
  reasoning: string;
  impact: RefactoringImpact;
  preview?: string;
}
```

### Impact Assessment

```typescript
interface RefactoringImpact {
  linesChanged: number;
  complexity: 'low' | 'medium' | 'high';
  breakingChange: boolean;
  testingRequired: boolean;
  estimatedTime: string;
}
```

## Available Refactoring Providers

### GlideScript Providers

See [GlideScript Refactoring Documentation](refactor-glide-script.md)

- **NestedQueryRefactoringProvider**: Fixes nested GlideRecord queries
- **QueryConditionsRefactoringProvider**: Adds query conditions
- **DeprecatedGlideAjaxRefactoringProvider**: Converts to async patterns
- **LogToErrorRefactoringProvider**: Uses proper log levels
- **HardcodedValuesRefactoringProvider**: Moves to system properties

### TypeScript Providers

See [TypeScript Refactoring Documentation](refactor-typescript.md)

- **MissingTypeRefactoringProvider**: Adds type annotations
- **NoAnyRefactoringProvider**: Replaces `any` with specific types
- **UnusedImportsRefactoringProvider**: Removes unused imports
- **LargeLoopsRefactoringProvider**: Converts to functional style

## Configuration

### Engine Configuration

```typescript
interface RefactoringEngineConfig {
  maxSuggestionsPerViolation: number;  // Default: 3
  enableAutoFix: boolean;              // Default: false
  minConfidenceForAutoFix: number;     // Default: 80
}
```

### Custom Configuration

```typescript
const engine = new RefactoringEngine({
  maxSuggestionsPerViolation: 5,
  enableAutoFix: true,
  minConfidenceForAutoFix: 90,
});
```

## Creating Custom Providers

### Provider Template

```typescript
import {
  RefactoringProvider,
  RefactoringContext,
  RefactoringSuggestion,
  RefactoringType,
  ConfidenceLevel,
} from './refactor';

export class MyRefactoringProvider implements RefactoringProvider {
  ruleId = 'my-rule-id';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    // Analyze context and generate suggestions
    suggestions.push({
      id: `${this.ruleId}-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'My Refactoring',
      description: 'Description of what this refactoring does',
      transformations: [
        {
          type: RefactoringType.REPLACE,
          startLine: context.violation.line,
          startColumn: context.violation.column,
          endLine: context.violation.line,
          endColumn: context.violation.column + 10,
          originalCode: 'old code',
          newCode: 'new code',
          description: 'What this transformation does',
        },
      ],
      confidence: ConfidenceLevel.MEDIUM,
      confidenceScore: 70,
      reasoning: 'Why this refactoring is suggested',
      impact: {
        linesChanged: 1,
        complexity: 'low',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '5 minutes',
      },
      preview: this.generatePreview(context),
    });

    return suggestions;
  }

  private generatePreview(context: RefactoringContext): string {
    return `
// Before:
old code

// After:
new code
    `.trim();
  }
}
```

### Registering Custom Providers

```typescript
const engine = getRefactoringEngine();
engine.registerProvider(new MyRefactoringProvider());
```

## Testing

Example test for refactoring providers:

```typescript
describe('MyRefactoringProvider', () => {
  let provider: MyRefactoringProvider;
  let parser: JavaScriptParser;

  beforeEach(() => {
    provider = new MyRefactoringProvider();
    parser = getJavaScriptParser();
  });

  test('should generate suggestions', async () => {
    const code = 'test code';
    const parseResult = parser.parse(code, 'test.js');
    const violation: RuleViolation = {
      ruleId: 'my-rule-id',
      message: 'Issue detected',
      severity: IssueSeverity.MEDIUM,
      line: 1,
      column: 0,
    };

    const context: RefactoringContext = {
      parseResult,
      violation,
      fileName: 'test.js',
      sourceCode: code,
    };

    const suggestions = await provider.generateSuggestions(context);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].ruleId).toBe('my-rule-id');
  });
});
```

## Best Practices

### Suggestion Quality

1. **Clear Titles**: Use descriptive, actionable titles
2. **Detailed Descriptions**: Explain what the refactoring does
3. **Accurate Confidence**: Set realistic confidence scores
4. **Complete Previews**: Show before/after code
5. **Impact Assessment**: Accurately assess impact

### Transformation Safety

1. **Validate Transformations**: Ensure transformations are valid
2. **Handle Edge Cases**: Consider all code patterns
3. **Preserve Semantics**: Don't change code behavior
4. **Test Thoroughly**: Test with various code samples
5. **Document Limitations**: Note what the refactoring can't handle

### Performance

1. **Efficient Analysis**: Keep suggestion generation fast
2. **Limit Suggestions**: Don't overwhelm users
3. **Cache Results**: Cache expensive computations
4. **Async Operations**: Use async for I/O operations

## Integration

### With Rule Engine

```typescript
// Complete workflow
const parseResult = parser.parse(code, fileName);
const ruleResult = await ruleEngine.execute(parseResult, fileName);
const refactorResult = await refactorEngine.generateSuggestions(
  parseResult,
  ruleResult.violations,
  fileName
);
```

### With MCP Server

```typescript
// In suggestRefactor handler
const analysisResult = db.getAnalysisResult(analysisId);
const parseResult = parser.parse(analysisResult.sourceCode, fileName);
const suggestions = await refactorEngine.generateSuggestions(
  parseResult,
  analysisResult.issues,
  fileName
);

return {
  suggestions: suggestions.suggestions,
  totalSuggestions: suggestions.totalSuggestions,
};
```

## Future Enhancements

Planned improvements:

1. **Multi-file Refactoring**: Refactor across multiple files
2. **Interactive Refactoring**: Step-by-step guided refactoring
3. **Refactoring History**: Track applied refactorings
4. **Undo/Redo**: Revert refactorings
5. **Batch Apply**: Apply multiple refactorings at once
6. **AI-Assisted**: Use LLM for complex refactorings

## Related Documentation

- [GlideScript Refactoring](refactor-glide-script.md)
- [TypeScript Refactoring](refactor-typescript.md)
- [Confidence Scoring](confidence-scoring.md)
- [Rules Engine](rules.md)
- [Testing Guide](testing.md)
