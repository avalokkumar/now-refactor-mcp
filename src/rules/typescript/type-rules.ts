/**
 * TypeScript type rules
 * Rules for TypeScript type definitions
 */

import { getTypeScriptParser } from '../../parser';
import { IssueSeverity } from '../../storage';
import * as ts from 'typescript';
import {
  Rule,
  RuleMetadata,
  RuleContext,
  RuleViolation,
  RuleCategory,
} from '../models';

/**
 * Rule: Detect missing type definitions
 */
export class MissingTypeDefinitionsRule implements Rule {
  metadata: RuleMetadata = {
    id: 'ts-missing-types',
    name: 'Missing Type Definitions',
    description: 'Detects variables and functions without explicit type definitions',
    category: RuleCategory.BEST_PRACTICE,
    severity: IssueSeverity.MEDIUM,
    language: 'typescript',
    tags: ['types', 'best-practice'],
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const parser = getTypeScriptParser();
    const sourceFile = parser.parseWithTypes(context.sourceCode, context.fileName);

    // Check for functions without return types
    const functions = parser.findFunctions(sourceFile);
    
    functions.forEach((func) => {
      if (ts.isFunctionDeclaration(func) || ts.isMethodDeclaration(func)) {
        if (!func.type) {
          const pos = sourceFile.getLineAndCharacterOfPosition(func.pos);
          violations.push({
            ruleId: this.metadata.id,
            message: 'Function missing explicit return type',
            severity: this.metadata.severity,
            line: pos.line + 1,
            column: pos.character,
          });
        }
      }
    });

    return violations;
  }
}

/**
 * Rule: Detect use of 'any' type
 */
export class NoAnyTypeRule implements Rule {
  metadata: RuleMetadata = {
    id: 'ts-no-any',
    name: 'Avoid Any Type',
    description: 'Detects usage of the any type which bypasses type checking',
    category: RuleCategory.BEST_PRACTICE,
    severity: IssueSeverity.MEDIUM,
    language: 'typescript',
    tags: ['types', 'type-safety'],
  };

  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const code = context.sourceCode;
    
    // Simple regex check for 'any' type usage
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const anyRegex = /:\s*any\b/g;
      const matches = line.matchAll(anyRegex);
      
      for (const match of matches) {
        violations.push({
          ruleId: this.metadata.id,
          message: 'Avoid using "any" type. Use specific types or "unknown" instead.',
          severity: this.metadata.severity,
          line: index + 1,
          column: match.index || 0,
        });
      }
    });

    return violations;
  }
}
