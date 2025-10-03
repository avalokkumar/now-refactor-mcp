/**
 * Unit tests for API controllers
 */

import { Request, Response } from 'express';
import {
  analyzeCode,
  getAnalysis,
  listAnalyses,
  applyRefactoring,
  getStats,
  uploadAndAnalyze,
} from '../../src/api/controllers';
import { getJavaScriptParser, getTypeScriptParser } from '../../src/parser';
import { getRuleEngine } from '../../src/rules';
import { getRefactoringEngine } from '../../src/refactor';
import { getAnalysisService } from '../../src/api/services/analysis-service';

// Mock dependencies
jest.mock('../../src/parser', () => ({
  getJavaScriptParser: jest.fn().mockReturnValue({
    parse: jest.fn().mockReturnValue({
      ast: { type: 'Program' },
      sourceCode: 'var x = 5;',
      fileName: 'test.js',
      language: 'javascript',
      parseTime: 10,
      errors: [],
    }),
  }),
  getTypeScriptParser: jest.fn().mockReturnValue({
    parse: jest.fn().mockReturnValue({
      ast: { type: 'Program' },
      sourceCode: 'const x: number = 5;',
      fileName: 'test.ts',
      language: 'typescript',
      parseTime: 10,
      errors: [],
    }),
  }),
}));

jest.mock('../../src/rules', () => ({
  getRuleEngine: jest.fn().mockReturnValue({
    execute: jest.fn().mockResolvedValue({
      fileName: 'test.js',
      language: 'javascript',
      totalViolations: 1,
      violations: [
        {
          ruleId: 'test-rule',
          message: 'Test violation',
          severity: 'medium',
          line: 1,
          column: 0,
        },
      ],
      issues: [
        {
          id: 'test-issue',
          type: 'test-rule',
          severity: 'medium',
          message: 'Test violation',
          line: 1,
          column: 0,
          fileName: 'test.js',
        },
      ],
      totalExecutionTime: 20,
    }),
    getStats: jest.fn().mockReturnValue({
      totalRules: 10,
      enabledRules: 8,
      disabledRules: 2,
    }),
  }),
}));

jest.mock('../../src/refactor', () => ({
  getRefactoringEngine: jest.fn().mockReturnValue({
    generateSuggestions: jest.fn().mockResolvedValue({
      fileName: 'test.js',
      language: 'javascript',
      totalSuggestions: 1,
      suggestions: [
        {
          id: 'test-suggestion',
          ruleId: 'test-rule',
          title: 'Test Suggestion',
          description: 'Test description',
          transformations: [],
          confidence: 'high',
          confidenceScore: 90,
          reasoning: 'Test reasoning',
          impact: {
            linesChanged: 1,
            complexity: 'low',
            breakingChange: false,
            testingRequired: false,
            estimatedTime: '1 minute',
          },
        },
      ],
      executionTime: 30,
    }),
    getStats: jest.fn().mockReturnValue({
      totalProviders: 5,
      providersByRule: {
        'test-rule': 'TestProvider',
      },
    }),
  }),
}));

