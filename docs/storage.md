# Storage Implementation

This document describes the storage layer implementation for the ServiceNow Code Intelligence & Refactoring MCP project.

## Overview

The storage layer provides data persistence for analysis results and code templates. For the MVP, we use an in-memory database to avoid external dependencies while maintaining simplicity and fast access.

## Architecture

### In-Memory Database

The `InMemoryDatabase` class provides a simple, fast storage solution using JavaScript `Map` objects. Data is stored in memory and will be cleared when the server restarts.

**Key Features:**

- Fast read/write operations
- No external dependencies
- Query and filtering capabilities
- Singleton pattern for global access
- Type-safe with TypeScript

### File Storage

The `FileStorage` class provides file-based storage for uploaded code files and analysis results. Files are stored in the local file system within the project directory.

**Key Features:**

- Persistent storage on disk
- Automatic directory management
- File sanitization and unique naming
- Support for both code uploads and analysis results
- Configurable storage paths
- Singleton pattern for global access

### Data Models

All data structures are defined in `src/storage/models.ts`:

#### AnalysisResult

Represents a complete code analysis result with metadata, issues, and refactoring suggestions.

```typescript
interface AnalysisResult {
  metadata: AnalysisMetadata;
  issues: CodeIssue[];
  suggestions: RefactoringSuggestion[];
  stats: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}
```

#### CodeIssue

Represents a detected code issue or anti-pattern.

```typescript
interface CodeIssue {
  id: string;
  type: string;
  severity: IssueSeverity;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fileName: string;
}
```

#### RefactoringSuggestion

Represents a suggested code improvement.

```typescript
interface RefactoringSuggestion {
  id: string;
  issueId: string;
  description: string;
  beforeCode: string;
  afterCode: string;
  confidence: number; // 0-100
  explanation: string;
  tags: string[];
}
```

#### CodeTemplate

Represents a reusable refactoring pattern template.

```typescript
interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string;
  replacement: string;
  language: 'javascript' | 'typescript';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage

### Basic Operations

```typescript
import { getDatabase, AnalysisResult, IssueSeverity } from './storage';

// Get database instance
const db = getDatabase();

