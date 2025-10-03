/**
 * Unit tests for FileStorage
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  FileStorage,
  getFileStorage,
  resetFileStorage,
  AnalysisResult,
  IssueSeverity,
} from '../../src/storage';
import {
  ensureDirectory,
  fileExists,
  getFileExtension,
  isJavaScriptFile,
  isTypeScriptFile,
  determineLanguage,
  sanitizeFileName,
} from '../../src/storage/utils';

const TEST_CONFIG = {
  uploadsDir: path.join(process.cwd(), 'test-uploads'),
  resultsDir: path.join(process.cwd(), 'test-results'),
  maxFileSize: 5 * 1024 * 1024,
};

describe('FileStorage Utils', () => {
  describe('File Extension Utils', () => {
    test('should get file extension', () => {
      expect(getFileExtension('test.js')).toBe('js');
      expect(getFileExtension('test.ts')).toBe('ts');
      expect(getFileExtension('test.txt')).toBe('txt');
    });

    test('should check JavaScript files', () => {
      expect(isJavaScriptFile('test.js')).toBe(true);
      expect(isJavaScriptFile('test.mjs')).toBe(true);
      expect(isJavaScriptFile('test.cjs')).toBe(true);
      expect(isJavaScriptFile('test.ts')).toBe(false);
    });

    test('should check TypeScript files', () => {
      expect(isTypeScriptFile('test.ts')).toBe(true);
      expect(isTypeScriptFile('test.tsx')).toBe(true);
      expect(isTypeScriptFile('test.js')).toBe(false);
    });

    test('should determine language', () => {
      expect(determineLanguage('test.js')).toBe('javascript');
      expect(determineLanguage('test.ts')).toBe('typescript');
      expect(determineLanguage('test.txt')).toBe('unknown');
    });

    test('should sanitize file name', () => {
      expect(sanitizeFileName('test file.js')).toBe('test_file.js');
      expect(sanitizeFileName('test@#$.js')).toBe('test___.js');
    });
  });
});

describe('FileStorage', () => {
  let storage: FileStorage;

  beforeEach(async () => {
    storage = new FileStorage(TEST_CONFIG);
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.clearAll();
    // Clean up test directories
    try {
      fs.rmSync(TEST_CONFIG.uploadsDir, { recursive: true, force: true });
      fs.rmSync(TEST_CONFIG.resultsDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
    resetFileStorage();
  });

  describe('Initialization', () => {
    test('should create storage directories', async () => {
      const uploadsExist = await fileExists(TEST_CONFIG.uploadsDir);
      const resultsExist = await fileExists(TEST_CONFIG.resultsDir);
      expect(uploadsExist).toBe(true);
      expect(resultsExist).toBe(true);
    });

    test('should return configuration', () => {
      const config = storage.getConfig();
      expect(config.uploadsDir).toBe(TEST_CONFIG.uploadsDir);
      expect(config.resultsDir).toBe(TEST_CONFIG.resultsDir);
    });
  });

  describe('Uploaded Files', () => {
    test('should save and retrieve uploaded file', async () => {
      const content = 'console.log("test");';
      const { id, path: filePath } = await storage.saveUploadedFile('test.js', content);

      expect(id).toBeDefined();
      expect(filePath).toContain(TEST_CONFIG.uploadsDir);

      const retrieved = await storage.getUploadedFile(id);
      expect(retrieved).toBe(content);
    });

    test('should check if uploaded file exists', async () => {
      const { id } = await storage.saveUploadedFile('test.js', 'test content');
      const exists = await storage.uploadedFileExists(id);
      expect(exists).toBe(true);

      const notExists = await storage.uploadedFileExists('non-existent');
      expect(notExists).toBe(false);
    });

    test('should delete uploaded file', async () => {
      const { id } = await storage.saveUploadedFile('test.js', 'test content');
      await storage.deleteUploadedFile(id);

      const exists = await storage.uploadedFileExists(id);
      expect(exists).toBe(false);
    });

    test('should list uploaded files', async () => {
      await storage.saveUploadedFile('test1.js', 'content1');
      await storage.saveUploadedFile('test2.js', 'content2');

      const files = await storage.listUploadedFiles();
      expect(files.length).toBeGreaterThanOrEqual(2);
    });

    test('should sanitize file names', async () => {
      const { id } = await storage.saveUploadedFile('test file@#$.js', 'content');
      expect(id).toContain('test_file');
    });

    test('should generate unique file names', async () => {
      const result1 = await storage.saveUploadedFile('test.js', 'content1');
      const result2 = await storage.saveUploadedFile('test.js', 'content2');

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('Analysis Results', () => {
    const mockResult: AnalysisResult = {
      metadata: {
        id: 'test-result-1',
        fileName: 'test.js',
        fileSize: 1024,
        language: 'javascript',
        analysisDate: new Date('2025-10-01'),
        duration: 100,
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
      stats: {
        totalIssues: 1,
        criticalIssues: 0,
        highIssues: 1,
        mediumIssues: 0,
        lowIssues: 0,
      },
    };

    test('should save and retrieve analysis result', async () => {
      const filePath = await storage.saveAnalysisResult(mockResult);
      expect(filePath).toContain(TEST_CONFIG.resultsDir);

      const retrieved = await storage.getAnalysisResult('test-result-1');
      expect(retrieved.metadata.id).toBe(mockResult.metadata.id);
      expect(retrieved.metadata.fileName).toBe(mockResult.metadata.fileName);
    });

    test('should check if analysis result exists', async () => {
      await storage.saveAnalysisResult(mockResult);

      const exists = await storage.analysisResultExists('test-result-1');
      expect(exists).toBe(true);

      const notExists = await storage.analysisResultExists('non-existent');
      expect(notExists).toBe(false);
    });

    test('should delete analysis result', async () => {
      await storage.saveAnalysisResult(mockResult);
      await storage.deleteAnalysisResult('test-result-1');

      const exists = await storage.analysisResultExists('test-result-1');
      expect(exists).toBe(false);
    });

    test('should list analysis results', async () => {
      await storage.saveAnalysisResult(mockResult);
      await storage.saveAnalysisResult({
        ...mockResult,
        metadata: { ...mockResult.metadata, id: 'test-result-2' },
      });

      const results = await storage.listAnalysisResults();
      expect(results).toContain('test-result-1');
      expect(results).toContain('test-result-2');
    });

    test('should preserve result data when saving and loading', async () => {
      await storage.saveAnalysisResult(mockResult);
      const retrieved = await storage.getAnalysisResult('test-result-1');

      expect(retrieved.issues.length).toBe(mockResult.issues.length);
      expect(retrieved.issues[0].severity).toBe(mockResult.issues[0].severity);
      expect(retrieved.stats.totalIssues).toBe(mockResult.stats.totalIssues);
    });
  });

  describe('Clear Operations', () => {
    test('should clear all uploads', async () => {
      await storage.saveUploadedFile('test1.js', 'content1');
      await storage.saveUploadedFile('test2.js', 'content2');

      await storage.clearUploads();

      const files = await storage.listUploadedFiles();
      expect(files.length).toBe(0);
    });

    test('should clear all results', async () => {
      const result1: AnalysisResult = {
        metadata: {
          id: 'result-1',
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

      await storage.saveAnalysisResult(result1);
      await storage.clearResults();

      const results = await storage.listAnalysisResults();
      expect(results.length).toBe(0);
    });

    test('should clear all data', async () => {
      await storage.saveUploadedFile('test.js', 'content');
      await storage.saveAnalysisResult({
        metadata: {
          id: 'result-1',
          fileName: 'test.js',
          fileSize: 100,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 50,
        },
        issues: [],
        suggestions: [],
        stats: { totalIssues: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
      });

      await storage.clearAll();

      const files = await storage.listUploadedFiles();
      const results = await storage.listAnalysisResults();
      expect(files.length).toBe(0);
      expect(results.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    test('should return storage statistics', async () => {
      await storage.saveUploadedFile('test1.js', 'content1');
      await storage.saveUploadedFile('test2.js', 'content2');

      await storage.saveAnalysisResult({
        metadata: {
          id: 'result-1',
          fileName: 'test.js',
          fileSize: 100,
          language: 'javascript',
          analysisDate: new Date(),
          duration: 50,
        },
        issues: [],
        suggestions: [],
        stats: { totalIssues: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
      });

      const stats = await storage.getStats();
      expect(stats.uploadsCount).toBeGreaterThanOrEqual(2);
      expect(stats.resultsCount).toBeGreaterThanOrEqual(1);
      expect(stats.uploadsDir).toBe(TEST_CONFIG.uploadsDir);
      expect(stats.resultsDir).toBe(TEST_CONFIG.resultsDir);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', async () => {
      const storage1 = await getFileStorage(TEST_CONFIG);
      const storage2 = await getFileStorage(TEST_CONFIG);
      expect(storage1).toBe(storage2);
    });

    test('should reset instance', async () => {
      const storage1 = await getFileStorage(TEST_CONFIG);
      await storage1.saveUploadedFile('test.js', 'content');

      resetFileStorage();
      const storage2 = await getFileStorage(TEST_CONFIG);

      // New instance should be created
      expect(storage2).toBeDefined();
    });
  });
});
