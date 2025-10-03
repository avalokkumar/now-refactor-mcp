/**
 * Refactoring engine data models
 * Defines interfaces for refactoring suggestions and transformations
 */

import { RuleViolation } from '../rules';
import { ParseResult } from '../parser';

/**
 * Refactoring type
 */
export enum RefactoringType {
  REPLACE = 'replace',
  INSERT = 'insert',
  DELETE = 'delete',
  MOVE = 'move',
  EXTRACT = 'extract',
  INLINE = 'inline',
}

/**
 * Confidence level for refactoring suggestions
 */
export enum ConfidenceLevel {
  HIGH = 'high',       // 80-100% - Safe to auto-apply
  MEDIUM = 'medium',   // 50-79% - Review recommended
  LOW = 'low',         // 0-49% - Manual review required
}

/**
 * Code transformation
 */
export interface CodeTransformation {
  type: RefactoringType;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  originalCode: string;
  newCode: string;
  description: string;
}

/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  transformations: CodeTransformation[];
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100
  reasoning: string;
  impact: RefactoringImpact;
  preview?: string; // Preview of refactored code
}

/**
 * Refactoring impact assessment
 */
export interface RefactoringImpact {
  linesChanged: number;
  complexity: 'low' | 'medium' | 'high';
  breakingChange: boolean;
  testingRequired: boolean;
  estimatedTime: string; // e.g., "5 minutes", "1 hour"
}

/**
 * Refactoring context
 */
export interface RefactoringContext {
  parseResult: ParseResult;
  violation: RuleViolation;
  fileName: string;
  sourceCode: string;
}

/**
 * Refactoring provider interface
 */
export interface RefactoringProvider {
  ruleId: string;
  canRefactor(violation: RuleViolation): boolean;
  generateSuggestions(context: RefactoringContext): Promise<RefactoringSuggestion[]>;
}

/**
 * Refactoring result
 */
export interface RefactoringResult {
  fileName: string;
  language: 'javascript' | 'typescript';
  totalSuggestions: number;
  suggestions: RefactoringSuggestion[];
  executionTime: number;
}

/**
 * Applied refactoring
 */
export interface AppliedRefactoring {
  suggestionId: string;
  fileName: string;
  appliedAt: Date;
  originalCode: string;
  refactoredCode: string;
  success: boolean;
  error?: string;
}
