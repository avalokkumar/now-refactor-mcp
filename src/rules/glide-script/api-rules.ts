/**
 * GlideScript API rules
 * Rules for detecting deprecated or misused APIs
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
 * Rule: Detect deprecated GlideAjax usage
 */
export class DeprecatedGlideAjaxRule implements Rule {
  metadata: RuleMetadata = {
    id: 'glide-deprecated-ajax',
    name: 'Deprecated GlideAjax Pattern',
    description: 'Detects deprecated GlideAjax usage patterns',
    category: RuleCategory.DEPRECATED,
    severity: IssueSeverity.MEDIUM,
    language: 'javascript',
    tags: ['glideajax', 'deprecated'],
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const code = context.sourceCode;
    
    // Check for synchronous GlideAjax calls (deprecated pattern)
    if (code.includes('getXMLWait')) {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('getXMLWait')) {
          violations.push({
            ruleId: this.metadata.id,
            message: 'getXMLWait() is deprecated. Use getXML() with callback instead.',
            severity: this.metadata.severity,
            line: index + 1,
            column: line.indexOf('getXMLWait'),
          });
        }
      });
    }

    return violations;
  }
}

/**
 * Rule: Detect gs.log usage instead of gs.error for errors
 */
export class LogInsteadOfErrorRule implements Rule {
  metadata: RuleMetadata = {
    id: 'glide-log-for-errors',
    name: 'Use gs.error for Errors',
    description: 'Detects gs.log() usage for error messages',
    category: RuleCategory.BEST_PRACTICE,
    severity: IssueSeverity.LOW,
    language: 'javascript',
    tags: ['logging', 'best-practice'],
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const parser = getJavaScriptParser();
    
    // Find gs.log calls
    const logCalls = parser.findCallExpressions(context.parseResult.ast, 'log');
    
    logCalls.forEach((call) => {
      // Check if the log message contains error-related keywords
      const callNode = call as any;
      const args = callNode.arguments || [];
      
      if (args.length > 0) {
        const firstArg = args[0];
        if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
          const message = firstArg.value.toLowerCase();
          if (message.includes('error') || message.includes('exception') || message.includes('fail')) {
            const loc = callNode.loc;
            violations.push({
              ruleId: this.metadata.id,
              message: 'Consider using gs.error() instead of gs.log() for error messages',
              severity: this.metadata.severity,
              line: loc?.start.line || 1,
              column: loc?.start.column || 0,
              node: call,
            });
          }
        }
      }
    });

    return violations;
  }
}
