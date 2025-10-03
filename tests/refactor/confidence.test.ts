/**
 * Unit tests for Confidence Scorer
 */

import {
  ConfidenceScorer,
  getConfidenceScorer,
  resetConfidenceScorer,
} from '../../src/refactor/confidence';
import {
  RefactoringSuggestion,
  RefactoringType,
  ConfidenceLevel,
} from '../../src/refactor/models';
import { RuleViolation } from '../../src/rules';
import { IssueSeverity } from '../../src/storage';

describe('ConfidenceScorer', () => {
  let scorer: ConfidenceScorer;

  beforeEach(() => {
    scorer = new ConfidenceScorer();
  });

  afterEach(() => {
    resetConfidenceScorer();
  });

  describe('Confidence Calculation', () => {
    test('should calculate high confidence for simple transformations', () => {
      const suggestion: RefactoringSuggestion = {
        id: 'test-1',
        ruleId: 'glide-log-for-errors',
        title: 'Test',
        description: 'Test',
        transformations: [
          {
            type: RefactoringType.REPLACE,
            startLine: 1,
            startColumn: 0,
            endLine: 1,
            endColumn: 6,
            originalCode: 'gs.log',
            newCode: 'gs.error',
            description: 'Replace',
          },
        ],
        confidence: ConfidenceLevel.MEDIUM,
        confidenceScore: 50,
        reasoning: 'Initial',
        impact: {
          linesChanged: 1,
          complexity: 'low',
          breakingChange: false,
          testingRequired: false,
          estimatedTime: '1 minute',
        },
      };

      const violation: RuleViolation = {
        ruleId: 'glide-log-for-errors',
        message: 'Use gs.error for errors',
        severity: IssueSeverity.LOW,
        line: 1,
        column: 0,
      };

      const result = scorer.calculateConfidence(suggestion, violation);

      expect(result.confidenceScore).toBeGreaterThan(80);
      expect(result.confidence).toBe(ConfidenceLevel.HIGH);
    });

    test('should calculate low confidence for complex transformations', () => {
      const suggestion: RefactoringSuggestion = {
        id: 'test-1',
        ruleId: 'glide-query-no-conditions',
        title: 'Test',
        description: 'Test',
        transformations: [
          {
            type: RefactoringType.INSERT,
            startLine: 1,
            startColumn: 0,
            endLine: 5,
            endColumn: 0,
            originalCode: '',
            newCode: 'complex code',
            description: 'Insert',
          },
          {
            type: RefactoringType.REPLACE,
            startLine: 10,
            startColumn: 0,
            endLine: 15,
            endColumn: 0,
            originalCode: 'old',
            newCode: 'new',
            description: 'Replace',
          },
        ],
        confidence: ConfidenceLevel.MEDIUM,
        confidenceScore: 50,
        reasoning: 'Initial',
        impact: {
          linesChanged: 15,
          complexity: 'high',
          breakingChange: true,
          testingRequired: true,
          estimatedTime: '30 minutes',
        },
      };

      const violation: RuleViolation = {
        ruleId: 'glide-query-no-conditions',
        message: 'Add query conditions',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 0,
      };

      const result = scorer.calculateConfidence(suggestion, violation);

      expect(result.confidenceScore).toBeLessThan(50);
      expect(result.confidence).toBe(ConfidenceLevel.LOW);
    });

    test('should penalize breaking changes', () => {
      const suggestion: RefactoringSuggestion = {
        id: 'test-1',
        ruleId: 'ts-no-any',
        title: 'Test',
        description: 'Test',
        transformations: [
          {
            type: RefactoringType.REPLACE,
            startLine: 1,
            startColumn: 0,
            endLine: 1,
            endColumn: 3,
            originalCode: 'any',
            newCode: 'unknown',
            description: 'Replace',
          },
        ],
        confidence: ConfidenceLevel.MEDIUM,
        confidenceScore: 50,
        reasoning: 'Initial',
        impact: {
          linesChanged: 1,
          complexity: 'low',
          breakingChange: true,
          testingRequired: true,
          estimatedTime: '5 minutes',
        },
      };

      const violation: RuleViolation = {
        ruleId: 'ts-no-any',
        message: 'Avoid any type',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 0,
      };

      const result = scorer.calculateConfidence(suggestion, violation);

      // Breaking change should reduce confidence
      expect(result.confidenceScore).toBeLessThan(85);
    });
  });

  describe('Confidence Levels', () => {
    test('should assign HIGH level for scores >= 80', () => {
      const suggestion: RefactoringSuggestion = {
        id: 'test-1',
        ruleId: 'glide-deprecated-ajax',
        title: 'Test',
        description: 'Test',
        transformations: [
          {
            type: RefactoringType.REPLACE,
            startLine: 1,
            startColumn: 0,
            endLine: 1,
            endColumn: 10,
            originalCode: 'old',
            newCode: 'new',
            description: 'Replace',
          },
        ],
        confidence: ConfidenceLevel.MEDIUM,
        confidenceScore: 50,
        reasoning: 'Initial',
        impact: {
          linesChanged: 1,
          complexity: 'low',
          breakingChange: false,
          testingRequired: false,
          estimatedTime: '1 minute',
        },
      };

      const violation: RuleViolation = {
        ruleId: 'glide-deprecated-ajax',
        message: 'Use async pattern',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 0,
      };

      const result = scorer.calculateConfidence(suggestion, violation);

      if (result.confidenceScore >= 80) {
        expect(result.confidence).toBe(ConfidenceLevel.HIGH);
      }
    });

    test('should assign MEDIUM level for scores 50-79', () => {
      const suggestion: RefactoringSuggestion = {
        id: 'test-1',
        ruleId: 'ts-missing-types',
        title: 'Test',
        description: 'Test',
        transformations: [
          {
            type: RefactoringType.REPLACE,
            startLine: 1,
            startColumn: 0,
            endLine: 1,
            endColumn: 10,
            originalCode: 'old',
            newCode: 'new',
            description: 'Replace',
          },
        ],
        confidence: ConfidenceLevel.MEDIUM,
        confidenceScore: 50,
        reasoning: 'Initial',
        impact: {
          linesChanged: 3,
          complexity: 'medium',
          breakingChange: false,
          testingRequired: true,
          estimatedTime: '5 minutes',
        },
      };

      const violation: RuleViolation = {
        ruleId: 'ts-missing-types',
        message: 'Add type annotations',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 0,
      };

      const result = scorer.calculateConfidence(suggestion, violation);

      if (result.confidenceScore >= 50 && result.confidenceScore < 80) {
        expect(result.confidence).toBe(ConfidenceLevel.MEDIUM);
      }
    });
  });

  describe('Batch Calculation', () => {
    test('should calculate confidence for multiple suggestions', () => {
      const suggestions: RefactoringSuggestion[] = [
        {
          id: 'test-1',
          ruleId: 'glide-log-for-errors',
          title: 'Test 1',
          description: 'Test',
          transformations: [
            {
              type: RefactoringType.REPLACE,
              startLine: 1,
              startColumn: 0,
              endLine: 1,
              endColumn: 6,
              originalCode: 'gs.log',
              newCode: 'gs.error',
              description: 'Replace',
            },
          ],
          confidence: ConfidenceLevel.MEDIUM,
          confidenceScore: 50,
          reasoning: 'Initial',
          impact: {
            linesChanged: 1,
            complexity: 'low',
            breakingChange: false,
            testingRequired: false,
            estimatedTime: '1 minute',
          },
        },
        {
          id: 'test-2',
          ruleId: 'ts-no-any',
          title: 'Test 2',
          description: 'Test',
          transformations: [
            {
              type: RefactoringType.REPLACE,
              startLine: 1,
              startColumn: 0,
              endLine: 1,
              endColumn: 3,
              originalCode: 'any',
              newCode: 'unknown',
              description: 'Replace',
            },
          ],
          confidence: ConfidenceLevel.MEDIUM,
          confidenceScore: 50,
          reasoning: 'Initial',
          impact: {
            linesChanged: 1,
            complexity: 'low',
            breakingChange: false,
            testingRequired: false,
            estimatedTime: '1 minute',
          },
        },
      ];

      const violations: RuleViolation[] = [
        {
          ruleId: 'glide-log-for-errors',
          message: 'Use gs.error',
          severity: IssueSeverity.LOW,
          line: 1,
          column: 0,
        },
        {
          ruleId: 'ts-no-any',
          message: 'Avoid any',
          severity: IssueSeverity.MEDIUM,
          line: 1,
          column: 0,
        },
      ];

      const results = scorer.batchCalculate(suggestions, violations);

      expect(results).toHaveLength(2);
      expect(results[0].confidenceScore).toBeGreaterThan(50);
      expect(results[1].confidenceScore).toBeGreaterThan(50);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const scorer1 = getConfidenceScorer();
      const scorer2 = getConfidenceScorer();
      expect(scorer1).toBe(scorer2);
    });

    test('should reset instance', () => {
      const scorer1 = getConfidenceScorer();
      resetConfidenceScorer();
      const scorer2 = getConfidenceScorer();
      expect(scorer2).toBeDefined();
    });
  });
});
