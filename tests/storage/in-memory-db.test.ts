/**
 * Unit tests for InMemoryDatabase
 */

import {
  InMemoryDatabase,
  getDatabase,
  resetDatabase,
  AnalysisResult,
  CodeTemplate,
  IssueSeverity,
  QueryOptions,
} from '../../src/storage';

describe('InMemoryDatabase', () => {
  let db: InMemoryDatabase;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  afterEach(() => {
    resetDatabase();
  });

  describe('Analysis Results', () => {
    const mockAnalysisResult: AnalysisResult = {
      metadata: {
        id: 'test-1',
        fileName: 'test.js',
        fileSize: 1024,
        language: 'javascript',
        analysisDate: new Date('2025-10-01'),
        duration: 100,
      },
      issues: [
        {
          id: 'issue-1',
          type: 'nested-query',
          severity: IssueSeverity.HIGH,
          message: 'Nested GlideRecord query detected',
          line: 10,
          column: 5,
          fileName: 'test.js',
        },
      ],
      suggestions: [
        {
          id: 'suggestion-1',
          issueId: 'issue-1',
          description: 'Use GlideAggregate instead',
          beforeCode: 'var gr = new GlideRecord()',
          afterCode: 'var ga = new GlideAggregate()',
          confidence: 85,
          explanation: 'GlideAggregate is more efficient for nested queries',
          tags: ['performance'],
        },
      ],
      stats: {
        totalIssues: 1,
        criticalIssues: 0,
        highIssues: 1,
        mediumIssues: 0,
        lowIssues: 0,
      },
    };

    test('should save and retrieve analysis result', () => {
      const saved = db.saveAnalysisResult(mockAnalysisResult);
      expect(saved).toEqual(mockAnalysisResult);

      const retrieved = db.getAnalysisResult('test-1');
      expect(retrieved).toEqual(mockAnalysisResult);
    });

    test('should return undefined for non-existent analysis result', () => {
      const retrieved = db.getAnalysisResult('non-existent');
      expect(retrieved).toBeUndefined();
    });

    test('should delete analysis result', () => {
      db.saveAnalysisResult(mockAnalysisResult);
      const deleted = db.deleteAnalysisResult('test-1');
      expect(deleted).toBe(true);

      const retrieved = db.getAnalysisResult('test-1');
      expect(retrieved).toBeUndefined();
    });

    test('should return false when deleting non-existent result', () => {
      const deleted = db.deleteAnalysisResult('non-existent');
      expect(deleted).toBe(false);
    });

    test('should get all analysis results', () => {
      const result2 = { ...mockAnalysisResult, metadata: { ...mockAnalysisResult.metadata, id: 'test-2' } };
      db.saveAnalysisResult(mockAnalysisResult);
      db.saveAnalysisResult(result2);

      const all = db.getAllAnalysisResults();
      expect(all).toHaveLength(2);
    });

    test('should clear all analysis results', () => {
      db.saveAnalysisResult(mockAnalysisResult);
      db.clearAnalysisResults();

      const all = db.getAllAnalysisResults();
      expect(all).toHaveLength(0);
    });
  });

  describe('Query Analysis Results', () => {
    const createMockResult = (
      id: string,
      fileName: string,
      language: 'javascript' | 'typescript',
      severity: IssueSeverity,
      date: Date
    ): AnalysisResult => ({
      metadata: {
        id,
        fileName,
        fileSize: 1024,
        language,
        analysisDate: date,
        duration: 100,
      },
      issues: [
        {
          id: `issue-${id}`,
          type: 'test-issue',
          severity,
          message: 'Test issue',
          line: 1,
          column: 1,
          fileName,
        },
      ],
      suggestions: [],
      stats: {
        totalIssues: 1,
        criticalIssues: severity === IssueSeverity.CRITICAL ? 1 : 0,
        highIssues: severity === IssueSeverity.HIGH ? 1 : 0,
        mediumIssues: severity === IssueSeverity.MEDIUM ? 1 : 0,
        lowIssues: severity === IssueSeverity.LOW ? 1 : 0,
      },
    });

    beforeEach(() => {
      db.saveAnalysisResult(
        createMockResult('1', 'file1.js', 'javascript', IssueSeverity.HIGH, new Date('2025-10-01'))
      );
      db.saveAnalysisResult(
        createMockResult('2', 'file2.ts', 'typescript', IssueSeverity.LOW, new Date('2025-10-02'))
      );
      db.saveAnalysisResult(
        createMockResult('3', 'file3.js', 'javascript', IssueSeverity.CRITICAL, new Date('2025-10-03'))
      );
    });

    test('should filter by fileName', () => {
      const options: QueryOptions = { fileName: 'file1.js' };
      const results = db.queryAnalysisResults(options);
      expect(results).toHaveLength(1);
      expect(results[0].metadata.fileName).toBe('file1.js');
    });

    test('should filter by language', () => {
      const options: QueryOptions = { language: 'javascript' };
      const results = db.queryAnalysisResults(options);
      expect(results).toHaveLength(2);
    });

    test('should filter by severity', () => {
      const options: QueryOptions = { severity: IssueSeverity.CRITICAL };
      const results = db.queryAnalysisResults(options);
      expect(results).toHaveLength(1);
      expect(results[0].metadata.id).toBe('3');
    });

    test('should sort by date ascending', () => {
      const options: QueryOptions = { sortBy: 'date', sortOrder: 'asc' };
      const results = db.queryAnalysisResults(options);
      expect(results[0].metadata.id).toBe('1');
      expect(results[2].metadata.id).toBe('3');
    });

    test('should sort by date descending', () => {
      const options: QueryOptions = { sortBy: 'date', sortOrder: 'desc' };
      const results = db.queryAnalysisResults(options);
      expect(results[0].metadata.id).toBe('3');
      expect(results[2].metadata.id).toBe('1');
    });

    test('should sort by fileName', () => {
      const options: QueryOptions = { sortBy: 'fileName', sortOrder: 'asc' };
      const results = db.queryAnalysisResults(options);
      expect(results[0].metadata.fileName).toBe('file1.js');
      expect(results[2].metadata.fileName).toBe('file3.js');
    });

    test('should sort by severity', () => {
      const options: QueryOptions = { sortBy: 'severity', sortOrder: 'desc' };
      const results = db.queryAnalysisResults(options);
      expect(results[0].metadata.id).toBe('3'); // CRITICAL
    });

    test('should apply pagination', () => {
      const options: QueryOptions = { limit: 2, offset: 1 };
      const results = db.queryAnalysisResults(options);
      expect(results).toHaveLength(2);
    });

    test('should return all results without options', () => {
      const results = db.queryAnalysisResults();
      expect(results).toHaveLength(3);
    });
  });

  describe('Code Templates', () => {
    const mockTemplate: CodeTemplate = {
      id: 'template-1',
      name: 'GlideRecord Optimization',
      description: 'Optimize GlideRecord queries',
      pattern: 'new GlideRecord\\(([^)]+)\\)',
      replacement: 'optimizedGlideRecord($1)',
      language: 'javascript',
      tags: ['performance', 'gliderecord'],
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    };

    test('should save and retrieve code template', () => {
      const saved = db.saveCodeTemplate(mockTemplate);
      expect(saved).toEqual(mockTemplate);

      const retrieved = db.getCodeTemplate('template-1');
      expect(retrieved).toEqual(mockTemplate);
    });

    test('should return undefined for non-existent template', () => {
      const retrieved = db.getCodeTemplate('non-existent');
      expect(retrieved).toBeUndefined();
    });

    test('should delete code template', () => {
      db.saveCodeTemplate(mockTemplate);
      const deleted = db.deleteCodeTemplate('template-1');
      expect(deleted).toBe(true);

      const retrieved = db.getCodeTemplate('template-1');
      expect(retrieved).toBeUndefined();
    });

    test('should get all code templates', () => {
      const template2 = { ...mockTemplate, id: 'template-2' };
      db.saveCodeTemplate(mockTemplate);
      db.saveCodeTemplate(template2);

      const all = db.getAllCodeTemplates();
      expect(all).toHaveLength(2);
    });

    test('should get templates by language', () => {
      const jsTemplate = { ...mockTemplate, id: 'js-1', language: 'javascript' as const };
      const tsTemplate = { ...mockTemplate, id: 'ts-1', language: 'typescript' as const };
      db.saveCodeTemplate(jsTemplate);
      db.saveCodeTemplate(tsTemplate);

      const jsResults = db.getCodeTemplatesByLanguage('javascript');
      expect(jsResults).toHaveLength(1);
      expect(jsResults[0].id).toBe('js-1');
    });

    test('should get templates by tag', () => {
      const template1 = { ...mockTemplate, id: 't-1', tags: ['performance'] };
      const template2 = { ...mockTemplate, id: 't-2', tags: ['security'] };
      db.saveCodeTemplate(template1);
      db.saveCodeTemplate(template2);

      const perfResults = db.getCodeTemplatesByTag('performance');
      expect(perfResults).toHaveLength(1);
      expect(perfResults[0].id).toBe('t-1');
    });

    test('should clear all code templates', () => {
      db.saveCodeTemplate(mockTemplate);
      db.clearCodeTemplates();

      const all = db.getAllCodeTemplates();
      expect(all).toHaveLength(0);
    });
  });

  describe('Database Statistics', () => {
    test('should return correct statistics', () => {
      const result: AnalysisResult = {
        metadata: {
          id: 'test-1',
          fileName: 'test.js',
          fileSize: 1024,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 100,
        },
        issues: [
          {
            id: 'i1',
            type: 'test',
            severity: IssueSeverity.HIGH,
            message: 'Test',
            line: 1,
            column: 1,
            fileName: 'test.js',
          },
          {
            id: 'i2',
            type: 'test',
            severity: IssueSeverity.LOW,
            message: 'Test',
            line: 2,
            column: 1,
            fileName: 'test.js',
          },
        ],
        suggestions: [],
        stats: {
          totalIssues: 2,
          criticalIssues: 0,
          highIssues: 1,
          mediumIssues: 0,
          lowIssues: 1,
        },
      };

      const template: CodeTemplate = {
        id: 'template-1',
        name: 'Test Template',
        description: 'Test',
        pattern: 'test',
        replacement: 'test',
        language: 'javascript',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveAnalysisResult(result);
      db.saveCodeTemplate(template);

      const stats = db.getStats();
      expect(stats.analysisResultsCount).toBe(1);
      expect(stats.codeTemplatesCount).toBe(1);
      expect(stats.totalIssuesCount).toBe(2);
    });
  });

  describe('Clear All', () => {
    test('should clear all data', () => {
      const result: AnalysisResult = {
        metadata: {
          id: 'test-1',
          fileName: 'test.js',
          fileSize: 1024,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 100,
        },
        issues: [],
        suggestions: [],
        stats: {
          totalIssues: 0,
          criticalIssues: 0,
          highIssues: 0,
          mediumIssues: 0,
          lowIssues: 0,
        },
      };

      const template: CodeTemplate = {
        id: 'template-1',
        name: 'Test',
        description: 'Test',
        pattern: 'test',
        replacement: 'test',
        language: 'javascript',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveAnalysisResult(result);
      db.saveCodeTemplate(template);
      db.clearAll();

      const stats = db.getStats();
      expect(stats.analysisResultsCount).toBe(0);
      expect(stats.codeTemplatesCount).toBe(0);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const db1 = getDatabase();
      const db2 = getDatabase();
      expect(db1).toBe(db2);
    });

    test('should reset database instance', () => {
      const db1 = getDatabase();
      db1.saveAnalysisResult({
        metadata: {
          id: 'test',
          fileName: 'test.js',
          fileSize: 100,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 10,
        },
        issues: [],
        suggestions: [],
        stats: {
          totalIssues: 0,
          criticalIssues: 0,
          highIssues: 0,
          mediumIssues: 0,
          lowIssues: 0,
        },
      });

      resetDatabase();
      const db2 = getDatabase();
      expect(db2.getStats().analysisResultsCount).toBe(0);
    });
  });
});
