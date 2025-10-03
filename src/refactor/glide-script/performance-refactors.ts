/**
 * GlideScript performance refactoring providers
 * Provides refactoring suggestions for performance issues
 */

import {
  RefactoringProvider,
  RefactoringContext,
  RefactoringSuggestion,
  RefactoringType,
  ConfidenceLevel,
  CodeTransformation,
} from '../models';
import { RuleViolation } from '../../rules';

/**
 * Hardcoded values refactoring provider
 */
export class HardcodedValuesRefactoringProvider implements RefactoringProvider {
  ruleId = 'glide-hardcoded-values';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    suggestions.push({
      id: `${this.ruleId}-system-property-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Replace hardcoded value with system property',
      description: 'Move hardcoded value to a system property for better configuration management',
      transformations: this.generateSystemPropertyTransformation(context),
      confidence: ConfidenceLevel.MEDIUM,
      confidenceScore: 70,
      reasoning: 'Requires creating a new system property and updating code',
      impact: {
        linesChanged: 1,
        complexity: 'low',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '10 minutes',
      },
      preview: this.generateSystemPropertyPreview(context),
    });

    return suggestions;
  }

  private generateSystemPropertyTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.line,
        endColumn: violation.column + 50,
        originalCode: '"hardcoded value"',
        newCode: "gs.getProperty('my.property.name', 'default')",
        description: 'Replace with system property',
      },
    ];
  }

  private generateSystemPropertyPreview(context: RefactoringContext): string {
    return `
// Before: Hardcoded values
var apiUrl = 'https://api.example.com';
var maxRetries = 3;
var timeout = 30000;

// After: System properties
var apiUrl = gs.getProperty('my.api.url', 'https://api.example.com');
var maxRetries = parseInt(gs.getProperty('my.max.retries', '3'));
var timeout = parseInt(gs.getProperty('my.timeout', '30000'));

// Note: Create system properties in System Properties module:
// - my.api.url
// - my.max.retries
// - my.timeout
    `.trim();
  }
}
