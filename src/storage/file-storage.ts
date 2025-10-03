/**
 * File storage implementation
 * Provides file-based storage for code uploads and analysis results
 */

import * as path from 'path';
import { AnalysisResult } from './models';
import {
  ensureDirectory,
  writeFileContent,
  readFileContent,
  deleteFile,
  listFiles,
  fileExists,
  generateUniqueFileName,
  sanitizeFileName,
} from './utils';

/**
 * Configuration for file storage
 */
export interface FileStorageConfig {
  uploadsDir: string;
  resultsDir: string;
  maxFileSize: number; // in bytes
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FileStorageConfig = {
  uploadsDir: path.join(process.cwd(), 'uploads'),
  resultsDir: path.join(process.cwd(), 'results'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

/**
 * File storage for managing uploaded code files and analysis results
 */
export class FileStorage {
  private config: FileStorageConfig;

  constructor(config?: Partial<FileStorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize storage directories
   */
  async initialize(): Promise<void> {
    await ensureDirectory(this.config.uploadsDir);
    await ensureDirectory(this.config.resultsDir);
  }

  /**
   * Save uploaded code file
   * @param fileName - Original file name
   * @param content - File content
   * @returns Object containing file ID and path
   */
  async saveUploadedFile(fileName: string, content: string): Promise<{ id: string; path: string }> {
    const sanitized = sanitizeFileName(fileName);
    const uniqueFileName = generateUniqueFileName(sanitized);
    const filePath = path.join(this.config.uploadsDir, uniqueFileName);

    await writeFileContent(filePath, content);

    return {
      id: uniqueFileName,
      path: filePath,
    };
  }

  /**
   * Get uploaded file content
   * @param fileId - File ID (unique file name)
   * @returns File content
   */
  async getUploadedFile(fileId: string): Promise<string> {
    const filePath = path.join(this.config.uploadsDir, fileId);
    return await readFileContent(filePath);
  }

  /**
   * Check if uploaded file exists
   * @param fileId - File ID
   * @returns True if file exists
   */
  async uploadedFileExists(fileId: string): Promise<boolean> {
    const filePath = path.join(this.config.uploadsDir, fileId);
    return await fileExists(filePath);
  }

  /**
   * Delete uploaded file
   * @param fileId - File ID
   */
  async deleteUploadedFile(fileId: string): Promise<void> {
    const filePath = path.join(this.config.uploadsDir, fileId);
    await deleteFile(filePath);
  }

  /**
   * List all uploaded files
   * @returns Array of file IDs
   */
  async listUploadedFiles(): Promise<string[]> {
    return await listFiles(this.config.uploadsDir);
  }

  /**
   * Save analysis result to file
   * @param result - Analysis result
   * @returns Path to saved file
   */
  async saveAnalysisResult(result: AnalysisResult): Promise<string> {
    const fileName = `${result.metadata.id}.json`;
    const filePath = path.join(this.config.resultsDir, fileName);
    const content = JSON.stringify(result, null, 2);

    await writeFileContent(filePath, content);
    return filePath;
  }

  /**
   * Get analysis result from file
   * @param resultId - Analysis result ID
   * @returns Analysis result
   */
  async getAnalysisResult(resultId: string): Promise<AnalysisResult> {
    const fileName = `${resultId}.json`;
    const filePath = path.join(this.config.resultsDir, fileName);
    const content = await readFileContent(filePath);
    return JSON.parse(content) as AnalysisResult;
  }

  /**
   * Check if analysis result file exists
   * @param resultId - Analysis result ID
   * @returns True if result exists
   */
  async analysisResultExists(resultId: string): Promise<boolean> {
    const fileName = `${resultId}.json`;
    const filePath = path.join(this.config.resultsDir, fileName);
    return await fileExists(filePath);
  }

  /**
   * Delete analysis result file
   * @param resultId - Analysis result ID
   */
  async deleteAnalysisResult(resultId: string): Promise<void> {
    const fileName = `${resultId}.json`;
    const filePath = path.join(this.config.resultsDir, fileName);
    await deleteFile(filePath);
  }

  /**
   * List all analysis result IDs
   * @returns Array of result IDs
   */
  async listAnalysisResults(): Promise<string[]> {
    const files = await listFiles(this.config.resultsDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.basename(f, '.json'));
  }

  /**
   * Clear all uploaded files
   */
  async clearUploads(): Promise<void> {
    const files = await this.listUploadedFiles();
    await Promise.all(files.map((fileId) => this.deleteUploadedFile(fileId)));
  }

  /**
   * Clear all analysis results
   */
  async clearResults(): Promise<void> {
    const results = await this.listAnalysisResults();
    await Promise.all(results.map((resultId) => this.deleteAnalysisResult(resultId)));
  }

  /**
   * Clear all data (uploads and results)
   */
  async clearAll(): Promise<void> {
    await this.clearUploads();
    await this.clearResults();
  }

  /**
   * Get storage statistics
   * @returns Object containing storage statistics
   */
  async getStats(): Promise<{
    uploadsCount: number;
    resultsCount: number;
    uploadsDir: string;
    resultsDir: string;
  }> {
    const uploads = await this.listUploadedFiles();
    const results = await this.listAnalysisResults();

    return {
      uploadsCount: uploads.length,
      resultsCount: results.length,
      uploadsDir: this.config.uploadsDir,
      resultsDir: this.config.resultsDir,
    };
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  getConfig(): FileStorageConfig {
    return { ...this.config };
  }
}

// Singleton instance
let storageInstance: FileStorage | null = null;

/**
 * Get the singleton file storage instance
 * @param config - Optional configuration
 * @returns The file storage instance
 */
export async function getFileStorage(config?: Partial<FileStorageConfig>): Promise<FileStorage> {
  if (!storageInstance) {
    storageInstance = new FileStorage(config);
    await storageInstance.initialize();
  }
  return storageInstance;
}

/**
 * Reset the file storage instance (useful for testing)
 */
export function resetFileStorage(): void {
  storageInstance = null;
}
