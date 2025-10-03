/**
 * Unit tests for API routes
 */

import request from 'supertest';
import express from 'express';
import { router } from '../../src/api/routes';
import * as controllers from '../../src/api/controllers';

// Mock controllers
jest.mock('../../src/api/controllers', () => ({
  analyzeCode: jest.fn((req, res) => res.json({ mock: 'analyzeCode' })),
  getAnalysis: jest.fn((req, res) => res.json({ mock: 'getAnalysis' })),
  listAnalyses: jest.fn((req, res) => res.json({ mock: 'listAnalyses' })),
  applyRefactoring: jest.fn((req, res) => res.json({ mock: 'applyRefactoring' })),
  getStats: jest.fn((req, res) => res.json({ mock: 'getStats' })),
  uploadAndAnalyze: jest.fn((req, res) => res.json({ mock: 'uploadAndAnalyze' })),
}));

// Mock upload middleware
jest.mock('../../src/api/middleware/upload', () => ({
  uploadSingle: jest.fn((req, res, next) => next()),
}));

describe('API Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Analysis Routes', () => {
    test('POST /api/analyze should call analyzeCode controller', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ code: 'var x = 5;', fileName: 'test.js', language: 'javascript' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'analyzeCode' });
      expect(controllers.analyzeCode).toHaveBeenCalled();
    });

    test('POST /api/upload should call uploadAndAnalyze controller', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('var x = 5;'), 'test.js');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'uploadAndAnalyze' });
      expect(controllers.uploadAndAnalyze).toHaveBeenCalled();
    });

    test('GET /api/analysis/:id should call getAnalysis controller', async () => {
      const response = await request(app)
        .get('/api/analysis/test-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'getAnalysis' });
      expect(controllers.getAnalysis).toHaveBeenCalled();
    });

    test('GET /api/analyses should call listAnalyses controller', async () => {
      const response = await request(app)
        .get('/api/analyses');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'listAnalyses' });
      expect(controllers.listAnalyses).toHaveBeenCalled();
    });
  });

  describe('Refactoring Routes', () => {
    test('POST /api/refactor/apply should call applyRefactoring controller', async () => {
      const response = await request(app)
        .post('/api/refactor/apply')
        .send({ suggestionId: 'test-id', code: 'var x = 5;', fileName: 'test.js' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'applyRefactoring' });
      expect(controllers.applyRefactoring).toHaveBeenCalled();
    });
  });

  describe('Statistics Routes', () => {
    test('GET /api/stats should call getStats controller', async () => {
      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'getStats' });
      expect(controllers.getStats).toHaveBeenCalled();
    });
  });
});
