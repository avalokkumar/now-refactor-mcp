/**
 * Rule engine implementation
 * Executes rules against parsed code to detect issues
 */

import { ParseResult } from '../parser';
import { CodeIssue } from '../storage';
import {
  Rule,
  RuleConfig,
  RuleContext,
  RuleEngineConfig,
  RuleEngineResult,
  RuleExecutionResult,
  RuleViolation,
} from './models';

/**
 * Rule engine class
 * Manages and executes rules against code
 */
export class RuleEngine {
  private rules: Map<string, Rule>;
  private config: RuleEngineConfig;

  constructor(config?: Partial<RuleEngineConfig>) {
    this.rules = new Map();
    this.config = {
      rules: new Map(),
      maxExecutionTime: 5000, // 5 seconds per rule
      ...config,
    };
  }

  /**
   * Register a rule
   * @param rule - Rule to register
   */
  registerRule(rule: Rule): void {
    this.rules.set(rule.metadata.id, rule);
    
    // Add default config if not exists
    if (!this.config.rules.has(rule.metadata.id)) {
      this.config.rules.set(rule.metadata.id, {
        enabled: true,
        severity: rule.metadata.severity,
      });
    }
  }

  /**
   * Unregister a rule
   * @param ruleId - ID of rule to unregister
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.config.rules.delete(ruleId);
  }

  /**
   * Get all registered rules
   * @returns Array of rules
   */
  getRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   * @param ruleId - Rule ID
   * @returns Rule or undefined
   */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Enable a rule
   * @param ruleId - Rule ID
   */
  enableRule(ruleId: string): void {
    const config = this.config.rules.get(ruleId);
    if (config) {
      config.enabled = true;
    }
  }

  /**
   * Disable a rule
   * @param ruleId - Rule ID
   */
  disableRule(ruleId: string): void {
    const config = this.config.rules.get(ruleId);
    if (config) {
      config.enabled = false;
    }
  }

  /**
   * Execute all enabled rules against parsed code
   * @param parseResult - Parsed code result
   * @param fileName - File name
   * @returns Rule engine result with violations
   */
  async execute(parseResult: ParseResult, fileName: string): Promise<RuleEngineResult> {
    const startTime = Date.now();
    const ruleResults: RuleExecutionResult[] = [];
    const allViolations: RuleViolation[] = [];

    // Filter enabled rules for the language
    const applicableRules = Array.from(this.rules.values()).filter((rule) => {
      const config = this.config.rules.get(rule.metadata.id);
      if (!config || !config.enabled) {
        return false;
      }

      const language = parseResult.language;
      return (
        rule.metadata.language === language ||
        rule.metadata.language === 'both'
      );
    });

    // Execute each rule
    for (const rule of applicableRules) {
      const result = await this.executeRule(rule, parseResult, fileName);
      ruleResults.push(result);
      allViolations.push(...result.violations);
    }

    const totalExecutionTime = Date.now() - startTime;

    // Convert violations to CodeIssue format
    const issues = this.convertViolationsToIssues(allViolations, fileName);

    return {
      fileName,
      language: parseResult.language,
      totalViolations: allViolations.length,
      violations: allViolations,
      ruleResults,
      totalExecutionTime,
      issues,
    };
  }

  /**
   * Execute a single rule
   */
  private async executeRule(
    rule: Rule,
    parseResult: ParseResult,
    fileName: string
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    const config = this.config.rules.get(rule.metadata.id);

    try {
      const context: RuleContext = {
        parseResult,
        fileName,
        sourceCode: parseResult.sourceCode,
        options: config?.options,
      };

      // Execute with timeout
      const violations = await Promise.race([
        Promise.resolve(rule.check(context)),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Rule execution timeout')),
            this.config.maxExecutionTime
          )
        ),
      ]);

      // Apply severity override from config
      if (config?.severity) {
        violations.forEach((v) => {
          v.severity = config.severity!;
        });
      }

      const executionTime = Date.now() - startTime;

      return {
        ruleId: rule.metadata.id,
        violations,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        ruleId: rule.metadata.id,
        violations: [],
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert rule violations to CodeIssue format
   */
  private convertViolationsToIssues(
    violations: RuleViolation[],
    fileName: string
  ): CodeIssue[] {
    return violations.map((violation, index) => ({
      id: `${violation.ruleId}-${index}`,
      type: violation.ruleId,
      severity: violation.severity,
      message: violation.message,
      line: violation.line,
      column: violation.column,
      endLine: violation.endLine,
      endColumn: violation.endColumn,
      fileName,
    }));
  }

  /**
   * Get statistics
   * @returns Engine statistics
   */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    rulesByCategory: Record<string, number>;
  } {
    const rules = Array.from(this.rules.values());
    const enabledRules = rules.filter((r) => this.config.rules.get(r.metadata.id)?.enabled);

    const rulesByCategory: Record<string, number> = {};
    rules.forEach((rule) => {
      const category = rule.metadata.category;
      rulesByCategory[category] = (rulesByCategory[category] || 0) + 1;
    });

    return {
      totalRules: rules.length,
      enabledRules: enabledRules.length,
      disabledRules: rules.length - enabledRules.length,
      rulesByCategory,
    };
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  getConfig(): RuleEngineConfig {
    return {
      rules: new Map(this.config.rules),
      maxExecutionTime: this.config.maxExecutionTime,
    };
  }
}

// Singleton instance
let engineInstance: RuleEngine | null = null;

/**
 * Get the singleton rule engine instance
 * @param config - Optional configuration
 * @returns The rule engine instance
 */
export function getRuleEngine(config?: Partial<RuleEngineConfig>): RuleEngine {
  if (!engineInstance) {
    engineInstance = new RuleEngine(config);
  }
  return engineInstance;
}

/**
 * Reset the rule engine instance (useful for testing)
 */
export function resetRuleEngine(): void {
  engineInstance = null;
}
