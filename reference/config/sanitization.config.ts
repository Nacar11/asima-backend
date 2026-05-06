/**
 * Configuration for the SanitizationPipe.
 * Allows specifying rules per field.
 */

import { SanitizationRuleSet } from '@/utils/helpers/sanitization.helper';

export type FieldSanitizationConfig = {
  [field: string]: SanitizationRuleSet;
};

export interface SanitizationConfig {
  /**
   * Per-field rules. Use "*" for defaults.
   */
  fields?: FieldSanitizationConfig;
  /**
   * Apply to nested objects and arrays.
   */
  deep?: boolean;
}

export const defaultSanitizationConfig: SanitizationConfig = {
  fields: {
    '*': {
      stripHtml: true,
      normalizeLineEndings: true,
      stripEmojis: false,
      allowNonLatin: true,
    },
    email: {
      type: 'email',
      stripHtml: true,
    },
    firstName: {
      fieldCase: 'titlecase',
      stripHtml: true,
    },
    lastName: {
      fieldCase: 'titlecase',
      stripHtml: true,
    },
    username: {
      stripEmojis: true,
      allowNonLatin: false,
      stripHtml: true,
    },
    slug: {
      allowNonLatin: false,
      stripHtml: true,
    },
    description: {
      stripEmojis: false,
      stripHtml: true,
      normalizeLineEndings: true,
    },
  },
  deep: true,
};
