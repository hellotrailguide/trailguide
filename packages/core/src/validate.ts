import type { Trail } from './types';
import { findElement, isElementVisible } from './dom';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  stepId: string;
  stepIndex: number;
  type: 'missing_target' | 'invalid_selector' | 'missing_required_field';
  message: string;
  selector?: string;
}

export interface ValidationWarning {
  stepId: string;
  stepIndex: number;
  type: 'hidden_target' | 'unstable_selector';
  message: string;
  selector?: string;
}

/**
 * Validates a trail and checks if all target selectors exist in the DOM.
 * Run this in development to catch broken selectors before they reach users.
 *
 * @example
 * ```ts
 * import { validateTrail } from '@trailguide/core';
 *
 * const result = validateTrail(myTrail);
 * if (!result.valid) {
 *   console.error('Trail validation failed:', result.errors);
 * }
 * ```
 */
export function validateTrail(trail: Trail): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!trail.id) {
    errors.push({
      stepId: '',
      stepIndex: -1,
      type: 'missing_required_field',
      message: 'Trail is missing required "id" field',
    });
  }

  if (!trail.steps || trail.steps.length === 0) {
    errors.push({
      stepId: '',
      stepIndex: -1,
      type: 'missing_required_field',
      message: 'Trail has no steps',
    });
    return { valid: false, errors, warnings };
  }

  trail.steps.forEach((step, index) => {
    // Check required fields
    if (!step.id) {
      errors.push({
        stepId: `step-${index}`,
        stepIndex: index,
        type: 'missing_required_field',
        message: `Step ${index + 1} is missing required "id" field`,
      });
    }

    if (!step.target) {
      errors.push({
        stepId: step.id || `step-${index}`,
        stepIndex: index,
        type: 'missing_required_field',
        message: `Step ${index + 1} is missing required "target" field`,
      });
      return;
    }

    // Check if selector is valid and element exists
    const element = findElement(step.target);

    if (!element) {
      errors.push({
        stepId: step.id,
        stepIndex: index,
        type: 'missing_target',
        message: `Step ${index + 1} ("${step.title}"): Target element not found`,
        selector: step.target,
      });
    } else if (!isElementVisible(element)) {
      warnings.push({
        stepId: step.id,
        stepIndex: index,
        type: 'hidden_target',
        message: `Step ${index + 1} ("${step.title}"): Target element exists but is hidden`,
        selector: step.target,
      });
    }

    // Warn about potentially unstable selectors
    if (step.target && isUnstableSelector(step.target)) {
      warnings.push({
        stepId: step.id,
        stepIndex: index,
        type: 'unstable_selector',
        message: `Step ${index + 1}: Consider using data-trail-id for more stable targeting`,
        selector: step.target,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a selector might be unstable (e.g., relies on class names or nth-child)
 */
function isUnstableSelector(selector: string): boolean {
  // Stable patterns: IDs, data attributes
  if (selector.startsWith('#')) return false;
  if (selector.includes('[data-')) return false;

  // Unstable patterns
  if (selector.includes(':nth-child')) return true;
  if (selector.includes(':nth-of-type')) return true;
  if (/^\.[a-z]+-[a-z0-9]+$/i.test(selector)) return true; // CSS module-like classes

  return false;
}

/**
 * Logs validation results to the console with formatting.
 * Useful for development debugging.
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.valid && result.warnings.length === 0) {
    console.log('%c✓ Trail validation passed', 'color: green; font-weight: bold');
    return;
  }

  if (result.errors.length > 0) {
    console.group('%c✗ Trail validation errors', 'color: red; font-weight: bold');
    result.errors.forEach(error => {
      console.error(`Step ${error.stepIndex + 1}: ${error.message}`);
      if (error.selector) {
        console.error(`  Selector: ${error.selector}`);
      }
    });
    console.groupEnd();
  }

  if (result.warnings.length > 0) {
    console.group('%c⚠ Trail validation warnings', 'color: orange; font-weight: bold');
    result.warnings.forEach(warning => {
      console.warn(`Step ${warning.stepIndex + 1}: ${warning.message}`);
      if (warning.selector) {
        console.warn(`  Selector: ${warning.selector}`);
      }
    });
    console.groupEnd();
  }
}
