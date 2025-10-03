# Confidence Scoring Documentation

This document describes the confidence scoring system used to evaluate refactoring suggestions.

## Overview

The confidence scoring system calculates a numerical score (0-100) for each refactoring suggestion, indicating how likely the refactoring is to be correct and safe to apply.

## Confidence Levels

Confidence scores are mapped to three levels:

| Level | Score Range | Description |
|-------|-------------|-------------|
| HIGH | 80-100% | Safe to auto-apply, minimal review needed |
| MEDIUM | 50-79% | Review recommended before applying |
| LOW | 0-49% | Manual review required, use caution |

## Scoring Factors

The confidence score is calculated based on multiple factors:

### 1. Syntax Complexity (0-100)

Measures the complexity of the code transformation:

- **Simple transformations** (10 points): Single-line replacements
- **Moderate transformations** (20 points): Insertions or deletions
- **Complex transformations** (40+ points): Multi-line changes, moves, extracts

Higher complexity reduces confidence.

### 2. Transformation Count

The number of individual transformations required:

- **Single transformation** (+10 points): One simple change
- **Multiple transformations** (-15 points): More than 3 changes

More transformations reduce confidence.

### 3. Code Impact

The amount of code affected:

- **Minimal impact** (+10 points): 3 or fewer lines changed
- **Significant impact** (-10 points): More than 10 lines changed

Larger changes reduce confidence.

### 4. Breaking Changes

Whether the change might break existing code:

- **Breaking change** (-20 points): API changes, signature changes

Breaking changes significantly reduce confidence.

### 5. Testing Requirements

Whether tests should be updated:

- **Testing required** (-5 points): Changes that should be tested

Testing requirements slightly reduce confidence.

### 6. Rule-Specific Confidence

Base confidence level for each rule:

| Rule ID | Base Confidence |
|---------|----------------|
| glide-deprecated-ajax | 90% |
| glide-log-for-errors | 95% |
| ts-no-any | 85% |
| ts-unused-imports | 90% |
| glide-nested-query | 70% |
| glide-query-no-conditions | 50% |
| ts-missing-types | 60% |
| glide-hardcoded-values | 70% |
| ts-large-loops | 75% |

## Scoring Algorithm

The confidence score is calculated as follows:

```typescript
let score = factors.ruleConfidence;

// Adjust for syntax complexity (lower is better)
score -= factors.syntaxComplexity * 0.2;

// Adjust for transformation count
if (factors.transformationCount === 1) {
  score += 10;
} else if (factors.transformationCount > 3) {
  score -= 15;
}

// Adjust for code impact
if (factors.codeImpact <= 3) {
  score += 10;
} else if (factors.codeImpact > 10) {
  score -= 10;
}

// Breaking changes reduce confidence
if (factors.breakingChange) {
  score -= 20;
}

// Testing requirement slightly reduces confidence
if (factors.hasTests) {
  score -= 5;
}

// Clamp to 0-100
return Math.max(0, Math.min(100, Math.round(score)));
```

## Usage

### Calculating Confidence

```typescript
import { getConfidenceScorer } from './refactor';

const scorer = getConfidenceScorer();

// Calculate confidence for a suggestion
const updatedSuggestion = scorer.calculateConfidence(suggestion, violation);

console.log(`Confidence: ${updatedSuggestion.confidenceScore}%`);
console.log(`Level: ${updatedSuggestion.confidence}`);
console.log(`Reasoning: ${updatedSuggestion.reasoning}`);
```

### Batch Calculation

```typescript
// Calculate confidence for multiple suggestions
const updatedSuggestions = scorer.batchCalculate(suggestions, violations);
```

## Reasoning Generation

The confidence scorer generates human-readable reasoning for each score:

```typescript
private generateReasoning(factors: ConfidenceFactors, score: number): string {
  const reasons: string[] = [];

  if (factors.syntaxComplexity < 30) {
    reasons.push('Simple syntax transformation');
  } else if (factors.syntaxComplexity > 60) {
    reasons.push('Complex syntax transformation');
  }

  if (factors.transformationCount === 1) {
    reasons.push('Single transformation');
  } else if (factors.transformationCount > 3) {
    reasons.push('Multiple transformations required');
  }

  if (factors.codeImpact <= 3) {
    reasons.push('Minimal code impact');
  } else if (factors.codeImpact > 10) {
    reasons.push('Significant code changes');
  }

  if (factors.breakingChange) {
    reasons.push('Potential breaking change');
  }

  if (factors.hasTests) {
    reasons.push('Testing recommended');
  }

  if (score >= 80) {
    reasons.push('High confidence - safe to apply');
  } else if (score >= 50) {
    reasons.push('Medium confidence - review recommended');
  } else {
    reasons.push('Low confidence - manual review required');
  }

  return reasons.join('; ');
}
```

