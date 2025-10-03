/**
 * API routes definition
 * Defines HTTP routes and maps them to controllers
 */

import { Router } from 'express';
import {
  analyzeCode,
  getAnalysis,
  listAnalyses,
  applyRefactoring,
  getStats,
  uploadAndAnalyze,
} from './controllers';
import { getCodeSnippet } from './controllers/snippet-controller';
import { uploadSingle } from './middleware/upload';

/**
 * Create API router
 */
export const router = Router();

/**
 * Analysis routes
 */

// POST /api/analyze - Analyze code
router.post('/analyze', analyzeCode);

// POST /api/upload - Upload and analyze file
router.post('/upload', uploadSingle, uploadAndAnalyze);

// GET /api/analysis/:id - Get analysis result
router.get('/analysis/:id', getAnalysis);

// GET /api/analyses - List all analyses
router.get('/analyses', listAnalyses);

/**
 * Refactoring routes
 */

// POST /api/refactor/apply - Apply refactoring
router.post('/refactor/apply', applyRefactoring);

/**
 * Statistics routes
 */

// GET /api/stats - Get system statistics
router.get('/stats', getStats);

/**
 * Code snippet routes
 */

// GET /api/code-snippet - Get code snippet
router.get('/code-snippet', getCodeSnippet);
