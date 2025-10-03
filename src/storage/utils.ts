/**
 * Utility functions for file operations
 * Provides helper functions for file system operations
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath - Path to the directory
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Check if a file exists
 * @param filePath - Path to the file
 * @returns True if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * @param filePath - Path to the file
 * @returns File size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}

/**
 * Read file content
 * @param filePath - Path to the file
 * @param encoding - File encoding (default: utf8)
 * @returns File content as string
 */
export async function readFileContent(
  filePath: string,
  encoding: BufferEncoding = 'utf8'
): Promise<string> {
  const content = await readFile(filePath, encoding);
  return content;
}

/**
 * Write content to file
 * @param filePath - Path to the file
 * @param content - Content to write
 * @param encoding - File encoding (default: utf8)
 */
export async function writeFileContent(
  filePath: string,
  content: string,
  encoding: BufferEncoding = 'utf8'
): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDirectory(dir);
  await writeFile(filePath, content, encoding);
}

/**
 * Delete a file
 * @param filePath - Path to the file
 */
export async function deleteFile(filePath: string): Promise<void> {
  await unlink(filePath);
}

/**
 * List files in a directory
 * @param dirPath - Path to the directory
 * @returns Array of file names
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    const files = await readdir(dirPath);
    return files;
  } catch {
    return [];
  }
}

/**
 * Generate a unique file name with timestamp
 * @param originalName - Original file name
 * @returns Unique file name
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  return `${baseName}_${timestamp}_${random}${ext}`;
}

/**
 * Sanitize file name by removing special characters
 * @param fileName - File name to sanitize
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Get file extension
 * @param fileName - File name
 * @returns File extension (without dot)
 */
export function getFileExtension(fileName: string): string {
  return path.extname(fileName).slice(1).toLowerCase();
}

/**
 * Check if file is a JavaScript file
 * @param fileName - File name
 * @returns True if JavaScript file
 */
export function isJavaScriptFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ext === 'js' || ext === 'mjs' || ext === 'cjs';
}

/**
 * Check if file is a TypeScript file
 * @param fileName - File name
 * @returns True if TypeScript file
 */
export function isTypeScriptFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ext === 'ts' || ext === 'tsx' || ext === 'mts' || ext === 'cts';
}

/**
 * Determine language from file name
 * @param fileName - File name
 * @returns Language ('javascript', 'typescript', or 'unknown')
 */
export function determineLanguage(fileName: string): 'javascript' | 'typescript' | 'unknown' {
  if (isJavaScriptFile(fileName)) {
    return 'javascript';
  }
  if (isTypeScriptFile(fileName)) {
    return 'typescript';
  }
  return 'unknown';
}
