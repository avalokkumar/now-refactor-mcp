/**
 * File upload middleware
 * Handles file uploads for code analysis
 */

import multer from 'multer';
import path from 'path';
import { Request } from 'express';

/**
 * Upload configuration
 */
export interface UploadConfig {
  maxFileSize: number; // bytes
  allowedExtensions: string[];
  uploadDir: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.js', '.ts', '.jsx', '.tsx'],
  uploadDir: 'uploads/',
};

/**
 * Create upload middleware
 */
export function createUploadMiddleware(config?: Partial<UploadConfig>) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Configure storage
  const storage = multer.memoryStorage(); // Store in memory for processing

  // File filter
  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (finalConfig.allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${finalConfig.allowedExtensions.join(', ')}`));
    }
  };

  // Create multer instance
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: finalConfig.maxFileSize,
    },
  });

  return upload;
}

/**
 * Default upload middleware instance
 */
export const uploadMiddleware = createUploadMiddleware();

/**
 * Single file upload
 */
export const uploadSingle = uploadMiddleware.single('file');

/**
 * Multiple files upload
 */
export const uploadMultiple = uploadMiddleware.array('files', 10);
