/**
 * Analysis service implementation
 * Handles storage and retrieval of analysis results
 */

import { getDatabase, getFileStorage } from '../../storage';
import { AnalysisResult, AnalysisMetadata, FileRecord } from '../../storage/models';
import { ParseResult } from '../../parser';
import { RuleViolation } from '../../rules';
import { RefactoringSuggestion } from '../../refactor';

// Define simplified suggestion type that matches storage model
interface SimplifiedSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  effort: string;
}

/**
 * Analysis service interface
 */
export interface AnalysisService {
  saveAnalysisResult(result: AnalysisResult): Promise<string>;
  getAnalysisResult(id: string): Promise<AnalysisResult | null>;
  listAnalysisResults(options?: {
    language?: 'javascript' | 'typescript';
    fileName?: string;
    limit?: number;
    offset?: number;
  }): Promise<AnalysisResult[]>;
  saveFileContent(content: Buffer, fileName: string): Promise<{ id: string; path: string }>;
  getFileContent(id: string): Promise<Buffer | null>;
  getFileByName(name: string): Promise<FileRecord | null>;
  createAnalysisResult(
    parseResult: ParseResult,
    violations: RuleViolation[],
    suggestions: RefactoringSuggestion[],
    fileName: string,
    executionTime: number
  ): AnalysisResult;
}

/**
 * Analysis service implementation
 */
export class AnalysisServiceImpl implements AnalysisService {
  /**
   * Save analysis result to database
   * @param result - Analysis result to save
   * @returns ID of saved result
   */
  async saveAnalysisResult(result: AnalysisResult): Promise<string> {
    const db = getDatabase();
    db.saveAnalysisResult(result);
    return result.metadata.id;
  }

  /**
   * Get analysis result by ID
   * @param id - Analysis result ID
   * @returns Analysis result or null if not found
   */
  async getAnalysisResult(id: string): Promise<AnalysisResult | null> {
    const db = getDatabase();
    const result = db.getAnalysisResult(id);
    return result || null;
  }

  /**
   * List analysis results with optional filtering
   * @param options - Filter options
   * @returns Array of analysis results
   */
  async listAnalysisResults(options?: {
    language?: 'javascript' | 'typescript';
    fileName?: string;
    limit?: number;
    offset?: number;
  }): Promise<AnalysisResult[]> {
    const db = getDatabase();
    
    // Get all results
    const allResults = db.getAllAnalysisResults();
    
    // Apply filters
    let filteredResults = allResults;
    
    if (options?.language) {
      filteredResults = filteredResults.filter(
        (result) => result.metadata.language === options.language
      );
    }
    
    if (options?.fileName && options.fileName.length > 0) {
      filteredResults = filteredResults.filter(
        (result) => result.metadata.fileName.includes(options.fileName as string)
      );
    }
    
    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || filteredResults.length;
    
    return filteredResults.slice(offset, offset + limit);
  }

  /**
   * Save file content to storage
   * @param content - File content buffer
   * @param fileName - File name
   * @returns File ID and path
   */
  async saveFileContent(content: Buffer, fileName: string): Promise<{ id: string; path: string }> {
    const fileStorage = await getFileStorage();
    // Create a unique ID for the file
    const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const path = `/uploads/${fileName}`;
    
    // Save file content to storage
    await fileStorage.initialize();
    const contentStr = content.toString('utf-8');
    await fileStorage.saveUploadedFile(fileName, contentStr);
    
    // Save file record to database
    const db = getDatabase();
    const fileRecord: FileRecord = {
      id,
      name: fileName,
      path,
      size: content.length,
      type: fileName.endsWith('.ts') ? 'typescript' : 'javascript',
      uploadedAt: new Date()
    };
    db.saveFile(fileRecord);
    
    return { id, path };
  }

  /**
   * Get file content by ID
   * @param id - File ID
   * @returns File content buffer or null if not found
   */
  async getFileContent(id: string): Promise<Buffer | null> {
    const db = getDatabase();
    const fileRecord = db.getFile(id);
    
    if (!fileRecord) {
      return null;
    }
    
    try {
      const fileStorage = await getFileStorage();
      const content = await fileStorage.getUploadedFile(id);
      return Buffer.from(content);
    } catch (error) {
      console.error(`Error getting file content: ${error}`);
      return null;
    }
  }
  
  /**
   * Get file by name
   * @param name - File name
   * @returns File record or null if not found
   */
  async getFileByName(name: string): Promise<FileRecord | null> {
    const db = getDatabase();
    const fileRecord = db.getFileByName(name);
    return fileRecord || null;
  }

  /**
   * Create analysis result from parse result and violations
   * @param parseResult - Parse result
   * @param violations - Rule violations
   * @param suggestions - Refactoring suggestions
   * @param fileName - File name
   * @param executionTime - Execution time in milliseconds
   * @returns Analysis result
   */
  createAnalysisResult(
    parseResult: ParseResult,
    violations: RuleViolation[],
    suggestions: RefactoringSuggestion[],
    fileName: string,
    executionTime: number
  ): AnalysisResult {
    // Create metadata
    const metadata: AnalysisMetadata = {
      id: `analysis-${Date.now()}`,
      fileName,
      fileSize: parseResult.sourceCode.length,
      language: parseResult.language,
      analysisDate: new Date(),
      duration: executionTime,
    };

    // Map suggestions to simplified format
    const simplifiedSuggestions = suggestions.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      category: 'refactoring',
      effort: s.impact.estimatedTime,
    })) as any[]; // Cast to any[] to avoid type errors

    // Count issues by severity
    const criticalIssues = violations.filter(v => v.severity === 'critical').length;
    const highIssues = violations.filter(v => v.severity === 'high').length;
    const mediumIssues = violations.filter(v => v.severity === 'medium').length;
    const lowIssues = violations.filter(v => v.severity === 'low').length;

    // Create analysis result
    return {
      metadata,
      issues: violations.map(v => ({
        id: `${v.ruleId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: v.ruleId,
        severity: v.severity,
        message: v.message,
        line: v.line,
        column: v.column,
        endLine: v.endLine,
        endColumn: v.endColumn,
        fileName,
      })),
      suggestions: simplifiedSuggestions,
      stats: {
        totalIssues: violations.length,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
      },
    };
  }
}

// Singleton instance
let serviceInstance: AnalysisService | null = null;

/**
 * Get the singleton analysis service instance
 * @returns The analysis service instance
 */
export function getAnalysisService(): AnalysisService {
  if (!serviceInstance) {
    serviceInstance = new AnalysisServiceImpl();
  }
  return serviceInstance;
}

/**
 * Reset the analysis service instance (useful for testing)
 */
export function resetAnalysisService(): void {
  serviceInstance = null;
}
