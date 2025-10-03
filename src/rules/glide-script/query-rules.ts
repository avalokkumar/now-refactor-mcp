/**
 * GlideScript query rules
 * Rules for detecting GlideRecord query anti-patterns
 */

import { getJavaScriptParser } from '../../parser';
import { IssueSeverity } from '../../storage';
import {
  Rule,
  RuleMetadata,
  RuleContext,
  RuleViolation,
  RuleCategory,
} from '../models';

/**
 * Rule: Detect nested GlideRecord queries
 * Nested queries are a performance anti-pattern
 */
export class NestedQueryRule implements Rule {
  metadata: RuleMetadata = {
    id: 'glide-nested-query',
    name: 'No Nested GlideRecord Queries',
    description: 'Detects nested GlideRecord queries which cause performance issues',
    category: RuleCategory.PERFORMANCE,
    severity: IssueSeverity.HIGH,
    language: 'javascript',
    tags: ['gliderecord', 'performance', 'query'],
    documentation: 'Use GlideAggregate or join queries instead of nested loops',
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const parser = getJavaScriptParser();
    
    // Find all loops
    const loops = parser.findLoops(context.parseResult.ast);
    
    // Check each loop for GlideRecord queries
    loops.forEach((loop) => {
      const queryCalls = parser.findCallExpressions(loop as any, 'query');
      
      if (queryCalls.length > 0) {
        queryCalls.forEach((call) => {
          const loc = (call as any).loc;
          violations.push({
            ruleId: this.metadata.id,
            message: 'Nested GlideRecord query detected. Consider using GlideAggregate or optimizing the query.',
            severity: this.metadata.severity,
            line: loc?.start.line || 1,
            column: loc?.start.column || 0,
            node: call,
          });
        });
      }
    });

    return violations;
  }
}

/**
 * Rule: Detect queries without conditions
 * Queries without conditions can return too many records
 */
export class QueryWithoutConditionsRule implements Rule {
  metadata: RuleMetadata = {
    id: 'glide-query-no-conditions',
    name: 'Query Without Conditions',
    description: 'Detects GlideRecord queries without addQuery conditions',
    category: RuleCategory.PERFORMANCE,
    severity: IssueSeverity.MEDIUM,
    language: 'javascript',
    tags: ['gliderecord', 'performance'],
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const parser = getJavaScriptParser();
    
    // Find all query() calls
    const queryCalls = parser.findCallExpressions(context.parseResult.ast, 'query');
    
    // This is a simplified check - in production, you'd track GlideRecord instances
    // and check if addQuery was called before query()
    queryCalls.forEach((call) => {
      const loc = (call as any).loc;
      // Simplified heuristic check
      violations.push({
        ruleId: this.metadata.id,
        message: 'Consider adding query conditions with addQuery() before calling query()',
        severity: this.metadata.severity,
        line: loc?.start.line || 1,
        column: loc?.start.column || 0,
        node: call,
      });
    });

    return violations;
  }
}
