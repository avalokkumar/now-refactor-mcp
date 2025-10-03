/**
 * Unit tests for Refactoring Engine
 */

import {
  RefactoringEngine,
  getRefactoringEngine,
  resetRefactoringEngine,
  RefactoringProvider,
  RefactoringContext,
  RefactoringSuggestion,
  RefactoringType,
  ConfidenceLevel,
} from '../../src/refactor';
import { getJavaScriptParser } from '../../src/parser';
import { RuleViolation } from '../../src/rules';
import { IssueSeverity } from '../../src/storage';

// Mock refactoring provider
class MockRefactoringProvider implements RefactoringProvider {
  ruleId = 'mock-rule';

  canRefactor(violation: RuleViolation): boolean {
    return violation.ruleId === this.ruleId;
  }

  async generateSuggestions(
    context: RefactoringContext
  ): Promise<RefactoringSuggestion[]> {
    return [
      {
        id: 'mock-suggestion-1',
        ruleId: this.ruleId,
        title: 'Mock Refactoring',
        description: 'A mock refactoring suggestion',
        transformations: [
          {
            type: RefactoringType.REPLACE,
            startLine: 1,
            startColumn: 0,
            endLine: 1,
            endColumn: 10,
            originalCode: 'old code',
            newCode: 'new code',
            description: 'Replace code',
          },
        ],
        confidence: ConfidenceLevel.HIGH,
        confidenceScore: 90,
        reasoning: 'Mock reasoning',
        impact: {
          linesChanged: 1,
          complexity: 'low',
          breakingChange: false,
          testingRequired: false,
          estimatedTime: '1 minute',
        },
      },
    ];
  }
}

