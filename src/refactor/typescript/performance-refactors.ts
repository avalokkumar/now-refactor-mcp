/**
 * TypeScript performance refactoring providers
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
 * Large loops refactoring provider
 */
export class LargeLoopsRefactoringProvider implements RefactoringProvider {
  ruleId = 'ts-large-loops';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    suggestions.push({
      id: `${this.ruleId}-functional-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Use functional programming',
      description: 'Replace nested loops with functional methods like map, filter, flatMap',
      transformations: this.generateFunctionalTransformation(context),
      confidence: ConfidenceLevel.MEDIUM,
      confidenceScore: 75,
      reasoning: 'Functional approach is often more readable and maintainable',
      impact: {
        linesChanged: 5,
        complexity: 'medium',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '10 minutes',
      },
      preview: this.generateFunctionalPreview(context),
    });

    return suggestions;
  }

  private generateFunctionalTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.endLine || violation.line + 5,
        endColumn: violation.endColumn || 0,
        originalCode: 'for loop code',
        newCode: 'functional code',
        description: 'Replace with functional approach',
      },
    ];
  }

  private generateFunctionalPreview(context: RefactoringContext): string {
    return `
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
    `.trim();
  }
}
