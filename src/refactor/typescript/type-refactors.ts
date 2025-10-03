/**
 * TypeScript type refactoring providers
 * Provides refactoring suggestions for type-related issues
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
 * Missing type definitions refactoring provider
 */
export class MissingTypeRefactoringProvider implements RefactoringProvider {
  ruleId = 'ts-missing-types';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    suggestions.push({
      id: `${this.ruleId}-add-types-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Add explicit type annotations',
      description: 'Add type annotations to function parameters and return types',
      transformations: this.generateTypeAnnotationTransformation(context),
      confidence: ConfidenceLevel.MEDIUM,
      confidenceScore: 60,
      reasoning: 'Type inference may provide hints, but explicit types are clearer',
      impact: {
        linesChanged: 1,
        complexity: 'low',
        breakingChange: false,
        testingRequired: false,
        estimatedTime: '5 minutes',
      },
      preview: this.generateTypeAnnotationPreview(context),
    });

    return suggestions;
  }

  private generateTypeAnnotationTransformation(
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
        originalCode: 'function test()',
        newCode: 'function test(): void',
        description: 'Add return type annotation',
      },
    ];
  }

  private generateTypeAnnotationPreview(context: RefactoringContext): string {
    return `
// Before: Missing type annotations
function processData(data) {
  return data.map(item => item.value);
}

const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// After: With type annotations
interface DataItem {
  value: string;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}

interface Config {
  apiUrl: string;
  timeout: number;
}

const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
    `.trim();
  }
}

/**
 * No any type refactoring provider
 */
export class NoAnyRefactoringProvider implements RefactoringProvider {
  ruleId = 'ts-no-any';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    // Suggestion 1: Replace with unknown
    suggestions.push({
      id: `${this.ruleId}-unknown-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Replace any with unknown',
      description: 'Use unknown type for truly unknown data with type guards',
      transformations: this.generateUnknownTransformation(context),
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 85,
      reasoning: 'unknown is type-safe alternative to any',
      impact: {
        linesChanged: 1,
        complexity: 'low',
        breakingChange: true,
        testingRequired: true,
        estimatedTime: '5 minutes',
      },
      preview: this.generateUnknownPreview(context),
    });

    // Suggestion 2: Create specific interface
    suggestions.push({
      id: `${this.ruleId}-interface-${Date.now()}`,
      ruleId: this.ruleId,
      title: 'Create specific interface',
      description: 'Define a specific interface for the data structure',
      transformations: this.generateInterfaceTransformation(context),
      confidence: ConfidenceLevel.MEDIUM,
      confidenceScore: 70,
      reasoning: 'Specific types provide better type safety',
      impact: {
        linesChanged: 5,
        complexity: 'medium',
        breakingChange: false,
        testingRequired: true,
        estimatedTime: '10 minutes',
      },
      preview: this.generateInterfacePreview(context),
    });

    return suggestions;
  }

  private generateUnknownTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.line,
        endColumn: violation.column + 3,
        originalCode: 'any',
        newCode: 'unknown',
        description: 'Replace any with unknown',
      },
    ];
  }

  private generateUnknownPreview(context: RefactoringContext): string {
    return `
// Before: Using any
function handleData(data: any): any {
  return data.process();
}

// After: Using unknown with type guard
function handleData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null && 'process' in data) {
    return (data as { process: () => unknown }).process();
  }
  throw new Error('Invalid data');
}
    `.trim();
  }

  private generateInterfaceTransformation(
    context: RefactoringContext
  ): CodeTransformation[] {
    const { violation } = context;
    
    return [
      {
        type: RefactoringType.REPLACE,
        startLine: violation.line,
        startColumn: violation.column,
        endLine: violation.line,
        endColumn: violation.column + 3,
        originalCode: 'any',
        newCode: 'DataType',
        description: 'Replace any with specific interface',
      },
    ];
  }

  private generateInterfacePreview(context: RefactoringContext): string {
    return `
// Before: Using any
function handleData(data: any): any {
  return data.process();
}

// After: Using specific interface
interface ProcessableData {
  process(): Result;
}

interface Result {
  success: boolean;
  data?: unknown;
}

function handleData(data: ProcessableData): Result {
  return data.process();
}
    `.trim();
  }
}
