/**
 * Unit tests for GlideScript query rules
 */

import {
  NestedQueryRule,
  QueryWithoutConditionsRule,
} from '../../../src/rules/glide-script/query-rules';
import { getJavaScriptParser } from '../../../src/parser';
import { RuleContext } from '../../../src/rules';

describe('GlideScript Query Rules', () => {
  const parser = getJavaScriptParser();

  describe('NestedQueryRule', () => {
    let rule: NestedQueryRule;

    beforeEach(() => {
      rule = new NestedQueryRule();
    });

    test('should have correct metadata', () => {
      expect(rule.metadata.id).toBe('glide-nested-query');
      expect(rule.metadata.name).toBe('No Nested GlideRecord Queries');
      expect(rule.metadata.language).toBe('javascript');
    });

    test('should detect nested GlideRecord query', () => {
      const code = `
        var gr1 = new GlideRecord('incident');
        gr1.query();
        while (gr1.next()) {
          var gr2 = new GlideRecord('problem');
          gr2.query();
        }
      `;

      const parseResult = parser.parse(code, 'test.js');
      const context: RuleContext = {
        parseResult,
        fileName: 'test.js',
        sourceCode: code,
      };

      const violations = rule.check(context);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].ruleId).toBe('glide-nested-query');
      expect(violations[0].message).toContain('Nested GlideRecord query');
    });

    test('should not flag non-nested queries', () => {
      const code = `
        var gr = new GlideRecord('incident');
        gr.query();
        while (gr.next()) {
          gs.log(gr.number);
        }
      `;

      const parseResult = parser.parse(code, 'test.js');
      const context: RuleContext = {
        parseResult,
        fileName: 'test.js',
        sourceCode: code,
      };

      const violations = rule.check(context);
      expect(violations).toHaveLength(0);
    });
  });

  describe('QueryWithoutConditionsRule', () => {
    let rule: QueryWithoutConditionsRule;

    beforeEach(() => {
      rule = new QueryWithoutConditionsRule();
    });

    test('should have correct metadata', () => {
      expect(rule.metadata.id).toBe('glide-query-no-conditions');
      expect(rule.metadata.name).toBe('Query Without Conditions');
      expect(rule.metadata.language).toBe('javascript');
    });

    test('should detect query calls', () => {
      const code = `
        var gr = new GlideRecord('incident');
        gr.query();
      `;

      const parseResult = parser.parse(code, 'test.js');
      const context: RuleContext = {
        parseResult,
        fileName: 'test.js',
        sourceCode: code,
      };

      const violations = rule.check(context);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].ruleId).toBe('glide-query-no-conditions');
    });
  });
});
