/**
 * GlideScript performance rules
 * Rules for detecting performance issues
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
 * Rule: Detect hardcoded values that should be system properties
 */
export class HardcodedValuesRule implements Rule {
  metadata: RuleMetadata = {
    id: 'glide-hardcoded-values',
    name: 'Avoid Hardcoded Values',
    description: 'Detects hardcoded values that should be system properties',
    category: RuleCategory.MAINTAINABILITY,
    severity: IssueSeverity.LOW,
    language: 'javascript',
    tags: ['maintainability', 'configuration'],
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const code = context.sourceCode;
    
    // Check for hardcoded URLs, emails, etc.
    const patterns = [
      { regex: /['"]https?:\/\/[^'"]+['"]/g, type: 'URL' },
      { regex: /['"][^'"]*@[^'"]+\.[^'"]+['"]/g, type: 'email' },
    ];

    patterns.forEach(({ regex, type }) => {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        const matches = line.match(regex);
        if (matches) {
          matches.forEach((match) => {
            violations.push({
              ruleId: this.metadata.id,
              message: `Hardcoded ${type} detected. Consider using system properties.`,
              severity: this.metadata.severity,
              line: index + 1,
              column: line.indexOf(match),
            });
          });
        }
      });
    });

    return violations;
  }
}
