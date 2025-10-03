/**
 * Unit tests for TypeScript type refactoring providers
 */

import {
  MissingTypeRefactoringProvider,
  NoAnyRefactoringProvider,
} from '../../../src/refactor/typescript/type-refactors';
import { getTypeScriptParser } from '../../../src/parser';
import { RuleViolation } from '../../../src/rules';
import { IssueSeverity } from '../../../src/storage';
import { RefactoringContext } from '../../../src/refactor';

describe('TypeScript Type Refactoring Providers', () => {
  const parser = getTypeScriptParser();

  describe('MissingTypeRefactoringProvider', () => {
    let provider: MissingTypeRefactoringProvider;

    beforeEach(() => {
      provider = new MissingTypeRefactoringProvider();
    });

    test('should have correct rule ID', () => {
      expect(provider.ruleId).toBe('ts-missing-types');
    });

    test('should identify refactorable violations', () => {
      const violation: RuleViolation = {
        ruleId: 'ts-missing-types',
        message: 'Missing type annotation',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 0,
      };

      expect(provider.canRefactor(violation)).toBe(true);
    });

    test('should generate type annotation suggestion', async () => {
      const code = 'function test() { return 42; }';
      const parseResult = parser.parse(code, 'test.ts');
      const violation: RuleViolation = {
        ruleId: 'ts-missing-types',
        message: 'Missing return type',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 0,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].title).toContain('type annotations');
      expect(suggestions[0].preview).toContain('DataItem');
      expect(suggestions[0].confidence).toBe('medium');
    });
  });

  describe('NoAnyRefactoringProvider', () => {
    let provider: NoAnyRefactoringProvider;

    beforeEach(() => {
      provider = new NoAnyRefactoringProvider();
    });

    test('should have correct rule ID', () => {
      expect(provider.ruleId).toBe('ts-no-any');
    });

    test('should generate multiple suggestions', async () => {
      const code = 'function test(data: any): any { return data; }';
      const parseResult = parser.parse(code, 'test.ts');
      const violation: RuleViolation = {
        ruleId: 'ts-no-any',
        message: 'Avoid any type',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 20,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);

      expect(suggestions.length).toBeGreaterThanOrEqual(2);
    });

    test('should provide unknown type suggestion', async () => {
      const code = 'function test(data: any) { }';
      const parseResult = parser.parse(code, 'test.ts');
      const violation: RuleViolation = {
        ruleId: 'ts-no-any',
        message: 'Avoid any',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 20,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);
      const unknownSuggestion = suggestions.find((s) =>
        s.title.includes('unknown')
      );

      expect(unknownSuggestion).toBeDefined();
      expect(unknownSuggestion?.preview).toContain('unknown');
      expect(unknownSuggestion?.confidenceScore).toBeGreaterThan(80);
    });

    test('should provide interface suggestion', async () => {
      const code = 'function test(data: any) { }';
      const parseResult = parser.parse(code, 'test.ts');
      const violation: RuleViolation = {
        ruleId: 'ts-no-any',
        message: 'Avoid any',
        severity: IssueSeverity.MEDIUM,
        line: 1,
        column: 20,
      };

      const context: RefactoringContext = {
        parseResult,
        violation,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const suggestions = await provider.generateSuggestions(context);
      const interfaceSuggestion = suggestions.find((s) =>
        s.title.includes('interface')
      );

      expect(interfaceSuggestion).toBeDefined();
      expect(interfaceSuggestion?.preview).toContain('interface');
      expect(interfaceSuggestion?.impact.complexity).toBe('medium');
    });
  });
});
