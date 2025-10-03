/**
 * API controllers
 * Handle HTTP requests and responses
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { getJavaScriptParser, getTypeScriptParser } from '../parser';
import { getRuleEngine } from '../rules';
import { getRefactoringEngine } from '../refactor';
import { getAnalysisService } from './services/analysis-service';

/**
 * Analyze code controller
 * POST /api/analyze
 */
export async function analyzeCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, fileName, language } = req.body;

    // Validate input
    if (!code || !fileName || !language) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: code, fileName, language',
      });
      return;
    }

    if (language !== 'javascript' && language !== 'typescript') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Language must be javascript or typescript',
      });
      return;
    }

    // Parse code
    const parser = language === 'javascript' ? getJavaScriptParser() : getTypeScriptParser();
    const parseResult = parser.parse(code, fileName);

    if (parseResult.errors.length > 0) {
      res.status(400).json({
        error: 'Parse Error',
        message: 'Failed to parse code',
        errors: parseResult.errors,
      });
      return;
    }

    // Run rules
    const ruleEngine = getRuleEngine();
    const ruleResult = await ruleEngine.execute(parseResult, fileName);

    // Generate refactoring suggestions
    const refactorEngine = getRefactoringEngine();
    const refactorResult = await refactorEngine.generateSuggestions(
      parseResult,
      ruleResult.violations,
      fileName
    );

    // Use analysis service
    const analysisService = getAnalysisService();
    const analysisResult = analysisService.createAnalysisResult(
      parseResult,
      ruleResult.violations,
      refactorResult.suggestions,
      fileName,
      ruleResult.totalExecutionTime + refactorResult.executionTime
    );

    // Save to database
    await analysisService.saveAnalysisResult(analysisResult);

    // Return response
    res.json({
      analysisId: analysisResult.metadata.id,
      fileName: analysisResult.metadata.fileName,
      language: analysisResult.metadata.language,
      stats: analysisResult.stats,
      issues: analysisResult.issues,
      suggestions: analysisResult.suggestions,
      executionTime: analysisResult.metadata.duration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get analysis result controller
 * GET /api/analysis/:id
 */
export async function getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const analysisService = getAnalysisService();
    const result = await analysisService.getAnalysisResult(id);

    if (!result) {
      res.status(404).json({
        error: 'Not Found',
        message: `Analysis result ${id} not found`,
      });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * List analyses controller
 * GET /api/analyses
 */
export async function listAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { language, fileName, limit, offset } = req.query;

    const analysisService = getAnalysisService();
    const results = await analysisService.listAnalysisResults({
      language: language as 'javascript' | 'typescript' | undefined,
      fileName: fileName as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Apply refactoring controller
 * POST /api/refactor/apply
 */
export async function applyRefactoring(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { suggestionId, code, fileName } = req.body;

    if (!suggestionId || !code || !fileName) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: suggestionId, code, fileName',
      });
      return;
    }

    // Find suggestion (simplified - in production, retrieve from database)
    const refactorEngine = getRefactoringEngine();
    
    // This is a placeholder - in production, you'd retrieve the suggestion from storage
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Refactoring application will be implemented in a future version',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get statistics controller
 * GET /api/stats
 */
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const analysisService = getAnalysisService();
    const results = await analysisService.listAnalysisResults();
    
    const stats = {
      totalAnalyses: results.length,
      javascriptAnalyses: results.filter(r => r.metadata.language === 'javascript').length,
      typescriptAnalyses: results.filter(r => r.metadata.language === 'typescript').length,
      totalIssues: results.reduce((sum, r) => sum + r.stats.totalIssues, 0),
    };

    const ruleEngine = getRuleEngine();
    const ruleStats = ruleEngine.getStats();

    const refactorEngine = getRefactoringEngine();
    const refactorStats = refactorEngine.getStats();

    res.json({
      analyses: stats,
      rules: ruleStats,
      refactoring: refactorStats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload and analyze file controller
 * POST /api/upload
 */
export async function uploadAndAnalyze(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded',
      });
      return;
    }

    const file = req.file;
    const fileName = file.originalname;
    const code = file.buffer.toString('utf-8');
    const ext = path.extname(fileName).toLowerCase();

    // Determine language from extension
    let language: 'javascript' | 'typescript';
    if (ext === '.ts' || ext === '.tsx') {
      language = 'typescript';
    } else if (ext === '.js' || ext === '.jsx') {
      language = 'javascript';
    } else {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Unsupported file type',
      });
      return;
    }

    // Use analysis service
    const analysisService = getAnalysisService();
    
    // Save file to storage
    const savedFile = await analysisService.saveFileContent(file.buffer, fileName);

    // Parse code
    const parser = language === 'javascript' ? getJavaScriptParser() : getTypeScriptParser();
    const parseResult = parser.parse(code, fileName);

    if (parseResult.errors.length > 0) {
      res.status(400).json({
        error: 'Parse Error',
        message: 'Failed to parse code',
        errors: parseResult.errors,
      });
      return;
    }

    // Run rules
    const ruleEngine = getRuleEngine();
    const ruleResult = await ruleEngine.execute(parseResult, fileName);

    // Generate refactoring suggestions
    const refactorEngine = getRefactoringEngine();
    const refactorResult = await refactorEngine.generateSuggestions(
      parseResult,
      ruleResult.violations,
      fileName
    );

    // Create and save analysis result
    const analysisResult = analysisService.createAnalysisResult(
      parseResult,
      ruleResult.violations,
      refactorResult.suggestions,
      fileName,
      ruleResult.totalExecutionTime + refactorResult.executionTime
    );
    
    await analysisService.saveAnalysisResult(analysisResult);

    // Return response
    res.json({
      analysisId: analysisResult.metadata.id,
      fileName: analysisResult.metadata.fileName,
      language: analysisResult.metadata.language,
      fileId: savedFile.id,
      filePath: savedFile.path,
      stats: analysisResult.stats,
      issues: analysisResult.issues,
      suggestions: analysisResult.suggestions,
      executionTime: analysisResult.metadata.duration,
    });
  } catch (error) {
    next(error);
  }
}
