/**
 * Unit tests for Report Generator Component
 */

describe('ReportGeneratorComponent', () => {
  let container;
  let onGenerateReport;
  let onCancelReport;

  const sampleAnalysis = {
    stats: {
      totalIssues: 3,
      criticalIssues: 1,
      highIssues: 1,
      mediumIssues: 1,
      lowIssues: 0,
    },
    issues: [
      {
        id: 'issue-1',
        type: 'glide-query-no-conditions',
        severity: 'critical',
        message: 'Missing query conditions',
        line: 12,
        column: 4,
        fileName: 'incidentScript.js',
      },
      {
        id: 'issue-2',
        type: 'ts-no-any',
        severity: 'high',
        message: 'Avoid any type',
        line: 8,
        column: 10,
        fileName: 'types.ts',
      },
    ],
    suggestions: [
      {
        id: 'suggestion-1',
        title: 'Add query conditions',
        description: 'Add addQuery with key conditions to restrict results.',
        confidence: 'low',
        confidenceScore: 40,
        impact: {
          estimatedTime: '15 minutes',
          breakingChange: false,
          testingRequired: true,
        },
      },
    ],
  };

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="container"></div>';
    container = document.getElementById('container');
    onGenerateReport = jest.fn();
    onCancelReport = jest.fn();

    require('../../../src/ui/components/report-generator.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function initComponent() {
    return window.ReportGeneratorComponent.init({
      container,
      analysisResult: sampleAnalysis,
      fileName: 'incidentScript.js',
      onGenerateReport,
      onCancelReport,
    });
  }

  function getSection(sectionType) {
    return Array.from(container.querySelectorAll('input[name="sections"]'))
      .find((input) => input.value === sectionType);
  }

  function getFormat(format) {
    return Array.from(container.querySelectorAll('input[name="format"]'))
      .find((input) => input.value === format);
  }

  test('should render report options', () => {
    initComponent();

    const formatOptions = container.querySelectorAll('input[name="format"]');
    const sectionOptions = container.querySelectorAll('input[name="sections"]');
    const severityOptions = container.querySelectorAll('input[name="severity"]');

    expect(formatOptions).toHaveLength(3);
    expect(sectionOptions).toHaveLength(5);
    expect(severityOptions).toHaveLength(4);
    expect(formatOptions[0].checked).toBe(true);
  });

  test('should collect report options on generate', () => {
    initComponent();

    const htmlOption = getFormat('html');
    htmlOption.checked = true;

    const commentsInput = container.querySelector('#report-comments');
    commentsInput.value = 'Focus on critical issues';

    const severityLow = Array.from(container.querySelectorAll('input[name="severity"]'))
      .find((input) => input.value === 'low');
    severityLow.checked = true;

    const generateBtn = container.querySelector('#generate-report-btn');
    generateBtn.click();

    expect(onGenerateReport).toHaveBeenCalledTimes(1);
    const options = onGenerateReport.mock.calls[0][0];
    expect(options.format).toBe('html');
    expect(options.comments).toBe('Focus on critical issues');
    expect(options.severities).toContain('low');
    expect(options.sections).toContain('issues');
  });

  test('should generate HTML preview', () => {
    initComponent();

    const previewBtn = container.querySelector('#preview-report-btn');
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => ({
      document: {
        write: jest.fn(),
        close: jest.fn(),
      },
    }));

    previewBtn.click();

    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  test('should call cancel callback', () => {
    initComponent();

    const cancelBtn = container.querySelector('#cancel-report-btn');
    cancelBtn.click();

    expect(onCancelReport).toHaveBeenCalledTimes(1);
  });
});
