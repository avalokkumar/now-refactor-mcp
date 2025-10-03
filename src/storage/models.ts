/**
 * Data models for storage layer
 * Defines interfaces for analysis results, code templates, and related data structures
 */

/**
 * Represents the severity level of a detected issue
 */
export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Represents a detected code issue or anti-pattern
 */
export interface CodeIssue {
  id: string;
  type: string; // e.g., 'nested-query', 'deprecated-api', 'missing-type'
  severity: IssueSeverity;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fileName: string;
}

/**
 * Represents a refactoring suggestion
 */
export interface RefactoringSuggestion {
  id: string;
  issueId: string; // Reference to the CodeIssue
  description: string;
  beforeCode: string;
  afterCode: string;
  confidence: number; // 0-100
  explanation: string;
  tags: string[];
}

/**
 * Represents analysis metadata
 */
export interface AnalysisMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  language: 'javascript' | 'typescript';
  analysisDate: Date;
  duration: number; // Analysis duration in milliseconds
}

/**
 * Represents a complete analysis result
 */
export interface AnalysisResult {
  metadata: AnalysisMetadata;
  issues: CodeIssue[];
  suggestions: RefactoringSuggestion[];
  stats: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}

/**
 * Represents a code template for refactoring patterns
 */
export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string; // Pattern to match
  replacement: string; // Replacement template
  language: 'javascript' | 'typescript';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query options for retrieving analysis results
 */
export interface QueryOptions {
  fileName?: string;
  language?: 'javascript' | 'typescript';
  severity?: IssueSeverity;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'severity' | 'fileName';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Represents a stored file record
 */
export interface FileRecord {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
}
