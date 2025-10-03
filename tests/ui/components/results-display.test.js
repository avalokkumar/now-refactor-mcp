/**
 * Unit tests for Results Display Component
 */

describe('ResultsDisplayComponent', () => {
  let container;
  let onViewSuggestion;

  const sampleAnalysis = {
    stats: {
      totalIssues: 4,
      criticalIssues: 1,
      highIssues: 1,
      mediumIssues: 1,
      lowIssues: 1,
    },
    issues: [
      {
        id: 'issue-1',
        type: 'glide-deprecated-ajax',
        severity: 'critical',
        message: 'Deprecated API usage',
        line: 10,
        column: 2,
        fileName: 'script.js',
      },
    ],
    suggestions: [
      {
        id: 'suggestion-1',
        title: 'Replace getXMLWait with async getXML',
        description: 'Use asynchronous API instead of blocking call.',
        confidence: 'high',
        confidenceScore: 95,
        impact: {
          estimatedTime: '5 minutes',
          breakingChange: false,
          testingRequired: false,
        },
      },
    ],
  };

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="container"></div>';
    container = document.getElementById('container');
    onViewSuggestion = jest.fn();

    require('../../../src/ui/components/results-display.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function initComponent(analysis = sampleAnalysis, callback = onViewSuggestion) {
    return window.ResultsDisplayComponent.init({
      container,
      analysisResult: analysis,
      onViewSuggestion: callback,
    });
  }

  test('should render summary statistics', () => {
    initComponent();

    const statCards = container.querySelectorAll('.stat-card');
    expect(statCards).toHaveLength(5);
    expect(statCards[0].querySelector('h3').textContent).toBe('4');
    expect(statCards[1].querySelector('h3').textContent).toBe('1');
  });

  test('should switch between issues and suggestions tabs', () => {
    initComponent();

    const issueTab = container.querySelector('[data-tab="issues"]');
    const suggestionTab = container.querySelector('[data-tab="suggestions"]');
    const suggestionContent = container.querySelector('#suggestions-tab');

    expect(issueTab.classList.contains('active')).toBe(true);
    expect(suggestionContent.classList.contains('active')).toBe(false);

    suggestionTab.click();

    expect(issueTab.classList.contains('active')).toBe(false);
    expect(suggestionTab.classList.contains('active')).toBe(true);
    expect(suggestionContent.classList.contains('active')).toBe(true);
  });

  test('should call onViewSuggestion when view button clicked', () => {
    initComponent();

    const suggestionButton = container.querySelector('.view-suggestion-btn');
    expect(suggestionButton).not.toBeNull();

    suggestionButton.click();

    expect(onViewSuggestion).toHaveBeenCalledTimes(1);
    const suggestion = onViewSuggestion.mock.calls[0][0];
    expect(suggestion.id).toBe('suggestion-1');
  });

  test('should display empty state when no data', () => {
    const emptyAnalysis = { stats: {}, issues: [], suggestions: [] };
    initComponent(emptyAnalysis);

    const issueEmpty = container.querySelector('#issues-tab .empty-state');
    expect(issueEmpty.textContent).toContain('No issues');

    const suggestionTab = container.querySelector('[data-tab="suggestions"]');
    suggestionTab.click();
    const suggestionEmpty = container.querySelector('#suggestions-tab .empty-state');
    expect(suggestionEmpty.textContent).toContain('No refactoring suggestions');
  });

  test('should update results when new data provided', () => {
    const instance = initComponent();

    const newAnalysis = {
      stats: { totalIssues: 1, criticalIssues: 0, highIssues: 1, mediumIssues: 0, lowIssues: 0 },
      issues: [
        {
          id: 'issue-2',
          type: 'ts-no-any',
          severity: 'high',
          message: 'any type usage',
          line: 5,
          column: 10,
          fileName: 'types.ts',
        },
      ],
      suggestions: [],
    };

    instance.updateResults(newAnalysis);

    const statCards = container.querySelectorAll('.stat-card');
    expect(statCards[0].querySelector('h3').textContent).toBe('1');
    expect(container.querySelector('.issue-item .issue-title').textContent).toBe('ts-no-any');
  });
});
