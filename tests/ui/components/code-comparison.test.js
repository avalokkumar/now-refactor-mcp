/**
 * Unit tests for Code Comparison Component
 */

describe('CodeComparisonComponent', () => {
  let container;
  let CodeMirrorMock;

  const originalCode = "const greet = () => {\n  return 'hello';\n};";
  const suggestion = {
    id: 'suggestion-1',
    title: 'Convert to async',
    description: 'Use async/await syntax',
    ruleId: 'ts-no-any',
    confidence: 'medium',
    confidenceScore: 75,
    impact: {
      estimatedTime: '10 minutes',
      breakingChange: false,
      testingRequired: true,
    },
    preview: "async function greet() {\n  return 'hello';\n}",
  };

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="container"></div>';
    container = document.getElementById('container');

    CodeMirrorMock = jest.fn(() => ({
      addLineClass: jest.fn(),
      getDoc: jest.fn().mockReturnValue({ getValue: jest.fn() }),
    }));

    global.CodeMirror = CodeMirrorMock;

    require('../../../src/ui/components/code-comparison.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete global.CodeMirror;
  });

  function initComponent(customSuggestion = suggestion) {
    return window.CodeComparisonComponent.init({
      container,
      originalCode,
      suggestion: customSuggestion,
    });
  }

  test('should render code comparison panels', () => {
    initComponent();

    const comparison = container.querySelector('.code-comparison');
    expect(comparison).not.toBeNull();
    expect(CodeMirrorMock).toHaveBeenCalledTimes(2);
  });

  test('should use preview content for refactored code when available', () => {
    const instance = initComponent();
    const refactored = instance.getRefactoredCode();
    expect(refactored).toBe(suggestion.preview);
  });

  test('should handle suggestions without preview by returning original code', () => {
    const noPreviewSuggestion = { ...suggestion, preview: undefined, transformations: [] };
    const instance = initComponent(noPreviewSuggestion);
    const refactored = instance.getRefactoredCode();
    expect(refactored).toBe(originalCode);
  });
});
