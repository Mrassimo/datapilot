/**
 * Shared validation patterns used across the DataPilot codebase
 * Centralized to ensure consistency and maintainability
 */

/**
 * Comprehensive email validation pattern
 * Supports most standard email formats including:
 * - Local parts with alphanumeric, dots, underscores, percent, plus, and hyphens
 * - Domain parts with alphanumeric characters, dots, and hyphens
 * - TLD with at least 2 alphabetic characters
 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Simple email validation pattern (legacy)
 * Less comprehensive but faster for basic validation
 * @deprecated Use EMAIL_PATTERN instead for better coverage
 */
export const EMAIL_PATTERN_SIMPLE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation pattern
 * Matches http, https, and ftp protocols
 */
export const URL_PATTERN = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

/**
 * Phone number pattern (international format)
 * Supports various international phone number formats
 */
export const PHONE_PATTERN = /^(\+\d{1,3}[- ]?)?\d{1,14}$/;

/**
 * Credit card number pattern (basic format check)
 * Validates basic structure, not actual card validity
 */
export const CREDIT_CARD_PATTERN = /^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/;