describe('RefactoringEngine', () => {
  let engine: RefactoringEngine;
  let parser: ReturnType<typeof getJavaScriptParser>;

  beforeEach(() => {
    engine = new RefactoringEngine();
    parser = getJavaScriptParser();
  });

  afterEach(() => {
    resetRefactoringEngine();
  });

  describe('Provider Registration', () => {
    test('should register a provider', () => {
      const provider = new MockRefactoringProvider();
      engine.registerProvider(provider);

      const providers = engine.getProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].ruleId).toBe('mock-rule');
    });

    test('should unregister a provider', () => {
      const provider = new MockRefactoringProvider();
      engine.registerProvider(provider);
      engine.unregisterProvider('mock-rule');

      const providers = engine.getProviders();
      expect(providers).toHaveLength(0);
    });

    test('should get provider by rule ID', () => {
      const provider = new MockRefactoringProvider();
      engine.registerProvider(provider);

      const retrieved = engine.getProvider('mock-rule');
      expect(retrieved).toBeDefined();
      expect(retrieved?.ruleId).toBe('mock-rule');
    });

    test('should return undefined for non-existent provider', () => {
      const retrieved = engine.getProvider('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Suggestion Generation', () => {
    test('should generate suggestions for violations', async () => {
      const provider = new MockRefactoringProvider();
      engine.registerProvider(provider);

      const code = 'var x = 5;';
      const parseResult = parser.parse(code, 'test.js');

      const violations: RuleViolation[] = [
        {
          ruleId: 'mock-rule',
          message: 'Mock violation',
          severity: IssueSeverity.MEDIUM,
          line: 1,
          column: 0,
        },
      ];

      const result = await engine.generateSuggestions(
        parseResult,
        violations,
        'test.js'
      );

      expect(result.totalSuggestions).toBe(1);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].ruleId).toBe('mock-rule');
      expect(result.fileName).toBe('test.js');
      expect(result.language).toBe('javascript');
    });

    test('should not generate suggestions for violations without providers', async () => {
      const code = 'var x = 5;';
      const parseResult = parser.parse(code, 'test.js');

      const violations: RuleViolation[] = [
        {
          ruleId: 'unknown-rule',
          message: 'Unknown violation',
          severity: IssueSeverity.MEDIUM,
          line: 1,
          column: 0,
        },
      ];

      const result = await engine.generateSuggestions(
        parseResult,
        violations,
        'test.js'
      );

      expect(result.totalSuggestions).toBe(0);
      expect(result.suggestions).toHaveLength(0);
    });

    test('should limit suggestions per violation', async () => {
      class MultiSuggestionProvider implements RefactoringProvider {
        ruleId = 'multi-rule';

        canRefactor(): boolean {
          return true;
        }

        async generateSuggestions(): Promise<RefactoringSuggestion[]> {
          return Array(10)
            .fill(null)
            .map((_, i) => ({
              id: `suggestion-${i}`,
              ruleId: this.ruleId,
              title: `Suggestion ${i}`,
              description: 'Description',
              transformations: [],
              confidence: ConfidenceLevel.MEDIUM,
              confidenceScore: 50,
              reasoning: 'Reasoning',
              impact: {
                linesChanged: 1,
                complexity: 'low',
                breakingChange: false,
                testingRequired: false,
                estimatedTime: '1 minute',
              },
            }));
        }
      }

      const limitedEngine = new RefactoringEngine({ maxSuggestionsPerViolation: 3 });
      limitedEngine.registerProvider(new MultiSuggestionProvider());

      const code = 'var x = 5;';
      const parseResult = parser.parse(code, 'test.js');

      const violations: RuleViolation[] = [
        {
          ruleId: 'multi-rule',
          message: 'Violation',
          severity: IssueSeverity.MEDIUM,
          line: 1,
          column: 0,
        },
      ];

      const result = await limitedEngine.generateSuggestions(
        parseResult,
        violations,
        'test.js'
      );

      expect(result.totalSuggestions).toBe(3);
    });
  });

  describe('Applying Refactorings', () => {
    test('should apply a simple refactoring', async () => {
      const suggestion: RefactoringSuggestion = {
        id: 'test-1',
        ruleId: 'test-rule',
        title: 'Test',
        description: 'Test refactoring',
        transformations: [
          {
            type: RefactoringType.REPLACE,
            startLine: 1,
            startColumn: 4,
            endLine: 1,
            endColumn: 5,
            originalCode: 'x',
            newCode: 'y',
            description: 'Replace x with y',
          },
        ],
        confidence: ConfidenceLevel.HIGH,
        confidenceScore: 90,
        reasoning: 'Test',
        impact: {
          linesChanged: 1,
          complexity: 'low',
          breakingChange: false,
          testingRequired: false,
          estimatedTime: '1 minute',
        },
      };

      const sourceCode = 'var x = 5;';
      const result = await engine.applyRefactoring(suggestion, sourceCode, 'test.js');

      expect(result.success).toBe(true);
      expect(result.refactoredCode).toContain('var y');
    });

    test('should handle refactoring errors', async () => {
      const suggestion: RefactoringSuggestion = {
        id: 'test-1',
        ruleId: 'test-rule',
        title: 'Test',
        description: 'Test refactoring',
        transformations: [
          {
            type: RefactoringType.REPLACE,
            startLine: 100, // Invalid line
            startColumn: 0,
            endLine: 100,
            endColumn: 10,
            originalCode: 'old',
            newCode: 'new',
            description: 'Replace',
          },
        ],
        confidence: ConfidenceLevel.HIGH,
        confidenceScore: 90,
        reasoning: 'Test',
        impact: {
          linesChanged: 1,
          complexity: 'low',
          breakingChange: false,
          testingRequired: false,
          estimatedTime: '1 minute',
        },
      };

      const sourceCode = 'var x = 5;';
      const result = await engine.applyRefactoring(suggestion, sourceCode, 'test.js');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Auto-fix', () => {
    test('should identify auto-fixable suggestions', () => {
      const suggestions: RefactoringSuggestion[] = [
        {
          id: '1',
          ruleId: 'rule1',
          title: 'High confidence',
          description: 'Description',
          transformations: [],
          confidence: ConfidenceLevel.HIGH,
          confidenceScore: 90,
          reasoning: 'Reasoning',
          impact: {
            linesChanged: 1,
            complexity: 'low',
            breakingChange: false,
            testingRequired: false,
            estimatedTime: '1 minute',
          },
        },
        {
          id: '2',
          ruleId: 'rule2',
          title: 'Low confidence',
          description: 'Description',
          transformations: [],
          confidence: ConfidenceLevel.LOW,
          confidenceScore: 40,
          reasoning: 'Reasoning',
          impact: {
            linesChanged: 1,
            complexity: 'low',
            breakingChange: false,
            testingRequired: false,
            estimatedTime: '1 minute',
          },
        },
      ];

      const autoFixEngine = new RefactoringEngine({ enableAutoFix: true });
      const autoFixable = autoFixEngine.getAutoFixableSuggestions(suggestions);

      expect(autoFixable).toHaveLength(1);
      expect(autoFixable[0].confidenceScore).toBeGreaterThanOrEqual(80);
    });

    test('should return empty array when auto-fix is disabled', () => {
      const suggestions: RefactoringSuggestion[] = [
        {
          id: '1',
          ruleId: 'rule1',
          title: 'High confidence',
          description: 'Description',
          transformations: [],
          confidence: ConfidenceLevel.HIGH,
          confidenceScore: 90,
          reasoning: 'Reasoning',
          impact: {
            linesChanged: 1,
            complexity: 'low',
            breakingChange: false,
            testingRequired: false,
            estimatedTime: '1 minute',
          },
        },
      ];

      const autoFixable = engine.getAutoFixableSuggestions(suggestions);
      expect(autoFixable).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    test('should return engine statistics', () => {
      const provider1 = new MockRefactoringProvider();
      const provider2 = new MockRefactoringProvider();
      provider2.ruleId = 'mock-rule-2';

      engine.registerProvider(provider1);
      engine.registerProvider(provider2);

      const stats = engine.getStats();

      expect(stats.totalProviders).toBe(2);
      expect(stats.providersByRule['mock-rule']).toBeDefined();
      expect(stats.providersByRule['mock-rule-2']).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const engine1 = getRefactoringEngine();
      const engine2 = getRefactoringEngine();
      expect(engine1).toBe(engine2);
    });

    test('should reset instance', () => {
      const engine1 = getRefactoringEngine();
      engine1.registerProvider(new MockRefactoringProvider());

      resetRefactoringEngine();
      const engine2 = getRefactoringEngine();

      expect(engine2.getProviders()).toHaveLength(0);
    });
  });
});