jest.mock('../../src/api/services/analysis-service', () => ({
  getAnalysisService: jest.fn().mockReturnValue({
    createAnalysisResult: jest.fn().mockReturnValue({
      metadata: {
        id: 'test-analysis',
        fileName: 'test.js',
        fileSize: 10,
        language: 'javascript',
        analysisDate: new Date(),
        duration: 50,
      },
      issues: [
        {
          id: 'test-issue',
          type: 'test-rule',
          severity: 'medium',
          message: 'Test violation',
          line: 1,
          column: 0,
          fileName: 'test.js',
        },
      ],
      suggestions: [
        {
          id: 'test-suggestion',
          title: 'Test Suggestion',
          description: 'Test description',
          category: 'refactoring',
          effort: '1 minute',
        },
      ],
      stats: {
        totalIssues: 1,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 1,
        lowIssues: 0,
      },
    }),
    saveAnalysisResult: jest.fn().mockResolvedValue('test-analysis'),
    getAnalysisResult: jest.fn().mockResolvedValue({
      metadata: {
        id: 'test-analysis',
        fileName: 'test.js',
        fileSize: 10,
        language: 'javascript',
        analysisDate: new Date(),
        duration: 50,
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
    }),
    listAnalysisResults: jest.fn().mockResolvedValue([
      {
        metadata: {
          id: 'test-analysis-1',
          fileName: 'test1.js',
          fileSize: 10,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 50,
        },
        stats: {
          totalIssues: 1,
          criticalIssues: 0,
          highIssues: 0,
          mediumIssues: 1,
          lowIssues: 0,
        },
      },
      {
        metadata: {
          id: 'test-analysis-2',
          fileName: 'test2.ts',
          fileSize: 20,
          language: 'typescript',
          analysisDate: new Date(),
          duration: 60,
        },
        stats: {
          totalIssues: 2,
          criticalIssues: 0,
          highIssues: 1,
          mediumIssues: 1,
          lowIssues: 0,
        },
      },
    ]),
    saveFileContent: jest.fn().mockResolvedValue({
      id: 'test-file',
      path: '/uploads/test.js',
    }),
  }),
}));

describe('API Controllers', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('analyzeCode', () => {
    test('should analyze code and return results', async () => {
      req.body = {
        code: 'var x = 5;',
        fileName: 'test.js',
        language: 'javascript',
      };

      await analyzeCode(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalled();
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.analysisId).toBe('test-analysis');
      expect(response.fileName).toBe('test.js');
      expect(response.language).toBe('javascript');
      expect(response.stats).toBeDefined();
      expect(response.issues).toBeDefined();
      expect(response.suggestions).toBeDefined();
    });

    test('should return 400 for missing fields', async () => {
      req.body = {
        code: 'var x = 5;',
        // Missing fileName and language
      };

      await analyzeCode(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Bad Request',
      }));
    });

    test('should return 400 for invalid language', async () => {
      req.body = {
        code: 'var x = 5;',
        fileName: 'test.js',
        language: 'invalid',
      };

      await analyzeCode(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Bad Request',
      }));
    });
  });

  describe('getAnalysis', () => {
    test('should return analysis result', async () => {
      req.params = {
        id: 'test-analysis',
      };

      await getAnalysis(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalled();
    });

    test('should return 404 for non-existent analysis', async () => {
      req.params = {
        id: 'non-existent',
      };

      const analysisService = getAnalysisService();
      (analysisService.getAnalysisResult as jest.Mock).mockResolvedValueOnce(null);

      await getAnalysis(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Not Found',
      }));
    });
  });

  describe('listAnalyses', () => {
    test('should return list of analyses', async () => {
      req.query = {};

      await listAnalyses(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalled();
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.count).toBe(2);
      expect(response.results).toHaveLength(2);
    });

    test('should apply filters', async () => {
      req.query = {
        language: 'javascript',
        fileName: 'test1',
        limit: '1',
        offset: '0',
      };

      await listAnalyses(req as Request, res as Response, next);

      expect(getAnalysisService().listAnalysisResults).toHaveBeenCalledWith({
        language: 'javascript',
        fileName: 'test1',
        limit: 1,
        offset: 0,
      });
    });
  });

  describe('applyRefactoring', () => {
    test('should return 400 for missing fields', async () => {
      req.body = {
        // Missing suggestionId, code, fileName
      };

      await applyRefactoring(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Bad Request',
      }));
    });

    test('should return 501 for not implemented', async () => {
      req.body = {
        suggestionId: 'test-suggestion',
        code: 'var x = 5;',
        fileName: 'test.js',
      };

      await applyRefactoring(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Not Implemented',
      }));
    });
  });

  describe('getStats', () => {
    test('should return statistics', async () => {
      await getStats(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalled();
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.analyses).toBeDefined();
      expect(response.rules).toBeDefined();
      expect(response.refactoring).toBeDefined();
    });
  });

  describe('uploadAndAnalyze', () => {
    test('should return 400 for missing file', async () => {
      req.file = undefined;

      await uploadAndAnalyze(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Bad Request',
      }));
    });

    test('should analyze uploaded file', async () => {
      req.file = {
        originalname: 'test.js',
        buffer: Buffer.from('var x = 5;'),
      } as Express.Multer.File;

      await uploadAndAnalyze(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalled();
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.analysisId).toBe('test-analysis');
      expect(response.fileName).toBe('test.js');
      expect(response.fileId).toBe('test-file');
      expect(response.filePath).toBe('/uploads/test.js');
    });

    test('should return 400 for unsupported file type', async () => {
      req.file = {
        originalname: 'test.txt',
        buffer: Buffer.from('plain text'),
      } as Express.Multer.File;

      await uploadAndAnalyze(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Bad Request',
        message: 'Unsupported file type',
      }));
    });
  });
});
