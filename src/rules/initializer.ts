/**
 * Rule initializer
 * Registers all rules with the rule engine
 */

import { getRuleEngine } from './rule-engine';
import { 
  NestedQueryRule, 
  QueryWithoutConditionsRule 
} from './glide-script/query-rules';
import {
  DeprecatedGlideAjaxRule,
  LogInsteadOfErrorRule
} from './glide-script/api-rules';
import {
  HardcodedValuesRule
} from './glide-script/performance-rules';
import {
  MissingTypeDefinitionsRule,
  NoAnyTypeRule
} from './typescript/type-rules';
import {
  UnusedImportsRule
} from './typescript/module-rules';
import {
  LargeLoopsRule
} from './typescript/performance-rules';

/**
 * Initialize all rules
 * Registers all rule implementations with the rule engine
 */
export function initializeRules(): void {
  const ruleEngine = getRuleEngine();
  
  // Register GlideScript rules
  ruleEngine.registerRule(new NestedQueryRule());
  ruleEngine.registerRule(new QueryWithoutConditionsRule());
  ruleEngine.registerRule(new DeprecatedGlideAjaxRule());
  ruleEngine.registerRule(new LogInsteadOfErrorRule());
  ruleEngine.registerRule(new HardcodedValuesRule());
  
  // Register TypeScript rules
  ruleEngine.registerRule(new NoAnyTypeRule());
  ruleEngine.registerRule(new MissingTypeDefinitionsRule());
  ruleEngine.registerRule(new UnusedImportsRule());
  ruleEngine.registerRule(new LargeLoopsRule());
  
  console.log(`Initialized ${ruleEngine.getRules().length} rules`);
}
