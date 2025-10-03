# Feature Guide: Refactoring Suggestions & Code Snippets

This guide explains how to use the refactoring suggestions and code snippet features in the ServiceNow Code Intelligence MCP.

## Refactoring Suggestions

Refactoring suggestions provide actionable recommendations to improve your code based on detected issues.

### How It Works

1. The analyzer detects issues in your code
2. The refactoring engine generates suggestions for fixing these issues
3. Suggestions are displayed in the UI with details about the proposed changes

### Using Refactoring Suggestions

#### Via Web Interface

1. Upload and analyze your code file
2. Navigate to the "Suggestions" tab in the results view
3. Each suggestion includes:
   - Title and description
   - Estimated effort to implement
   - Confidence level
   - Before/after code comparison

4. To view a suggestion in detail:
   - Click on a suggestion card to expand it
   - Review the proposed changes
   - See the explanation of why this change is recommended

#### Via API

You can get refactoring suggestions programmatically:

```bash
# Get suggestions for a specific analysis
curl http://localhost:3000/api/analysis/[analysisId]/suggestions

# Apply a refactoring suggestion
curl -X POST http://localhost:3000/api/refactor/apply \
  -H "Content-Type: application/json" \
  -d '{"suggestionId": "suggestion-123", "analysisId": "analysis-456"}'
```

### Available Refactoring Types

The system currently supports these refactoring types:

1. **GlideScript Query Refactorings**
   - Replace nested queries with GlideAggregate
   - Add query conditions to improve performance

2. **GlideScript API Refactorings**
   - Replace deprecated GlideAjax methods
   - Convert synchronous calls to asynchronous patterns
   - Replace gs.log with gs.error for error messages

3. **TypeScript Refactorings**
   - Replace 'any' type with more specific types
   - Add missing type definitions
   - Remove unused imports

## Code Snippets

The code snippet feature allows you to view the exact code where an issue was detected, with syntax highlighting and line highlighting.

### How It Works

1. Each issue in the results view has a "Show Code" button
2. Clicking this button fetches the relevant code snippet from the server
3. The snippet is displayed with the problematic line highlighted

### Using Code Snippets

#### Via Web Interface

1. Upload and analyze your code file
2. Navigate to the "Issues" tab in the results view
3. For any issue, click the "Show Code" button
4. The code snippet will appear with:
   - Line numbers
   - Syntax highlighting
   - The issue line highlighted in yellow
5. Click "Hide Code" to collapse the snippet

#### Via API

You can fetch code snippets programmatically:

```bash
# Get a code snippet for a specific file and line range
curl "http://localhost:3000/api/code-snippet?fileName=example.js&startLine=10&endLine=20"
```

Response format:

```json
{
  "fileName": "example.js",
  "startLine": 10,
  "endLine": 20,
  "totalLines": 11,
  "snippet": "<span class=\"highlight-line\">10: const query = new GlideRecord('incident');</span>\n<span class=\"\">11: query.query();</span>\n..."
}
```

### Customizing Code Snippets

You can adjust the number of context lines shown around the issue:

```bash
# Show 5 lines before and after the issue line
curl "http://localhost:3000/api/code-snippet?fileName=example.js&startLine=15&endLine=25"
```

## Integration Examples

### VS Code Extension

The VS Code extension uses these features to provide:

1. In-editor refactoring suggestions
2. Quick fixes based on detected issues
3. Hover information with code snippets

### CI/CD Integration

In a CI/CD pipeline, you can:

1. Run the analyzer on your codebase
2. Generate a report of issues and suggestions
3. Fail the build if critical issues are detected

Example Jenkins pipeline:

```groovy
pipeline {
    agent any
    stages {
        stage('Code Analysis') {
            steps {
                sh 'npm install -g @servicenow/code-intelligence-mcp'
                sh 'code-intelligence-mcp analyze --dir ./src --format json > analysis.json'
                sh 'node ./scripts/check-critical-issues.js analysis.json'
            }
        }
    }
}
```

## Best Practices

1. **Review Suggestions Carefully**: Not all suggestions may be appropriate for your specific use case
2. **Prioritize High Confidence Suggestions**: Start with suggestions that have high confidence scores
3. **Test After Refactoring**: Always test your code after applying refactoring suggestions
4. **Use Code Snippets for Context**: View the surrounding code to understand the full context of an issue

## Troubleshooting

### Refactoring Suggestions Not Appearing

If you're not seeing refactoring suggestions:

1. Check that the rule engine is properly initialized
2. Verify that refactoring providers are registered for the detected issues
3. Make sure the file type is supported by the refactoring engine

### Code Snippets Not Loading

If code snippets aren't loading:

1. Check that the file is accessible to the server
2. Verify that the line numbers are within the file's range
3. Check the server logs for any file access errors

## Extending the Features

### Creating Custom Refactoring Providers

You can create custom refactoring providers for your specific needs:

1. Create a new provider class that implements the `RefactoringProvider` interface
2. Register your provider in the refactoring engine initializer
3. Your provider will now generate suggestions for matching issues

Example custom provider:

```typescript
import { RefactoringProvider, RefactoringContext, RefactoringSuggestion } from '../models';

export class MyCustomRefactoringProvider implements RefactoringProvider {
  ruleId = 'my-custom-rule';

  canRefactor(violation) {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(context) {
    // Generate and return suggestions
  }
}
```

### Customizing Code Snippet Display

You can customize how code snippets are displayed by modifying:

1. The CSS styles in `src/ui/components/results-display.css`
2. The snippet formatting logic in `src/api/controllers/snippet-controller.ts`

## Conclusion

The refactoring suggestions and code snippet features make the ServiceNow Code Intelligence MCP a powerful tool for improving code quality. By providing actionable suggestions and contextual code views, developers can quickly identify and fix issues in their code.
