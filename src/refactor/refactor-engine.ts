/**
 * Refactoring engine implementation
 * Generates code improvement suggestions based on rule violations
 */

import { RuleViolation } from '../rules';
import { ParseResult } from '../parser';
import {
  RefactoringProvider,
  RefactoringContext,
  RefactoringSuggestion,
  RefactoringResult,
  AppliedRefactoring,
  CodeTransformation,
} from './models';

/**
 * Refactoring engine configuration
 */
export interface RefactoringEngineConfig {
  maxSuggestionsPerViolation: number;
  enableAutoFix: boolean;
  minConfidenceForAutoFix: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RefactoringEngineConfig = {
  maxSuggestionsPerViolation: 3,
  enableAutoFix: false,
  minConfidenceForAutoFix: 80,
};

/**
 * Refactoring engine class
 * Manages refactoring providers and generates suggestions
 */
export class RefactoringEngine {
  private providers: Map<string, RefactoringProvider>;
  private config: RefactoringEngineConfig;

  constructor(config?: Partial<RefactoringEngineConfig>) {
    this.providers = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a refactoring provider
   * @param provider - Refactoring provider to register
   */
  registerProvider(provider: RefactoringProvider): void {
    this.providers.set(provider.ruleId, provider);
  }

  /**
   * Unregister a refactoring provider
   * @param ruleId - Rule ID of provider to unregister
   */
  unregisterProvider(ruleId: string): void {
    this.providers.delete(ruleId);
  }

  /**
   * Get all registered providers
   * @returns Array of providers
   */
  getProviders(): RefactoringProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider for a specific rule
   * @param ruleId - Rule ID
   * @returns Provider or undefined
   */
  getProvider(ruleId: string): RefactoringProvider | undefined {
    return this.providers.get(ruleId);
  }

  /**
   * Generate refactoring suggestions for violations
   * @param parseResult - Parsed code
   * @param violations - Rule violations
   * @param fileName - File name
   * @returns Refactoring result with suggestions
   */
  async generateSuggestions(
    parseResult: ParseResult,
    violations: RuleViolation[],
    fileName: string
  ): Promise<RefactoringResult> {
    const startTime = Date.now();
    const allSuggestions: RefactoringSuggestion[] = [];

    for (const violation of violations) {
      const provider = this.providers.get(violation.ruleId);
      
      if (provider && provider.canRefactor(violation)) {
        try {
          const context: RefactoringContext = {
            parseResult,
            violation,
            fileName,
            sourceCode: parseResult.sourceCode,
          };

          const suggestions = await provider.generateSuggestions(context);
          
          // Limit suggestions per violation
          const limitedSuggestions = suggestions.slice(
            0,
            this.config.maxSuggestionsPerViolation
          );
          
          allSuggestions.push(...limitedSuggestions);
        } catch (error) {
          console.error(`Error generating suggestions for ${violation.ruleId}:`, error);
        }
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      fileName,
      language: parseResult.language,
      totalSuggestions: allSuggestions.length,
      suggestions: allSuggestions,
      executionTime,
    };
  }

  /**
   * Apply a refactoring suggestion to code
   * @param suggestion - Refactoring suggestion to apply
   * @param sourceCode - Original source code
   * @param fileName - File name
   * @returns Applied refactoring result
   */
  async applyRefactoring(
    suggestion: RefactoringSuggestion,
    sourceCode: string,
    fileName: string
  ): Promise<AppliedRefactoring> {
    try {
      let refactoredCode = sourceCode;
      const lines = sourceCode.split('\n');

      // Apply transformations in reverse order to maintain line numbers
      const sortedTransformations = [...suggestion.transformations].sort(
        (a, b) => b.startLine - a.startLine
      );

      for (const transformation of sortedTransformations) {
        refactoredCode = this.applyTransformation(refactoredCode, transformation);
      }

      return {
        suggestionId: suggestion.id,
        fileName,
        appliedAt: new Date(),
        originalCode: sourceCode,
        refactoredCode,
        success: true,
      };
    } catch (error) {
      return {
        suggestionId: suggestion.id,
        fileName,
        appliedAt: new Date(),
        originalCode: sourceCode,
        refactoredCode: sourceCode,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apply a single transformation to code
   */
  private applyTransformation(
    code: string,
    transformation: CodeTransformation
  ): string {
    const lines = code.split('\n');
    
    // Simple line-based replacement
    if (transformation.startLine === transformation.endLine) {
      const line = lines[transformation.startLine - 1];
      const before = line.substring(0, transformation.startColumn);
      const after = line.substring(transformation.endColumn);
      lines[transformation.startLine - 1] = before + transformation.newCode + after;
    } else {
      // Multi-line transformation
      const firstLine = lines[transformation.startLine - 1];
      const lastLine = lines[transformation.endLine - 1];
      
      const before = firstLine.substring(0, transformation.startColumn);
      const after = lastLine.substring(transformation.endColumn);
      
      // Remove lines in between
      lines.splice(
        transformation.startLine - 1,
        transformation.endLine - transformation.startLine + 1,
        before + transformation.newCode + after
      );
    }

    return lines.join('\n');
  }

  /**
   * Get auto-fixable suggestions
   * @param suggestions - All suggestions
   * @returns Suggestions that can be auto-fixed
   */
  getAutoFixableSuggestions(suggestions: RefactoringSuggestion[]): RefactoringSuggestion[] {
    if (!this.config.enableAutoFix) {
      return [];
    }

    return suggestions.filter(
      (s) => s.confidenceScore >= this.config.minConfidenceForAutoFix
    );
  }

  /**
   * Get statistics
   * @returns Engine statistics
   */
  getStats(): {
    totalProviders: number;
    providersByRule: Record<string, string>;
  } {
    const providersByRule: Record<string, string> = {};
    
    this.providers.forEach((provider, ruleId) => {
      providersByRule[ruleId] = provider.constructor.name;
    });

    return {
      totalProviders: this.providers.size,
      providersByRule,
    };
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  getConfig(): RefactoringEngineConfig {
    return { ...this.config };
  }
}

// Singleton instance
let engineInstance: RefactoringEngine | null = null;

/**
 * Get the singleton refactoring engine instance
 * @param config - Optional configuration
 * @returns The refactoring engine instance
 */
export function getRefactoringEngine(
  config?: Partial<RefactoringEngineConfig>
): RefactoringEngine {
  if (!engineInstance) {
    engineInstance = new RefactoringEngine(config);
  }
  return engineInstance;
}

/**
 * Reset the refactoring engine instance (useful for testing)
 */
export function resetRefactoringEngine(): void {
  engineInstance = null;
}
