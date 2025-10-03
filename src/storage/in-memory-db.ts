/**
 * In-memory database implementation
 * Provides simple storage for analysis results and code templates without external dependencies
 */

import { AnalysisResult, CodeTemplate, QueryOptions, IssueSeverity, FileRecord } from './models';

/**
 * In-memory database for storing analysis results and templates
 * Data is stored in memory and will be lost on server restart
 */
export class InMemoryDatabase {
  private analysisResults: Map<string, AnalysisResult>;
  private codeTemplates: Map<string, CodeTemplate>;
  private files: Map<string, FileRecord>;

  constructor() {
    this.analysisResults = new Map();
    this.codeTemplates = new Map();
    this.files = new Map();
  }

  /**
   * Store an analysis result
   * @param result - The analysis result to store
   * @returns The stored analysis result
   */
  saveAnalysisResult(result: AnalysisResult): AnalysisResult {
    this.analysisResults.set(result.metadata.id, result);
    return result;
  }

  /**
   * Retrieve an analysis result by ID
   * @param id - The analysis result ID
   * @returns The analysis result or undefined if not found
   */
  getAnalysisResult(id: string): AnalysisResult | undefined {
    return this.analysisResults.get(id);
  }

  /**
   * Query analysis results with filters
   * @param options - Query options for filtering and sorting
   * @returns Array of matching analysis results
   */
  queryAnalysisResults(options: QueryOptions = {}): AnalysisResult[] {
    let results = Array.from(this.analysisResults.values());

    // Apply filters
    if (options.fileName) {
      results = results.filter((r) => r.metadata.fileName === options.fileName);
    }

    if (options.language) {
      results = results.filter((r) => r.metadata.language === options.language);
    }

    if (options.severity) {
      results = results.filter((r) =>
        r.issues.some((issue) => issue.severity === options.severity)
      );
    }

    // Sort results
    if (options.sortBy) {
      results.sort((a, b) => {
        let comparison = 0;

        switch (options.sortBy) {
          case 'date':
            comparison = a.metadata.analysisDate.getTime() - b.metadata.analysisDate.getTime();
            break;
          case 'fileName':
            comparison = a.metadata.fileName.localeCompare(b.metadata.fileName);
            break;
          case 'severity':
            comparison = this.compareSeverity(a, b);
            break;
        }

        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  /**
   * Compare analysis results by highest severity
   */
  private compareSeverity(a: AnalysisResult, b: AnalysisResult): number {
    const severityOrder = {
      [IssueSeverity.CRITICAL]: 4,
      [IssueSeverity.HIGH]: 3,
      [IssueSeverity.MEDIUM]: 2,
      [IssueSeverity.LOW]: 1,
    };

    const maxSeverityA = Math.max(
      ...a.issues.map((i) => severityOrder[i.severity] || 0),
      0
    );
    const maxSeverityB = Math.max(
      ...b.issues.map((i) => severityOrder[i.severity] || 0),
      0
    );

    return maxSeverityA - maxSeverityB;
  }

  /**
   * Delete an analysis result
   * @param id - The analysis result ID to delete
   * @returns True if deleted, false if not found
   */
  deleteAnalysisResult(id: string): boolean {
    return this.analysisResults.delete(id);
  }

  /**
   * Get all analysis results
   * @returns Array of all analysis results
   */
  getAllAnalysisResults(): AnalysisResult[] {
    return Array.from(this.analysisResults.values());
  }

  /**
   * Clear all analysis results
   */
  clearAnalysisResults(): void {
    this.analysisResults.clear();
  }

  /**
   * Store a code template
   * @param template - The code template to store
   * @returns The stored template
   */
  saveCodeTemplate(template: CodeTemplate): CodeTemplate {
    this.codeTemplates.set(template.id, template);
    return template;
  }

  /**
   * Retrieve a code template by ID
   * @param id - The template ID
   * @returns The template or undefined if not found
   */
  getCodeTemplate(id: string): CodeTemplate | undefined {
    return this.codeTemplates.get(id);
  }

  /**
   * Get all code templates
   * @returns Array of all code templates
   */
  getAllCodeTemplates(): CodeTemplate[] {
    return Array.from(this.codeTemplates.values());
  }

  /**
   * Get code templates by language
   * @param language - The programming language
   * @returns Array of matching templates
   */
  getCodeTemplatesByLanguage(language: 'javascript' | 'typescript'): CodeTemplate[] {
    return Array.from(this.codeTemplates.values()).filter((t) => t.language === language);
  }

  /**
   * Get code templates by tag
   * @param tag - The tag to filter by
   * @returns Array of matching templates
   */
  getCodeTemplatesByTag(tag: string): CodeTemplate[] {
    return Array.from(this.codeTemplates.values()).filter((t) => t.tags.includes(tag));
  }

  /**
   * Delete a code template
   * @param id - The template ID to delete
   * @returns True if deleted, false if not found
   */
  deleteCodeTemplate(id: string): boolean {
    return this.codeTemplates.delete(id);
  }

  /**
   * Clear all code templates
   */
  clearCodeTemplates(): void {
    this.codeTemplates.clear();
  }

  /**
   * Get database statistics
   * @returns Object containing database statistics
   */
  getStats(): {
    analysisResultsCount: number;
    codeTemplatesCount: number;
    totalIssuesCount: number;
  } {
    const totalIssuesCount = Array.from(this.analysisResults.values()).reduce(
      (sum, result) => sum + result.issues.length,
      0
    );

    return {
      analysisResultsCount: this.analysisResults.size,
      codeTemplatesCount: this.codeTemplates.size,
      totalIssuesCount,
    };
  }

  /**
   * Save file record
   * @param file - File record to save
   * @returns The saved file record
   */
  saveFile(file: FileRecord): FileRecord {
    this.files.set(file.id, file);
    return file;
  }

  /**
   * Get file by ID
   * @param id - File ID
   * @returns File record or undefined if not found
   */
  getFile(id: string): FileRecord | undefined {
    return this.files.get(id);
  }

  /**
   * Get file by name
   * @param name - File name
   * @returns File record or undefined if not found
   */
  getFileByName(name: string): FileRecord | undefined {
    return Array.from(this.files.values()).find(file => file.name === name);
  }

  /**
   * Delete file record
   * @param id - File ID
   * @returns True if deleted, false if not found
   */
  deleteFile(id: string): boolean {
    return this.files.delete(id);
  }

  /**
   * Get all files
   * @returns Array of all file records
   */
  getAllFiles(): FileRecord[] {
    return Array.from(this.files.values());
  }

  /**
   * Clear all files
   */
  clearFiles(): void {
    this.files.clear();
  }

  /**
   * Clear all data from the database
   */
  clearAll(): void {
    this.clearAnalysisResults();
    this.clearCodeTemplates();
    this.clearFiles();
  }
}

// Singleton instance
let dbInstance: InMemoryDatabase | null = null;

/**
 * Get the singleton database instance
 * @returns The database instance
 */
export function getDatabase(): InMemoryDatabase {
  if (!dbInstance) {
    dbInstance = new InMemoryDatabase();
  }
  return dbInstance;
}

/**
 * Reset the database instance (useful for testing)
 */
export function resetDatabase(): void {
  if (dbInstance) {
    dbInstance.clearAll();
  }
  dbInstance = null;
}
