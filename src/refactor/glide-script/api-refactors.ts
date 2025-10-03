/**
 * GlideScript API refactoring providers
 * Provides refactoring suggestions for deprecated API usage
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
 * Deprecated GlideAjax refactoring provider
 */
export class DeprecatedGlideAjaxRefactoringProvider implements RefactoringProvider {
  ruleId = 'glide-deprecated-ajax';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    suggestions.push({
      id: `${this.ruleId}-async-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Replace getXMLWait with async getXML',
      description: 'Convert synchronous GlideAjax call to asynchronous pattern',
      transformations: this.generateAsyncTransformation(context),
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 90,
      reasoning: 'Direct replacement of deprecated synchronous method with async equivalent',
      impact: {
        linesChanged: 5,
        complexity: 'low',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '5 minutes',
      },
      preview: this.generateAsyncPreview(context),
    });

    return suggestions;
  }

  private generateAsyncTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.line,
        endColumn: violation.column + 20,
        originalCode: 'getXMLWait()',
        newCode: 'getXML(callback)',
        description: 'Replace with async getXML',
      },
    ];
  }

  private generateAsyncPreview(context: RefactoringContext): string {
    return `
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
    `.trim();
  }
}

/**
 * Log instead of error refactoring provider
 */
export class LogToErrorRefactoringProvider implements RefactoringProvider {
  ruleId = 'glide-log-for-errors';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    suggestions.push({
      id: `${this.ruleId}-to-error-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Replace gs.log with gs.error',
      description: 'Use gs.error() for error messages instead of gs.log()',
      transformations: this.generateErrorTransformation(context),
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 95,
      reasoning: 'Simple string replacement for proper log level',
      impact: {
        linesChanged: 1,
        complexity: 'low',
        breakingChange: false,
        testingRequired: false,
        estimatedTime: '1 minute',
      },
      preview: this.generateErrorPreview(context),
    });

    return suggestions;
  }

  private generateErrorTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.line,
        endColumn: violation.column + 6,
        originalCode: 'gs.log',
        newCode: 'gs.error',
        description: 'Replace gs.log with gs.error',
      },
    ];
  }

  private generateErrorPreview(context: RefactoringContext): string {
    return `
// Before: Using gs.log for errors
gs.log('ERROR: Failed to process record');
gs.log('Exception occurred: ' + ex);

// After: Using gs.error
gs.error('Failed to process record');
gs.error('Exception occurred: ' + ex);
    `.trim();
  }
}
