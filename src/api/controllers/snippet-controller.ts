/**
 * Code Snippet Controller
 * Provides API endpoints for fetching code snippets
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '../../storage';
import { getAnalysisService } from '../services/analysis-service';

/**
 * Get code snippet controller
 * GET /api/code-snippet
 */
export async function getCodeSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fileName, startLine, endLine } = req.query;
    
    if (!fileName) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameter: fileName',
      });
      return;
    }
    
    // Parse line numbers
    const start = startLine ? parseInt(startLine as string) : 1;
    const end = endLine ? parseInt(endLine as string) : start + 10;
    
    // Get file content from storage
    const analysisService = getAnalysisService();
    const fileRecord = await analysisService.getFileByName(fileName as string);
    
    if (!fileRecord) {
      res.status(404).json({
        error: 'Not Found',
        message: `File not found: ${fileName}`,
      });
      return;
    }
    
    // Read file content
    // For demo purposes, we'll use the sample file directly
    const samplePath = path.join(process.cwd(), 'data', 'samples', fileName as string);
    
    if (!fs.existsSync(samplePath)) {
      res.status(404).json({
        error: 'Not Found',
        message: `File not found at path: ${samplePath}`,
      });
      return;
    }
    
    const content = fs.readFileSync(samplePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract requested lines
    const startIdx = Math.max(0, start - 1);
    const endIdx = Math.min(lines.length, end);
    const snippetLines = lines.slice(startIdx, endIdx);
    
    // Format snippet with line numbers
    const formattedSnippet = snippetLines.map((line, idx) => {
      const lineNumber = startIdx + idx + 1;
      const highlightClass = lineNumber === parseInt(startLine as string) ? 'highlight-line' : '';
      return `<span class="${highlightClass}">${lineNumber}: ${line}</span>`;
    }).join('\n');
    
    res.json({
      fileName: fileName as string,
      startLine: start,
      endLine: endIdx,
      totalLines: snippetLines.length,
      snippet: formattedSnippet,
    });
  } catch (error) {
    next(error);
  }
}
