/**
 * Unit tests for Rule Engine
 */

import {
  RuleEngine,
  getRuleEngine,
  resetRuleEngine,
  Rule,
  RuleMetadata,
  RuleContext,
  RuleViolation,
  RuleCategory,
} from '../../src/rules';
import { getJavaScriptParser } from '../../src/parser';
import { IssueSeverity } from '../../src/storage';

// Mock rule for testing
class MockRule implements Rule {
  metadata: RuleMetadata = {
    id: 'mock-rule',
    name: 'Mock Rule',
    description: 'A mock rule for testing',
    category: RuleCategory.BEST_PRACTICE,
    severity: IssueSeverity.MEDIUM,
    language: 'javascript',
    tags: ['test'],
  };

  check(context: RuleContext): RuleViolation[] {
    return [
      {
        ruleId: this.metadata.id,
        message: 'Mock violation',
        severity: this.metadata.severity,
        line: 1,
        column: 0,
      },
    ];
  }
}

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  afterEach(() => {
    resetRuleEngine();
  });

  describe('Rule Registration', () => {
    test('should register a rule', () => {
      const rule = new MockRule();
      engine.registerRule(rule);

      const rules = engine.getRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].metadata.id).toBe('mock-rule');
    });

    test('should unregister a rule', () => {
      const rule = new MockRule();
      engine.registerRule(rule);
      engine.unregisterRule('mock-rule');

      const rules = engine.getRules();
      expect(rules).toHaveLength(0);
    });

    test('should get rule by ID', () => {
      const rule = new MockRule();
      engine.registerRule(rule);

      const retrieved = engine.getRule('mock-rule');
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.id).toBe('mock-rule');
    });

    test('should return undefined for non-existent rule', () => {
      const retrieved = engine.getRule('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Rule Configuration', () => {
    test('should enable a rule', () => {
      const rule = new MockRule();
      engine.registerRule(rule);
      engine.enableRule('mock-rule');

      const config = engine.getConfig();
      expect(config.rules.get('mock-rule')?.enabled).toBe(true);
    });

    test('should disable a rule', () => {
      const rule = new MockRule();
      engine.registerRule(rule);
      engine.disableRule('mock-rule');

      const config = engine.getConfig();
      expect(config.rules.get('mock-rule')?.enabled).toBe(false);
    });
  });

  describe('Rule Execution', () => {
    test('should execute rules against code', async () => {
      const rule = new MockRule();
      engine.registerRule(rule);

      const parser = getJavaScriptParser();
      const code = 'var x = 5;';
      const parseResult = parser.parse(code, 'test.js');

      const result = await engine.execute(parseResult, 'test.js');

      expect(result.totalViolations).toBe(1);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ruleId).toBe('mock-rule');
      expect(result.issues).toHaveLength(1);
    });

    test('should not execute disabled rules', async () => {
      const rule = new MockRule();
      engine.registerRule(rule);
      engine.disableRule('mock-rule');

      const parser = getJavaScriptParser();
      const code = 'var x = 5;';
      const parseResult = parser.parse(code, 'test.js');

      const result = await engine.execute(parseResult, 'test.js');

      expect(result.totalViolations).toBe(0);
    });

    test('should only execute rules for matching language', async () => {
      const jsRule = new MockRule();
      jsRule.metadata.language = 'javascript';
      
      const tsRule = new MockRule();
      tsRule.metadata.id = 'ts-mock-rule';
      tsRule.metadata.language = 'typescript';

      engine.registerRule(jsRule);
      engine.registerRule(tsRule);

      const parser = getJavaScriptParser();
      const code = 'var x = 5;';
      const parseResult = parser.parse(code, 'test.js');

      const result = await engine.execute(parseResult, 'test.js');

      // Only JavaScript rule should execute
      expect(result.totalViolations).toBe(1);
      expect(result.violations[0].ruleId).toBe('mock-rule');
    });

    test('should handle rule execution errors', async () => {
      class ErrorRule implements Rule {
        metadata: RuleMetadata = {
          id: 'error-rule',
          name: 'Error Rule',
          description: 'A rule that throws an error',
          category: RuleCategory.BEST_PRACTICE,
          severity: IssueSeverity.MEDIUM,
          language: 'javascript',
          tags: ['test'],
        };

        check(): RuleViolation[] {
          throw new Error('Rule execution failed');
        }
      }

      const rule = new ErrorRule();
      engine.registerRule(rule);

      const parser = getJavaScriptParser();
      const code = 'var x = 5;';
      const parseResult = parser.parse(code, 'test.js');

      const result = await engine.execute(parseResult, 'test.js');

      expect(result.ruleResults).toHaveLength(1);
      expect(result.ruleResults[0].error).toBeDefined();
      expect(result.totalViolations).toBe(0);
    });
  });

  describe('Statistics', () => {
    test('should return engine statistics', () => {
      const rule1 = new MockRule();
      const rule2 = new MockRule();
      rule2.metadata.id = 'mock-rule-2';
      rule2.metadata.category = RuleCategory.PERFORMANCE;

      engine.registerRule(rule1);
      engine.registerRule(rule2);

      const stats = engine.getStats();

      expect(stats.totalRules).toBe(2);
      expect(stats.enabledRules).toBe(2);
      expect(stats.disabledRules).toBe(0);
      expect(stats.rulesByCategory[RuleCategory.BEST_PRACTICE]).toBe(1);
      expect(stats.rulesByCategory[RuleCategory.PERFORMANCE]).toBe(1);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const engine1 = getRuleEngine();
      const engine2 = getRuleEngine();
      expect(engine1).toBe(engine2);
    });

    test('should reset instance', () => {
      const engine1 = getRuleEngine();
      engine1.registerRule(new MockRule());

      resetRuleEngine();
      const engine2 = getRuleEngine();

      expect(engine2.getRules()).toHaveLength(0);
    });
  });
});