// Save analysis result
const result: AnalysisResult = {
  metadata: {
    id: 'analysis-1',
    fileName: 'myScript.js',
    fileSize: 2048,
    language: 'javascript',
    analysisDate: new Date(),
    duration: 150,
  },
  issues: [
    {
      id: 'issue-1',
      type: 'nested-query',
      severity: IssueSeverity.HIGH,
      message: 'Nested GlideRecord query detected',
      line: 10,
      column: 5,
      fileName: 'myScript.js',
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

db.saveAnalysisResult(result);

// Retrieve analysis result
const retrieved = db.getAnalysisResult('analysis-1');

// Query with filters
const jsResults = db.queryAnalysisResults({
  language: 'javascript',
  severity: IssueSeverity.HIGH,
  sortBy: 'date',
  sortOrder: 'desc',
  limit: 10,
});
```

### Code Templates

```typescript
import { getDatabase, CodeTemplate } from './storage';

const db = getDatabase();

// Save template
const template: CodeTemplate = {
  id: 'template-1',
  name: 'Optimize GlideRecord',
  description: 'Replace inefficient GlideRecord pattern',
  pattern: 'new GlideRecord\\(([^)]+)\\)',
  replacement: 'optimizedQuery($1)',
  language: 'javascript',
  tags: ['performance', 'gliderecord'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

db.saveCodeTemplate(template);

// Get templates by language
const jsTemplates = db.getCodeTemplatesByLanguage('javascript');

// Get templates by tag
const perfTemplates = db.getCodeTemplatesByTag('performance');
```

### File Storage Operations

```typescript
import { getFileStorage } from './storage';

// Get file storage instance
const storage = await getFileStorage({
  uploadsDir: './uploads',
  resultsDir: './results',
  maxFileSize: 10 * 1024 * 1024, // 10MB
});

// Save uploaded code file
const codeContent = 'var gr = new GlideRecord("incident");';
const { id, path } = await storage.saveUploadedFile('myScript.js', codeContent);

// Retrieve uploaded file
const content = await storage.getUploadedFile(id);

// Check if file exists
const exists = await storage.uploadedFileExists(id);

// Save analysis result to file
await storage.saveAnalysisResult(analysisResult);

// Load analysis result from file
const result = await storage.getAnalysisResult('analysis-1');

// Get storage statistics
const stats = await storage.getStats();
console.log(`Uploads: ${stats.uploadsCount}, Results: ${stats.resultsCount}`);
```

### Query Options

The `queryAnalysisResults` method supports powerful filtering and sorting:

```typescript
interface QueryOptions {
  fileName?: string;        // Filter by exact file name
  language?: 'javascript' | 'typescript';  // Filter by language
  severity?: IssueSeverity; // Filter by issue severity
  limit?: number;           // Limit results (pagination)
  offset?: number;          // Skip results (pagination)
  sortBy?: 'date' | 'severity' | 'fileName';  // Sort field
  sortOrder?: 'asc' | 'desc';  // Sort direction
}
```

### Database Statistics

```typescript
const stats = db.getStats();
console.log(stats);
// {
//   analysisResultsCount: 10,
//   codeTemplatesCount: 5,
//   totalIssuesCount: 25
// }
```

## API Reference

### InMemoryDatabase Methods

#### Analysis Results

- **`saveAnalysisResult(result: AnalysisResult): AnalysisResult`**
  - Saves an analysis result to the database
  - Returns the saved result

- **`getAnalysisResult(id: string): AnalysisResult | undefined`**
  - Retrieves an analysis result by ID
  - Returns undefined if not found

- **`queryAnalysisResults(options?: QueryOptions): AnalysisResult[]`**
  - Queries analysis results with filtering and sorting
  - Returns array of matching results

- **`deleteAnalysisResult(id: string): boolean`**
  - Deletes an analysis result by ID
  - Returns true if deleted, false if not found

- **`getAllAnalysisResults(): AnalysisResult[]`**
  - Returns all analysis results

- **`clearAnalysisResults(): void`**
  - Clears all analysis results

#### Code Templates

- **`saveCodeTemplate(template: CodeTemplate): CodeTemplate`**
  - Saves a code template
  - Returns the saved template

- **`getCodeTemplate(id: string): CodeTemplate | undefined`**
  - Retrieves a template by ID
  - Returns undefined if not found

- **`getAllCodeTemplates(): CodeTemplate[]`**
  - Returns all code templates

- **`getCodeTemplatesByLanguage(language: 'javascript' | 'typescript'): CodeTemplate[]`**
  - Returns templates for a specific language

- **`getCodeTemplatesByTag(tag: string): CodeTemplate[]`**
  - Returns templates with a specific tag

- **`deleteCodeTemplate(id: string): boolean`**
  - Deletes a template by ID
  - Returns true if deleted, false if not found

- **`clearCodeTemplates(): void`**
  - Clears all code templates

#### Utility Methods

- **`getStats(): { analysisResultsCount: number; codeTemplatesCount: number; totalIssuesCount: number }`**
  - Returns database statistics

- **`clearAll(): void`**
  - Clears all data from the database

### Singleton Functions

- **`getDatabase(): InMemoryDatabase`**
  - Returns the singleton database instance
  - Creates a new instance if none exists

- **`resetDatabase(): void`**
  - Resets the database instance (useful for testing)
  - Clears all data

## Testing

The storage layer includes comprehensive unit tests covering:

- Basic CRUD operations
- Query filtering and sorting
- Pagination
- Template management
- Singleton pattern
- Edge cases

Run tests with:

```bash
npm test -- tests/storage/in-memory-db.test.ts
```

## Performance Considerations

### Strengths

- **Fast**: In-memory operations are extremely fast
- **Simple**: No network latency or serialization overhead
- **Type-safe**: Full TypeScript support with no ORM complexity

### Limitations

- **Volatility**: Data is lost on server restart
- **Memory**: Limited by available RAM
- **Single-process**: No distributed storage

### Recommendations

- Use for MVP and development
- Consider adding persistence layer for production (e.g., SQLite, Redis)
- Monitor memory usage for large datasets
- Implement data export/import for backup

## Future Enhancements

Potential improvements for future versions:

1. **File-based Persistence**: Periodic snapshots to disk
2. **Redis Integration**: For distributed deployments
3. **Caching Layer**: LRU cache for frequently accessed data
4. **Compression**: Reduce memory footprint for large results
5. **Query Optimization**: Indexing for faster lookups
6. **Backup/Restore**: Export and import functionality

## Related Documentation

- [Project Structure](project-structure.md)
- [MCP Server](mcp-server.md)
- [API Documentation](api.md)
