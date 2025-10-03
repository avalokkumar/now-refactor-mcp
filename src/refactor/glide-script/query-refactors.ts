/**
 * GlideScript query refactoring providers
 * Provides refactoring suggestions for GlideRecord query issues
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
 * Nested query refactoring provider
 * Suggests alternatives to nested GlideRecord queries
 */
export class NestedQueryRefactoringProvider implements RefactoringProvider {
  ruleId = 'glide-nested-query';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    // Suggestion 1: Use GlideAggregate
    suggestions.push({
      id: `${this.ruleId}-aggregate-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Use GlideAggregate for counting',
      description: 'Replace nested query with GlideAggregate to count related records',
      transformations: this.generateAggregateTransformation(context),
      confidence: ConfidenceLevel.MEDIUM,
      confidenceScore: 65,
      reasoning: 'GlideAggregate is more efficient for counting operations',
      impact: {
        linesChanged: 5,
        complexity: 'medium',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '10 minutes',
      },
      preview: this.generateAggregatePreview(context),
    });

    // Suggestion 2: Use encoded query with IN operator
    suggestions.push({
      id: `${this.ruleId}-encoded-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Use encoded query with IN operator',
      description: 'Collect IDs and use a single query with IN operator',
      transformations: this.generateEncodedQueryTransformation(context),
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 85,
      reasoning: 'Single query with IN operator is more efficient than nested queries',
      impact: {
        linesChanged: 8,
        complexity: 'medium',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '15 minutes',
      },
      preview: this.generateEncodedQueryPreview(context),
    });

    return suggestions;
  }

  private generateAggregateTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.endLine || violation.line,
        endColumn: violation.endColumn || violation.column + 50,
        originalCode: 'nested query code',
        newCode: '// Use GlideAggregate here',
        description: 'Replace with GlideAggregate',
      },
    ];
  }

  private generateAggregatePreview(context: RefactoringContext): string {
    return `
// Before: Nested query
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var count = 0;
  var gr2 = new GlideRecord('problem');
  gr2.addQuery('incident', gr1.sys_id);
  gr2.query();
  count = gr2.getRowCount();
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
    `.trim();
  }

  private generateEncodedQueryTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.endLine || violation.line,
        endColumn: violation.endColumn || violation.column + 50,
        originalCode: 'nested query code',
        newCode: '// Use IN operator here',
        description: 'Replace with IN operator query',
      },
    ];
  }

  private generateEncodedQueryPreview(context: RefactoringContext): string {
    return `
// Before: Nested query
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var gr2 = new GlideRecord('problem');
  gr2.addQuery('incident', gr1.sys_id);
  gr2.query();
  // Process gr2
}

// After: Collect IDs and use IN
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
  // Process gr2
}
    `.trim();
  }
}

/**
 * Query without conditions refactoring provider
 */
export class QueryConditionsRefactoringProvider implements RefactoringProvider {
  ruleId = 'glide-query-no-conditions';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    suggestions.push({
      id: `${this.ruleId}-add-conditions-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Add query conditions',
      description: 'Add addQuery() conditions before calling query()',
      transformations: this.generateAddConditionsTransformation(context),
      confidence: ConfidenceLevel.LOW,
      confidenceScore: 40,
      reasoning: 'Requires domain knowledge to determine appropriate conditions',
      impact: {
        linesChanged: 2,
        complexity: 'low',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '5 minutes',
      },
      preview: this.generateAddConditionsPreview(context),
    });

    return suggestions;
  }

  private generateAddConditionsTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.INSERT,
        startLine: violation.line,
        startColumn: 0,
        endLine: violation.line,
        endColumn: 0,
        originalCode: '',
        newCode: "gr.addQuery('active', true);\n",
        description: 'Add query condition',
      },
    ];
  }

  private generateAddConditionsPreview(context: RefactoringContext): string {
    return `
// Before: Query without conditions
var gr = new GlideRecord('incident');
gr.query();

// After: Query with conditions
var gr = new GlideRecord('incident');
gr.addQuery('active', true);
gr.addQuery('priority', '<=', 3);
gr.query();
    `.trim();
  }
}
