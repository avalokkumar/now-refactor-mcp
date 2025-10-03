# User Guide

This guide provides detailed instructions for using the ServiceNow Code Intelligence & Refactoring MCP.

## Table of Contents

- [Introduction](#introduction)
- [Web UI](#web-ui)
- [API Usage](#api-usage)
- [MCP Integration](#mcp-integration)
- [Rules and Refactorings](#rules-and-refactorings)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Introduction

The ServiceNow Code Intelligence & Refactoring MCP helps you improve your code quality by:

1. Analyzing code for common issues and anti-patterns
2. Providing refactoring suggestions with confidence scores
3. Applying refactorings automatically or with manual review
4. Generating reports on code quality

The system supports two main types of code:

- **GlideScript**: ServiceNow server-side JavaScript
- **TypeScript**: Modern typed JavaScript

## Web UI

### Overview

The web UI provides an interactive interface for code analysis and refactoring. It consists of several components:

- **File Upload**: Upload code files for analysis
- **Results Display**: View analysis results and suggestions
- **Code Comparison**: Compare original and refactored code
- **Report Generator**: Generate and download reports

### Analyzing Code

1. Open the web UI at `http://localhost:3000`
2. Use the file upload component to select a file
   - Drag and drop a file onto the upload area
   - Or click the upload area to browse for a file
3. Click "Analyze Code" to start the analysis
4. Wait for the analysis to complete

### Viewing Results

The results display shows:

- **Summary Statistics**: Total issues and breakdown by severity
- **Issues Tab**: List of detected issues with details
- **Suggestions Tab**: List of refactoring suggestions

For each issue, you can see:
- Issue type
- Severity
- Location (file, line, column)
- Description

For each suggestion, you can see:
- Title
- Description
- Confidence score
- Estimated effort

### Comparing Code

1. Click "View Changes" on a suggestion
2. The code comparison view shows:
   - Original code on the left
   - Refactored code on the right
   - Highlighted changes
3. Review the changes carefully

### Applying Refactorings

1. In the code comparison view, click "Apply Changes" to apply the refactoring
2. Or click "Cancel" to go back without applying changes

### Generating Reports

1. Click "Download Report" to open the report generator
2. Select report options:
   - Format (PDF, HTML, JSON)
   - Sections to include
   - Severity filter
   - Report details
3. Click "Generate & Download" to create and download the report
4. Or click "Preview" to see the report in a new tab

## API Usage

### Authentication

Currently, the API does not require authentication. This will be added in a future release.

### Endpoints

#### Analyze Code

```
POST /api/analyze
```

Request body:
```json
{
  "code": "var x = 5;",
  "fileName": "example.js",
  "language": "javascript"
}
```

Response:
```json
{
  "analysisId": "analysis-1633123456789",
  "fileName": "example.js",
  "language": "javascript",
  "stats": {
    "totalIssues": 1,
    "criticalIssues": 0,
    "highIssues": 0,
    "mediumIssues": 1,
    "lowIssues": 0
  },
  "issues": [...],
  "suggestions": [...],
  "executionTime": 50
}
```

#### Upload and Analyze File

```
POST /api/upload
```

Request: Multipart form data with a file field named `file`

Response: Same as `POST /api/analyze` with additional file information

#### Get Analysis Result

```
GET /api/analysis/{id}
```

Response:
```json
{
  "metadata": {
    "id": "analysis-1633123456789",
    "fileName": "example.js",
    "fileSize": 10,
    "language": "javascript",
    "analysisDate": "2025-10-02T19:00:00.000Z",
    "duration": 50
  },
  "issues": [...],
  "suggestions": [...],
  "stats": {...}
}
```

#### List Analysis Results

```
GET /api/analyses
```

Query parameters:
- `language`: Filter by language (javascript or typescript)
- `fileName`: Filter by file name (partial match)
- `limit`: Maximum number of results to return
- `offset`: Number of results to skip

Response:
```json
{
  "count": 2,
  "results": [...]
}
```

#### Apply Refactoring

```
POST /api/refactor/apply
```

Request body:
```json
{
  "suggestionId": "suggestion-id-12345",
  "code": "var x = 5;",
  "fileName": "example.js"
}
```

Response:
```json
{
  "suggestionId": "suggestion-id-12345",
  "fileName": "example.js",
  "originalCode": "var x = 5;",
  "refactoredCode": "const x = 5;",
  "appliedAt": "2025-10-02T19:00:00.000Z",
  "success": true
}
```

#### Get Statistics

```
GET /api/stats
```

Response:
```json
{
  "analyses": {
    "totalAnalyses": 10,
    "javascriptAnalyses": 7,
    "typescriptAnalyses": 3,
    "totalIssues": 25
  },
  "rules": {...},
  "refactoring": {...}
}
```

### API Client Examples

#### cURL

```bash
# Analyze code
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 5;",
    "fileName": "example.js",
    "language": "javascript"
  }'

# Upload and analyze a file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/file.js"
```

#### JavaScript

```javascript
// Analyze code
async function analyzeCode(code, fileName, language) {
  const response = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      fileName,
      language,
    }),
  });
  
  return await response.json();
}

// Upload and analyze a file
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  return await response.json();
}
```

## MCP Integration

### Overview

The MCP server provides a Model Context Protocol interface for integration with ServiceNow Studio and other tools.

### Handlers

#### analyzeCode

Analyzes code and returns issues and refactoring suggestions.

```javascript
const result = await mcpClient.request('analyzeCode', {
  code: 'var x = 5;',
  fileName: 'example.js',
  language: 'javascript',
});
```

#### generateRefactorings

Generates refactoring suggestions for a specific issue.

```javascript
const result = await mcpClient.request('generateRefactorings', {
  code: 'var x = 5;',
  fileName: 'example.js',
  language: 'javascript',
  issueId: 'issue-id-12345',
});
```

#### applyRefactoring

Applies a refactoring suggestion to code.

```javascript
const result = await mcpClient.request('applyRefactoring', {
  code: 'var x = 5;',
  fileName: 'example.js',
  language: 'javascript',
  suggestionId: 'suggestion-id-12345',
});
```

### Integration with ServiceNow Studio

1. Configure the MCP server URL in ServiceNow Studio
2. Use the "Analyze Code" button in the editor
3. View issues and suggestions in the "Code Intelligence" panel
4. Apply refactorings directly from the panel

## Rules and Refactorings

### GlideScript Rules

| Rule ID | Description | Severity |
|---------|-------------|----------|
| glide-nested-query | Nested GlideRecord queries | High |
| glide-query-no-conditions | Query without conditions | Medium |
| glide-deprecated-ajax | Deprecated GlideAjax methods | Medium |
| glide-log-for-errors | Using gs.log for errors | Low |
| glide-hardcoded-values | Hardcoded values | Medium |

### TypeScript Rules

| Rule ID | Description | Severity |
|---------|-------------|----------|
| ts-missing-types | Missing type annotations | Medium |
| ts-no-any | Using any type | Medium |
| ts-unused-imports | Unused imports | Low |
| ts-large-loops | Large nested loops | Medium |

### Refactoring Types

| Type | Description | Example |
|------|-------------|---------|
| Replace | Replace code at a specific location | Replace gs.log with gs.error |
| Insert | Insert code at a specific location | Add query conditions |
| Delete | Remove code at a specific location | Remove unused imports |

### Confidence Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| High | 80-100% | Safe to auto-apply |
| Medium | 50-79% | Review recommended |
| Low | 0-49% | Manual review required |

## Best Practices

### Code Analysis

1. **Regular Analysis**: Analyze code regularly during development
2. **Focus on High Severity**: Address high severity issues first
3. **Review Suggestions**: Always review refactoring suggestions before applying
4. **Test After Refactoring**: Always test code after applying refactorings

### Refactoring

1. **Start Small**: Begin with simple, high-confidence refactorings
2. **Incremental Changes**: Make small, incremental changes
3. **Review Changes**: Always review changes before applying
4. **Test After Refactoring**: Always test code after applying refactorings

### Integration

1. **Automate Analysis**: Integrate code analysis into your CI/CD pipeline
2. **Track Progress**: Track code quality metrics over time
3. **Share Reports**: Share code quality reports with the team

## Advanced Usage

### Custom Rules

You can create custom rules by implementing the `Rule` interface:

```typescript
import { Rule, RuleContext, RuleViolation } from './rules';

export class MyCustomRule implements Rule {
  id = 'my-custom-rule';
  description = 'My custom rule description';
  severity = 'medium';
  
  execute(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    
    // Analyze code and add violations
    
    return violations;
  }
}
```

### Custom Refactorings

You can create custom refactoring providers by implementing the `RefactoringProvider` interface:

```typescript
import { RefactoringProvider, RefactoringContext, RefactoringSuggestion } from './refactor';

export class MyCustomRefactoringProvider implements RefactoringProvider {
  ruleId = 'my-custom-rule';
  
  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }
  
  async generateSuggestions(context: RefactoringContext): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];
    
    // Generate suggestions
    
    return suggestions;
  }
}
```

### Batch Processing

For processing multiple files, you can use the batch API:

```bash
curl -X POST http://localhost:3000/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "path": "file1.js",
        "content": "var x = 5;"
      },
      {
        "path": "file2.js",
        "content": "var y = 10;"
      }
    ]
  }'
```

### Configuration

You can configure the system using a configuration file:

```json
{
  "rules": {
    "glide-nested-query": {
      "enabled": true,
      "severity": "high"
    },
    "ts-no-any": {
      "enabled": true,
      "severity": "medium"
    }
  },
  "refactoring": {
    "maxSuggestionsPerViolation": 3,
    "enableAutoFix": false,
    "minConfidenceForAutoFix": 80
  }
}
```
