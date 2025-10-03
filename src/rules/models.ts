/**
 * Rule engine data models
 * Defines interfaces for rules, violations, and rule execution
 */

import { ASTNode, ParseResult } from '../parser';
import { CodeIssue, IssueSeverity } from '../storage';

/**
 * Rule category
 */
export enum RuleCategory {
  PERFORMANCE = 'performance',
  BEST_PRACTICE = 'best-practice',
  SECURITY = 'security',
  MAINTAINABILITY = 'maintainability',
  DEPRECATED = 'deprecated',
}

/**
 * Rule configuration
 */
export interface RuleConfig {
  enabled: boolean;
  severity?: IssueSeverity;
  options?: Record<string, unknown>;
}

/**
 * Rule metadata
 */
export interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: IssueSeverity;
  language: 'javascript' | 'typescript' | 'both';
  tags: string[];
  documentation?: string;
}

/**
 * Rule context provided to rules during execution
 */
export interface RuleContext {
  parseResult: ParseResult;
  fileName: string;
  sourceCode: string;
  options?: Record<string, unknown>;
}

/**
 * Rule violation
 */
export interface RuleViolation {
  ruleId: string;
  message: string;
  severity: IssueSeverity;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  node?: ASTNode;
  fix?: RuleFix;
}

/**
 * Rule fix suggestion
 */
export interface RuleFix {
  description: string;
  range: [number, number];
  replacement: string;
}

/**
 * Rule interface
 */
export interface Rule {
  metadata: RuleMetadata;
  check(context: RuleContext): RuleViolation[];
}

/**
 * Rule execution result
 */
export interface RuleExecutionResult {
  ruleId: string;
  violations: RuleViolation[];
  executionTime: number; // milliseconds
  error?: string;
}

/**
 * Rule engine configuration
 */
export interface RuleEngineConfig {
  rules: Map<string, RuleConfig>;
  maxExecutionTime?: number; // milliseconds per rule
}

/**
 * Rule engine result
 */
export interface RuleEngineResult {
  fileName: string;
  language: 'javascript' | 'typescript';
  totalViolations: number;
  violations: RuleViolation[];
  ruleResults: RuleExecutionResult[];
  totalExecutionTime: number;
  issues: CodeIssue[]; // Converted to storage format
}
