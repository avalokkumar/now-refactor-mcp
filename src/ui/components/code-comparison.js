/**
 * Code Comparison Component
 * Displays side-by-side comparison of original and refactored code
 */

const CodeComparisonComponent = (function() {
  // Private variables
  let container = null;
  let originalCode = '';
  let refactoredCode = '';
  let suggestion = null;
  let originalEditor = null;
  let refactoredEditor = null;

  // DOM creation
  function createDOM() {
    // Generate refactored code based on suggestion transformations
    refactoredCode = applyTransformations(originalCode, suggestion.transformations || []);
    
    const template = `
      <div class="code-comparison">
        <div class="code-panel">
          <div class="code-panel-header">Original Code</div>
          <div class="code-editor" id="original-code-editor"></div>
        </div>
        <div class="code-panel">
          <div class="code-panel-header">Refactored Code</div>
          <div class="code-editor" id="refactored-code-editor"></div>
        </div>
      </div>
      <div class="comparison-details">
        <div class="comparison-info">
          <h3>Refactoring Details</h3>
          <p><strong>Title:</strong> ${escapeHTML(suggestion.title)}</p>
          <p><strong>Description:</strong> ${escapeHTML(suggestion.description)}</p>
          <p><strong>Confidence:</strong> ${suggestion.confidence || 'Medium'} (${suggestion.confidenceScore || 50}%)</p>
          <p><strong>Estimated Time:</strong> ${suggestion.impact ? escapeHTML(suggestion.impact.estimatedTime) : 'Unknown'}</p>
          <p><strong>Breaking Change:</strong> ${suggestion.impact && suggestion.impact.breakingChange ? 'Yes' : 'No'}</p>
          <p><strong>Testing Required:</strong> ${suggestion.impact && suggestion.impact.testingRequired ? 'Yes' : 'No'}</p>
        </div>
      </div>
    `;
    
    container.innerHTML = template;
    
    // Initialize code editors
    initializeCodeEditors();
  }

  // Initialize CodeMirror editors
  function initializeCodeEditors() {
    // Check if CodeMirror is available
    if (!window.CodeMirror) {
      console.error('CodeMirror not found');
      return;
    }
    
    // Determine language mode
    const mode = determineLanguageMode(suggestion);
    
    // Initialize original code editor
    originalEditor = CodeMirror(document.getElementById('original-code-editor'), {
      value: originalCode,
      mode: mode,
      theme: 'monokai',
      lineNumbers: true,
      readOnly: true,
      matchBrackets: true,
      styleActiveLine: true,
    });
    
    // Initialize refactored code editor
    refactoredEditor = CodeMirror(document.getElementById('refactored-code-editor'), {
      value: refactoredCode,
      mode: mode,
      theme: 'monokai',
      lineNumbers: true,
      readOnly: true,
      matchBrackets: true,
      styleActiveLine: true,
    });
    
    // Highlight changed lines
    highlightChanges();
  }

  // Determine language mode for CodeMirror
  function determineLanguageMode(suggestion) {
    // Default to JavaScript
    let mode = 'javascript';
    
    // Check if we can determine TypeScript from suggestion
    if (suggestion && suggestion.ruleId && suggestion.ruleId.startsWith('ts-')) {
      mode = 'text/typescript';
    }
    
    return mode;
  }

  // Apply transformations to code
  function applyTransformations(code, transformations) {
    if (!transformations || transformations.length === 0) {
      // If no transformations or preview available, return original code
      return suggestion.preview || code;
    }
    
    // If suggestion has a preview, use it instead of applying transformations
    if (suggestion.preview) {
      return suggestion.preview;
    }
    
    let result = code;
    const lines = result.split('\n');
    
    // Apply transformations in reverse order to maintain line numbers
    const sortedTransformations = [...transformations].sort((a, b) => b.startLine - a.startLine);
    
    for (const transformation of sortedTransformations) {
      switch (transformation.type) {
        case 'replace':
          result = applyReplaceTransformation(result, transformation);
          break;
        case 'insert':
          result = applyInsertTransformation(result, transformation);
          break;
        case 'delete':
          result = applyDeleteTransformation(result, transformation);
          break;
        default:
          console.warn(`Unsupported transformation type: ${transformation.type}`);
      }
    }
    
    return result;
  }

  // Apply replace transformation
  function applyReplaceTransformation(code, transformation) {
    const lines = code.split('\n');
    
    // Simple line-based replacement
    if (transformation.startLine === transformation.endLine) {
      const line = lines[transformation.startLine - 1];
      const before = line.substring(0, transformation.startColumn);
      const after = line.substring(transformation.endColumn);
      lines[transformation.startLine - 1] = before + transformation.newCode + after;
    } else {
      // Multi-line transformation
      const firstLine = lines[transformation.startLine - 1];
      const lastLine = lines[transformation.endLine - 1];
      
      const before = firstLine.substring(0, transformation.startColumn);
      const after = lastLine.substring(transformation.endColumn);
      
      // Remove lines in between
      lines.splice(
        transformation.startLine - 1,
        transformation.endLine - transformation.startLine + 1,
        before + transformation.newCode + after
      );
    }
    
    return lines.join('\n');
  }

  // Apply insert transformation
  function applyInsertTransformation(code, transformation) {
    const lines = code.split('\n');
    
    const line = lines[transformation.startLine - 1];
    const before = line.substring(0, transformation.startColumn);
    const after = line.substring(transformation.startColumn);
    
    lines[transformation.startLine - 1] = before + transformation.newCode + after;
    
    return lines.join('\n');
  }

  // Apply delete transformation
  function applyDeleteTransformation(code, transformation) {
    const lines = code.split('\n');
    
    // Simple line-based deletion
    if (transformation.startLine === transformation.endLine) {
      const line = lines[transformation.startLine - 1];
      const before = line.substring(0, transformation.startColumn);
      const after = line.substring(transformation.endColumn);
      lines[transformation.startLine - 1] = before + after;
    } else {
      // Multi-line deletion
      const firstLine = lines[transformation.startLine - 1];
      const lastLine = lines[transformation.endLine - 1];
      
      const before = firstLine.substring(0, transformation.startColumn);
      const after = lastLine.substring(transformation.endColumn);
      
      // Remove lines in between
      lines.splice(
        transformation.startLine - 1,
        transformation.endLine - transformation.startLine + 1,
        before + after
      );
    }
    
    return lines.join('\n');
  }

  // Highlight changed lines in both editors
  function highlightChanges() {
    if (!originalEditor || !refactoredEditor) return;
    
    const originalLines = originalCode.split('\n');
    const refactoredLines = refactoredCode.split('\n');
    
    // Simple diff: highlight lines that are different
    const minLength = Math.min(originalLines.length, refactoredLines.length);
    
    for (let i = 0; i < minLength; i++) {
      if (originalLines[i] !== refactoredLines[i]) {
        originalEditor.addLineClass(i, 'background', 'line-changed');
        refactoredEditor.addLineClass(i, 'background', 'line-changed');
      }
    }
    
    // Highlight added/removed lines
    if (originalLines.length < refactoredLines.length) {
      for (let i = originalLines.length; i < refactoredLines.length; i++) {
        refactoredEditor.addLineClass(i, 'background', 'line-added');
      }
    } else if (originalLines.length > refactoredLines.length) {
      for (let i = refactoredLines.length; i < originalLines.length; i++) {
        originalEditor.addLineClass(i, 'background', 'line-removed');
      }
    }
  }

  // Helper function to escape HTML
  function escapeHTML(str) {
    if (!str) return '';
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Public API
  return {
    init: function(options) {
      container = options.container;
      originalCode = options.originalCode || '';
      suggestion = options.suggestion || { title: 'Unknown', description: 'No description' };
      
      createDOM();
      
      return this;
    },
    
    getRefactoredCode: function() {
      return refactoredCode;
    }
  };
})();

// Export for global use
window.CodeComparisonComponent = CodeComparisonComponent;
