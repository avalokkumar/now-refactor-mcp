/**
 * Confidence scoring implementation
 * Calculates confidence scores for refactoring suggestions
 */

import { RefactoringSuggestion, ConfidenceLevel, CodeTransformation } from './models';
import { RuleViolation } from '../rules';

/**
 * Confidence scoring factors
 */
export interface ConfidenceFactors {
  syntaxComplexity: number;      // 0-100: Lower is simpler
  transformationCount: number;   // Number of transformations
  codeImpact: number;           // 0-100: Lines changed
  breakingChange: boolean;
  hasTests: boolean;
  ruleConfidence: number;       // 0-100: Rule's inherent confidence
}

/**
 * Confidence scorer class
 * Calculates confidence scores for refactoring suggestions
 */
export class ConfidenceScorer {
  /**
   * Calculate confidence score for a refactoring suggestion
   * @param suggestion - Refactoring suggestion
   * @param violation - Original rule violation
   * @returns Updated suggestion with confidence score
   */
  calculateConfidence(
    suggestion: RefactoringSuggestion,
    violation: RuleViolation
  ): RefactoringSuggestion {
    const factors = this.extractFactors(suggestion, violation);
    const score = this.computeScore(factors);
    const level = this.determineLevel(score);

    return {
      ...suggestion,
      confidenceScore: score,
      confidence: level,
      reasoning: this.generateReasoning(factors, score),
    };
  }

  /**
   * Extract confidence factors from suggestion
   */
  private extractFactors(
    suggestion: RefactoringSuggestion,
    violation: RuleViolation
  ): ConfidenceFactors {
    return {
      syntaxComplexity: this.calculateSyntaxComplexity(suggestion),
      transformationCount: suggestion.transformations.length,
      codeImpact: suggestion.impact.linesChanged,
      breakingChange: suggestion.impact.breakingChange,
      hasTests: suggestion.impact.testingRequired,
      ruleConfidence: this.getRuleConfidence(violation.ruleId),
    };
  }

  /**
   * Calculate syntax complexity score
   */
  private calculateSyntaxComplexity(suggestion: RefactoringSuggestion): number {
    let complexity = 0;

    suggestion.transformations.forEach((t) => {
      // Simple transformations are less complex
      if (t.type === 'replace' && t.startLine === t.endLine) {
        complexity += 10;
      } else if (t.type === 'insert' || t.type === 'delete') {
        complexity += 20;
      } else {
        complexity += 40;
      }
    });

    return Math.min(complexity, 100);
  }

  /**
   * Get rule-specific confidence
   */
  private getRuleConfidence(ruleId: string): number {
    // Rule-specific confidence levels
    const ruleConfidences: Record<string, number> = {
      'glide-deprecated-ajax': 90,
      'glide-log-for-errors': 95,
      'ts-no-any': 85,
      'ts-unused-imports': 90,
      'glide-nested-query': 70,
      'glide-query-no-conditions': 50,
      'ts-missing-types': 60,
      'glide-hardcoded-values': 70,
      'ts-large-loops': 75,
    };

    return ruleConfidences[ruleId] || 50;
  }

  /**
   * Compute overall confidence score
   */
  private computeScore(factors: ConfidenceFactors): number {
    let score = factors.ruleConfidence;

    // Adjust for syntax complexity (lower is better)
    score -= factors.syntaxComplexity * 0.2;

    // Adjust for transformation count
    if (factors.transformationCount === 1) {
      score += 10;
    } else if (factors.transformationCount > 3) {
      score -= 15;
    }

    // Adjust for code impact
    if (factors.codeImpact <= 3) {
      score += 10;
    } else if (factors.codeImpact > 10) {
      score -= 10;
    }

    // Breaking changes reduce confidence
    if (factors.breakingChange) {
      score -= 20;
    }

    // Testing requirement slightly reduces confidence
    if (factors.hasTests) {
      score -= 5;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine confidence level from score
   */
  private determineLevel(score: number): ConfidenceLevel {
    if (score >= 80) {
      return ConfidenceLevel.HIGH;
    } else if (score >= 50) {
      return ConfidenceLevel.MEDIUM;
    } else {
      return ConfidenceLevel.LOW;
    }
  }

  /**
   * Generate reasoning text
   */
  private generateReasoning(factors: ConfidenceFactors, score: number): string {
    const reasons: string[] = [];

    if (factors.syntaxComplexity < 30) {
      reasons.push('Simple syntax transformation');
    } else if (factors.syntaxComplexity > 60) {
      reasons.push('Complex syntax transformation');
    }

    if (factors.transformationCount === 1) {
      reasons.push('Single transformation');
    } else if (factors.transformationCount > 3) {
      reasons.push('Multiple transformations required');
    }

    if (factors.codeImpact <= 3) {
      reasons.push('Minimal code impact');
    } else if (factors.codeImpact > 10) {
      reasons.push('Significant code changes');
    }

    if (factors.breakingChange) {
      reasons.push('Potential breaking change');
    }

    if (factors.hasTests) {
      reasons.push('Testing recommended');
    }

    if (score >= 80) {
      reasons.push('High confidence - safe to apply');
    } else if (score >= 50) {
      reasons.push('Medium confidence - review recommended');
    } else {
      reasons.push('Low confidence - manual review required');
    }

    return reasons.join('; ');
  }

  /**
   * Batch calculate confidence for multiple suggestions
   */
  batchCalculate(
    suggestions: RefactoringSuggestion[],
    violations: RuleViolation[]
  ): RefactoringSuggestion[] {
    return suggestions.map((suggestion) => {
      const violation = violations.find((v) => v.ruleId === suggestion.ruleId);
      if (violation) {
        return this.calculateConfidence(suggestion, violation);
      }
      return suggestion;
    });
  }
}

// Singleton instance
let scorerInstance: ConfidenceScorer | null = null;

/**
 * Get the singleton confidence scorer instance
 * @returns The confidence scorer instance
 */
export function getConfidenceScorer(): ConfidenceScorer {
  if (!scorerInstance) {
    scorerInstance = new ConfidenceScorer();
  }
  return scorerInstance;
}

/**
 * Reset the confidence scorer instance (useful for testing)
 */
export function resetConfidenceScorer(): void {
  scorerInstance = null;
}
