/**
 * Unit tests for TypeScript type rules
 */

import {
  MissingTypeDefinitionsRule,
  NoAnyTypeRule,
} from '../../../src/rules/typescript/type-rules';
import { getTypeScriptParser } from '../../../src/parser';
import { RuleContext } from '../../../src/rules';

describe('TypeScript Type Rules', () => {
  const parser = getTypeScriptParser();

  describe('MissingTypeDefinitionsRule', () => {
    let rule: MissingTypeDefinitionsRule;

    beforeEach(() => {
      rule = new MissingTypeDefinitionsRule();
    });

    test('should have correct metadata', () => {
      expect(rule.metadata.id).toBe('ts-missing-types');
      expect(rule.metadata.name).toBe('Missing Type Definitions');
      expect(rule.metadata.language).toBe('typescript');
    });

    test('should detect functions without return types', () => {
      const code = 'function test() { return 42; }';

      const parseResult = parser.parse(code, 'test.ts');
      const context: RuleContext = {
        parseResult,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const violations = rule.check(context);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('return type');
    });

    test('should not flag functions with return types', () => {
      const code = 'function test(): number { return 42; }';

      const parseResult = parser.parse(code, 'test.ts');
      const context: RuleContext = {
        parseResult,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const violations = rule.check(context);
      expect(violations).toHaveLength(0);
    });
  });

  describe('NoAnyTypeRule', () => {
    let rule: NoAnyTypeRule;

    beforeEach(() => {
      rule = new NoAnyTypeRule();
    });

    test('should have correct metadata', () => {
      expect(rule.metadata.id).toBe('ts-no-any');
      expect(rule.metadata.name).toBe('Avoid Any Type');
      expect(rule.metadata.language).toBe('typescript');
    });

    test('should detect any type usage', () => {
      const code = 'function test(data: any): any { return data; }';

      const parseResult = parser.parse(code, 'test.ts');
      const context: RuleContext = {
        parseResult,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const violations = rule.check(context);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('any');
    });

    test('should not flag proper types', () => {
      const code = 'function test(data: string): number { return data.length; }';

      const parseResult = parser.parse(code, 'test.ts');
      const context: RuleContext = {
        parseResult,
        fileName: 'test.ts',
        sourceCode: code,
      };

      const violations = rule.check(context);
      expect(violations).toHaveLength(0);
    });
  });
});