## Examples

### High Confidence Example

```typescript
// Replace gs.log with gs.error
{
  ruleId: 'glide-log-for-errors',
  transformations: [
    {
      type: 'replace',
      startLine: 1,
      startColumn: 0,
      endLine: 1,
      endColumn: 6,
      originalCode: 'gs.log',
      newCode: 'gs.error',
    }
  ],
  impact: {
    linesChanged: 1,
    complexity: 'low',
    breakingChange: false,
    testingRequired: false,
  }
}

// Confidence factors:
// - Rule confidence: 95%
// - Syntax complexity: 10 (-2%)
// - Transformation count: 1 (+10%)
// - Code impact: 1 line (+10%)
// - Breaking change: No (+0%)
// - Testing required: No (+0%)

// Final score: 95 - 2 + 10 + 10 = 113, clamped to 100
// Confidence level: HIGH
```

### Medium Confidence Example

```typescript
// Add type annotations
{
  ruleId: 'ts-missing-types',
  transformations: [
    {
      type: 'replace',
      startLine: 1,
      startColumn: 0,
      endLine: 1,
      endColumn: 20,
      originalCode: 'function test(data)',
      newCode: 'function test(data: DataType[]): string[]',
    }
  ],
  impact: {
    linesChanged: 1,
    complexity: 'medium',
    breakingChange: false,
    testingRequired: true,
  }
}

// Confidence factors:
// - Rule confidence: 60%
// - Syntax complexity: 20 (-4%)
// - Transformation count: 1 (+10%)
// - Code impact: 1 line (+10%)
// - Breaking change: No (+0%)
// - Testing required: Yes (-5%)

// Final score: 60 - 4 + 10 + 10 - 5 = 71
// Confidence level: MEDIUM
```

### Low Confidence Example

```typescript
// Complex refactoring with multiple transformations
{
  ruleId: 'glide-query-no-conditions',
  transformations: [
    { /* transformation 1 */ },
    { /* transformation 2 */ },
    { /* transformation 3 */ },
    { /* transformation 4 */ },
  ],
  impact: {
    linesChanged: 15,
    complexity: 'high',
    breakingChange: true,
    testingRequired: true,
  }
}

// Confidence factors:
// - Rule confidence: 50%
// - Syntax complexity: 60 (-12%)
// - Transformation count: 4 (-15%)
// - Code impact: 15 lines (-10%)
// - Breaking change: Yes (-20%)
// - Testing required: Yes (-5%)

// Final score: 50 - 12 - 15 - 10 - 20 - 5 = -12, clamped to 0
// Confidence level: LOW
```

## Auto-Fix Threshold

The refactoring engine uses the confidence score to determine if a suggestion can be automatically applied:

```typescript
getAutoFixableSuggestions(suggestions: RefactoringSuggestion[]): RefactoringSuggestion[] {
  if (!this.config.enableAutoFix) {
    return [];
  }

  return suggestions.filter(
    (s) => s.confidenceScore >= this.config.minConfidenceForAutoFix
  );
}
```

The default threshold is 80%, meaning only HIGH confidence suggestions are eligible for auto-fix.

## Testing

The confidence scoring system includes comprehensive tests:

```typescript
describe('ConfidenceScorer', () => {
  test('should calculate high confidence for simple transformations', () => {
    const suggestion = { /* simple replacement */ };
    const violation = { ruleId: 'glide-log-for-errors' };
    
    const result = scorer.calculateConfidence(suggestion, violation);
    
    expect(result.confidenceScore).toBeGreaterThan(80);
    expect(result.confidence).toBe(ConfidenceLevel.HIGH);
  });
  
  test('should calculate low confidence for complex transformations', () => {
    const suggestion = { /* complex transformations */ };
    const violation = { ruleId: 'glide-query-no-conditions' };
    
    const result = scorer.calculateConfidence(suggestion, violation);
    
    expect(result.confidenceScore).toBeLessThan(50);
    expect(result.confidence).toBe(ConfidenceLevel.LOW);
  });
});
```

## Best Practices

1. **Start Conservative**: Begin with lower confidence scores and adjust based on feedback
2. **Validate with Users**: Collect feedback on suggestion accuracy
3. **Tune Rule Confidence**: Adjust base confidence per rule based on real-world results
4. **Document Limitations**: Clearly communicate what factors affect confidence
5. **Regular Calibration**: Periodically review and adjust the scoring algorithm

## Related Documentation

- [Refactoring Engine](refactor.md)
- [GlideScript Refactoring](refactor-glide-script.md)
- [TypeScript Refactoring](refactor-typescript.md)
