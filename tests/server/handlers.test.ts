/**
 * Unit tests for request handlers
 */

import {
  healthCheckHandler,
  getAnalysisHandler,
  listAnalysesHandler,
  analyzeCodeHandler,
  suggestRefactorHandler,
  registerDefaultHandlers,
} from '../../src/server/handlers';
import { MCPRequest, MCPRequestType, MCPServer } from '../../src/server/mcp-server';
import { getDatabase, resetDatabase, AnalysisResult, IssueSeverity } from '../../src/storage';

describe('Request Handlers', () => {
  const createRequest = (
    type: MCPRequestType,
    params: Record<string, unknown> = {}
  ): MCPRequest => ({
    id: `req-${Date.now()}-${Math.random()}`,
    type,
    params,
    timestamp: new Date(),
  });

  beforeEach(() => {
    resetDatabase();
  });

  afterEach(() => {
    resetDatabase();
  });

  describe('healthCheckHandler', () => {
    test('should return health status', async () => {
      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      const result = await healthCheckHandler(request);

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database');
    });

    test('should include database statistics', async () => {
      const db = getDatabase();
      const mockResult: AnalysisResult = {
        metadata: {
          id: 'test-1',
          fileName: 'test.js',
          fileSize: 100,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 50,
        },
        issues: [],
        suggestions: [],
        stats: { totalIssues: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
      };
      db.saveAnalysisResult(mockResult);

      const request = createRequest(MCPRequestType.HEALTH_CHECK);
      const result: any = await healthCheckHandler(request);

      expect(result.database.analysisResultsCount).toBe(1);
    });
  });

  describe('getAnalysisHandler', () => {
    test('should throw error when analysisId is missing', async () => {
      const request = createRequest(MCPRequestType.GET_ANALYSIS, {});
      await expect(getAnalysisHandler(request)).rejects.toThrow(
        'analysisId is required and must be a string'
      );
    });

    test('should throw error when analysis not found', async () => {
      const request = createRequest(MCPRequestType.GET_ANALYSIS, {
        analysisId: 'non-existent',
      });
      await expect(getAnalysisHandler(request)).rejects.toThrow(
        'Analysis result not found: non-existent'
      );
    });

    test('should return analysis result', async () => {
      const db = getDatabase();
      const mockResult: AnalysisResult = {
        metadata: {
          id: 'test-analysis',
          fileName: 'test.js',
          fileSize: 100,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 50,
        },
        issues: [
          {
            id: 'issue-1',
            type: 'test-issue',
            severity: IssueSeverity.HIGH,
            message: 'Test issue',
            line: 1,
            column: 1,
            fileName: 'test.js',
          },
        ],
        suggestions: [],
        stats: { totalIssues: 1, criticalIssues: 0, highIssues: 1, mediumIssues: 0, lowIssues: 0 },
      };
      db.saveAnalysisResult(mockResult);

      const request = createRequest(MCPRequestType.GET_ANALYSIS, {
        analysisId: 'test-analysis',
      });
      const result = await getAnalysisHandler(request);

      expect(result).toEqual(mockResult);
    });
  });

  describe('listAnalysesHandler', () => {
    beforeEach(() => {
      const db = getDatabase();
      db.saveAnalysisResult({
        metadata: {
          id: 'analysis-1',
          fileName: 'file1.js',
          fileSize: 100,
          language: 'javascript',
          analysisDate: new Date('2025-10-01'),
          duration: 50,
        },
        issues: [],
        suggestions: [],
        stats: { totalIssues: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
      });
      db.saveAnalysisResult({
        metadata: {
          id: 'analysis-2',
          fileName: 'file2.ts',
          fileSize: 200,
          language: 'typescript',
          analysisDate: new Date('2025-10-02'),
          duration: 100,
        },
        issues: [],
        suggestions: [],
        stats: { totalIssues: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
      });
    });

    test('should list all analyses without filters', async () => {
      const request = createRequest(MCPRequestType.LIST_ANALYSES, {});
      const result: any = await listAnalysesHandler(request);

      expect(result.count).toBe(2);
      expect(result.results).toHaveLength(2);
    });

    test('should filter by language', async () => {
      const request = createRequest(MCPRequestType.LIST_ANALYSES, {
        language: 'javascript',
      });
      const result: any = await listAnalysesHandler(request);

      expect(result.count).toBe(1);
      expect(result.results[0].metadata.language).toBe('javascript');
    });

    test('should filter by fileName', async () => {
      const request = createRequest(MCPRequestType.LIST_ANALYSES, {
        fileName: 'file1.js',
      });
      const result: any = await listAnalysesHandler(request);

      expect(result.count).toBe(1);
      expect(result.results[0].metadata.fileName).toBe('file1.js');
    });

    test('should apply limit', async () => {
      const request = createRequest(MCPRequestType.LIST_ANALYSES, { limit: 1 });
      const result: any = await listAnalysesHandler(request);

      expect(result.count).toBe(1);
    });

    test('should sort results', async () => {
      const request = createRequest(MCPRequestType.LIST_ANALYSES, {
        sortBy: 'date',
        sortOrder: 'asc',
      });
      const result: any = await listAnalysesHandler(request);

      expect(result.results[0].metadata.id).toBe('analysis-1');
      expect(result.results[1].metadata.id).toBe('analysis-2');
    });
  });

  describe('analyzeCodeHandler', () => {
    test('should throw error when code is missing', async () => {
      const request = createRequest(MCPRequestType.ANALYZE_CODE, { fileName: 'test.js' });
      await expect(analyzeCodeHandler(request)).rejects.toThrow(
        'code is required and must be a string'
      );
    });

    test('should throw error when fileName is missing', async () => {
      const request = createRequest(MCPRequestType.ANALYZE_CODE, { code: 'test code' });
      await expect(analyzeCodeHandler(request)).rejects.toThrow(
        'fileName is required and must be a string'
      );
    });

    test('should throw error when language is invalid', async () => {
      const request = createRequest(MCPRequestType.ANALYZE_CODE, {
        code: 'test code',
        fileName: 'test.js',
        language: 'python',
      });
      await expect(analyzeCodeHandler(request)).rejects.toThrow(
        'language must be either "javascript" or "typescript"'
      );
    });

    test('should return placeholder response', async () => {
      const request = createRequest(MCPRequestType.ANALYZE_CODE, {
        code: 'console.log("test");',
        fileName: 'test.js',
        language: 'javascript',
      });
      const result: any = await analyzeCodeHandler(request);

      expect(result.message).toContain('not yet implemented');
      expect(result.requestParams.fileName).toBe('test.js');
      expect(result.requestParams.language).toBe('javascript');
    });
  });

  describe('suggestRefactorHandler', () => {
    test('should throw error when analysisId is missing', async () => {
      const request = createRequest(MCPRequestType.SUGGEST_REFACTOR, {});
      await expect(suggestRefactorHandler(request)).rejects.toThrow(
        'analysisId is required and must be a string'
      );
    });

    test('should return placeholder response', async () => {
      const request = createRequest(MCPRequestType.SUGGEST_REFACTOR, {
        analysisId: 'test-analysis',
      });
      const result: any = await suggestRefactorHandler(request);

      expect(result.message).toContain('not yet implemented');
      expect(result.requestParams.analysisId).toBe('test-analysis');
    });
  });

  describe('registerDefaultHandlers', () => {
    test('should register all default handlers', () => {
      const server = new MCPServer();
      registerDefaultHandlers(server);

      const stats = server.getStats();
      expect(stats.registeredHandlers).toBe(5);
    });
  });
});
