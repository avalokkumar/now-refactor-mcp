/**
 * Refactoring initializer
 * Registers all refactoring providers with the refactoring engine
 */

import { getRefactoringEngine } from './refactor-engine';
import { 
  NestedQueryRefactoringProvider, 
  QueryConditionsRefactoringProvider 
} from './glide-script/query-refactors';
import {
  DeprecatedGlideAjaxRefactoringProvider,
  LogToErrorRefactoringProvider
} from './glide-script/api-refactors';
import {
  HardcodedValuesRefactoringProvider
} from './glide-script/performance-refactors';
import {
  NoAnyRefactoringProvider,
  MissingTypeRefactoringProvider
} from './typescript/type-refactors';
import {
  UnusedImportsRefactoringProvider
} from './typescript/module-refactors';
import {
  LargeLoopsRefactoringProvider
} from './typescript/performance-refactors';

/**
 * Initialize all refactoring providers
 * Registers all refactoring provider implementations with the refactoring engine
 */
export function initializeRefactoringProviders(): void {
  const refactoringEngine = getRefactoringEngine();
  
  // Register GlideScript refactoring providers
  refactoringEngine.registerProvider(new NestedQueryRefactoringProvider());
  refactoringEngine.registerProvider(new QueryConditionsRefactoringProvider());
  
  // These will be implemented as needed
  // refactoringEngine.registerProvider(new DeprecatedGlideAjaxRefactoringProvider());
  // refactoringEngine.registerProvider(new LogToErrorRefactoringProvider());
  // refactoringEngine.registerProvider(new HardcodedValuesRefactoringProvider());
  
  // Register TypeScript refactoring providers
  // refactoringEngine.registerProvider(new NoAnyRefactoringProvider());
  // refactoringEngine.registerProvider(new MissingTypeRefactoringProvider());
  // refactoringEngine.registerProvider(new UnusedImportsRefactoringProvider());
  // refactoringEngine.registerProvider(new LargeLoopsRefactoringProvider());
  
  console.log(`Initialized ${refactoringEngine.getProviders().length} refactoring providers`);
}
