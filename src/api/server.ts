/**
 * REST API server implementation
 * Provides HTTP endpoints for code analysis and refactoring
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes';

/**
 * API server configuration
 */
export interface APIServerConfig {
  port: number;
  host: string;
  corsOrigin: string;
  maxRequestSize: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: APIServerConfig = {
  port: 3000,
  host: '0.0.0.0',
  corsOrigin: '*',
  maxRequestSize: '50mb',
};

/**
 * API server class
 * Manages Express server and routes
 */
export class APIServer {
  private app: Express;
  private config: APIServerConfig;
  private server: any;

  constructor(config?: Partial<APIServerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigin,
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: this.config.maxRequestSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.maxRequestSize }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // API routes
    this.app.use('/api', router);
    
    // Serve static UI files
    const uiPath = path.join(__dirname, '../../src/ui');
    console.log(`Serving UI files from: ${uiPath}`);
    this.app.use(express.static(uiPath));
    
    // Serve index.html for root path
    this.app.get('/', (req: Request, res: Response) => {
      res.sendFile(path.join(uiPath, 'index.html'));
    });

    // Serve documentation page
    this.app.get('/docs/user-guide', (req: Request, res: Response) => {
      res.sendFile(path.join(uiPath, 'docs/user-guide.html'));
    });
    
    // Serve about page
    this.app.get('/about', (req: Request, res: Response) => {
      res.sendFile(path.join(uiPath, 'about.html'));
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    });
  }

  /**
   * Start the server
   * @returns Promise that resolves when server is listening
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        console.log(`API Server listening on http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   * @returns Promise that resolves when server is closed
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err: Error) => {
          if (err) {
            reject(err);
          } else {
            console.log('API Server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get Express app instance
   * @returns Express app
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  getConfig(): APIServerConfig {
    return { ...this.config };
  }
}

// Singleton instance
let serverInstance: APIServer | null = null;

/**
 * Get the singleton API server instance
 * @param config - Optional configuration
 * @returns The API server instance
 */
export function getAPIServer(config?: Partial<APIServerConfig>): APIServer {
  if (!serverInstance) {
    serverInstance = new APIServer(config);
  }
  return serverInstance;
}

/**
 * Reset the API server instance (useful for testing)
 */
export function resetAPIServer(): void {
  serverInstance = null;
}
