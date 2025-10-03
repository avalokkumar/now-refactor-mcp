/**
 * TypeScript module refactoring providers
 * Provides refactoring suggestions for module organization
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
 * Unused imports refactoring provider
 */
export class UnusedImportsRefactoringProvider implements RefactoringProvider {
  ruleId = 'ts-unused-imports';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    suggestions.push({
      id: `${this.ruleId}-remove-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Remove unused imports',
      description: 'Remove import statements that are not used in the code',
      transformations: this.generateRemoveImportsTransformation(context),
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 90,
      reasoning: 'Unused imports can be safely removed',
      impact: {
        linesChanged: 1,
        complexity: 'low',
        breakingChange: false,
        testingRequired: false,
        estimatedTime: '1 minute',
      },
      preview: this.generateRemoveImportsPreview(context),
    });

    return suggestions;
  }

  private generateRemoveImportsTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.DELETE,
        startLine: violation.line,
        startColumn: 0,
        endLine: violation.line,
        endColumn: 100,
        originalCode: "import { unused } from 'module';",
        newCode: '',
        description: 'Remove unused import',
      },
    ];
  }

  private generateRemoveImportsPreview(context: RefactoringContext): string {
    return `
// Before: Unused imports
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export class MyComponent implements OnInit {
  // Only Component and OnInit are used
}

// After: Only used imports
import { Component, OnInit } from '@angular/core';

export class MyComponent implements OnInit {
  // Clean imports
}
    `.trim();
  }
}
