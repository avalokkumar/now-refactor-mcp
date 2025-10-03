/**
 * Unit tests for GlideScript query refactoring providers
 */

import {
  NestedQueryRefactoringProvider,
  QueryConditionsRefactoringProvider,
} from '../../../src/refactor/glide-script/query-refactors';
import { getJavaScriptParser } from '../../../src/parser';
import { RuleViolation } from '../../../src/rules';
import { IssueSeverity } from '../../../src/storage';
import { RefactoringContext } from '../../../src/refactor';

describe('GlideScript Query Refactoring Providers', () => {
  const parser = getJavaScriptParser();

  describe('NestedQueryRefactoringProvider', () => {
    let provider: NestedQueryRefactoringProvider;

    beforeEach(() => {
      provider = new NestedQueryRefactoringProvider();
    });

    test('should have correct rule ID', () => {
      expect(provider.ruleId).toBe('glide-nested-query');
    });

    test('should identify refactorable violations', () => {
      const violation: RuleViolation = {
        ruleId: 'glide-nested-query',
        message: 'Nested query detected',
        severity: IssueSeverity.HIGH,
        line: 5,
        column: 4,
      };

      expect(provider.canRefactor(violation)).toBe(true);
    });

    test('should not refactor other violations', () => {
      const violation: RuleViolation = {
        ruleId: 'other-rule',
        message: 'Other issue',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 0,
      };

      expect(provider.canRefactor(violation)).toBe(false);
    });

    test('should generate multiple suggestions', async () => {
      const code = `
        var gr1 = new GlideRecord('incident');
        gr1.query();
        while (gr1.next()) {
          var gr2 = new GlideRecord('problem');
          gr2.query();
        }
      `;

      const parseResult = parser.parse(code, 'test.js');
      const violation: RuleViolation = {
        ruleId: 'glide-nested-query',
        message: 'Nested query',
        severity: IssueSeverity.HIGH,
        line: 6,
        column: 10,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.js',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].ruleId).toBe('glide-nested-query');
      expect(suggestions[0].transformations).toBeDefined();
      expect(suggestions[0].preview).toBeDefined();
    });

    test('should provide GlideAggregate suggestion', async () => {
      const code = 'nested query code';
      const parseResult = parser.parse(code, 'test.js');
      const violation: RuleViolation = {
        ruleId: 'glide-nested-query',
        message: 'Nested query',
        severity: IssueSeverity.HIGH,
        line: 1,
        column: 0,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.js',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);
      const aggregateSuggestion = suggestions.find((s) =>
        s.title.includes('GlideAggregate')
      );

      expect(aggregateSuggestion).toBeDefined();
      expect(aggregateSuggestion?.preview).toContain('GlideAggregate');
    });

    test('should provide encoded query suggestion', async () => {
      const code = 'nested query code';
      const parseResult = parser.parse(code, 'test.js');
      const violation: RuleViolation = {
        ruleId: 'glide-nested-query',
        message: 'Nested query',
        severity: IssueSeverity.HIGH,
        line: 1,
        column: 0,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.js',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);
      const encodedSuggestion = suggestions.find((s) =>
        s.title.includes('encoded query')
      );

      expect(encodedSuggestion).toBeDefined();
      expect(encodedSuggestion?.preview).toContain('IN');
      expect(encodedSuggestion?.confidenceScore).toBeGreaterThan(80);
    });
  });

  describe('QueryConditionsRefactoringProvider', () => {
    let provider: QueryConditionsRefactoringProvider;

    beforeEach(() => {
      provider = new QueryConditionsRefactoringProvider();
    });

    test('should have correct rule ID', () => {
      expect(provider.ruleId).toBe('glide-query-no-conditions');
    });

    test('should generate add conditions suggestion', async () => {
      const code = `
        var gr = new GlideRecord('incident');
        gr.query();
      `;

      const parseResult = parser.parse(code, 'test.js');
      const violation: RuleViolation = {
        ruleId: 'glide-query-no-conditions',
        message: 'Query without conditions',
        severity: IssueSeverity.MEDIUM,
        line: 3,
        column: 8,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.js',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].title).toContain('Add query conditions');
      expect(suggestions[0].preview).toContain('addQuery');
      expect(suggestions[0].confidence).toBe('low');
    });
  });
});
