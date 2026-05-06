/**
 * Utility functions for data sanitization.
 */

import sanitizeHtml from 'sanitize-html';

export type SanitizationRuleSet = {
  stripEmojis?: boolean;
  allowNonLatin?: boolean;
  allowEmojis?: boolean;
  stripHtml?: boolean;
  normalizeLineEndings?: boolean;
  fieldCase?: 'lowercase' | 'titlecase' | 'none';
  type?: 'string' | 'number' | 'date' | 'email';
};

// More compatible emoji regex that works across different environments
const emojiRegex =
  /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

// ASCII printable: 0x20-0x7E, newline (0x0A), carriage return (0x0D)
const nonAsciiControlRegex = /[^\x20-\x7E\n\r]/g;
const multipleSpacesRegex = /[ ]{2,}/g;

// More compatible non-Latin regex using character ranges
const nonLatinRegex = /[^\u0000-\u024F\u1E00-\u1EFF\d\s\-_]/g;

const lineEndingRegex = /\r\n|\r/g;

export function trimAndNormalizeWhitespace(str: string): string {
  return str.trim().replace(multipleSpacesRegex, ' ');
}

export function toTitleCase(str: string): string {
  return str.replace(
    /\b\w+/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

export function normalizeEmail(str: string): string {
  return str.trim().toLowerCase();
}

export function standardizeDate(date: string | Date): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

export function stripEmojis(str: string): string {
  return str.replace(emojiRegex, '');
}

export function stripNonAsciiControl(str: string): string {
  return str.replace(nonAsciiControlRegex, '');
}

export function restrictNonLatin(str: string): string {
  return str.replace(nonLatinRegex, '');
}

export function normalizeLineEndings(str: string): string {
  return str.replace(lineEndingRegex, '\n');
}

export function stripHtmlTags(str: string): string {
  // Use sanitize-html to strip tags safely
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });
}

export function applySanitizationRules(
  value: any,
  rules: SanitizationRuleSet = {},
): any {
  if (typeof value !== 'string') return value;

  let sanitized = value;

  if (rules.stripHtml) {
    sanitized = stripHtmlTags(sanitized);
  }

  if (rules.normalizeLineEndings) {
    sanitized = normalizeLineEndings(sanitized);
  }
  sanitized = trimAndNormalizeWhitespace(sanitized);

  if (rules.type === 'email') {
    sanitized = normalizeEmail(sanitized);
  } else if (rules.fieldCase === 'titlecase') {
    sanitized = toTitleCase(sanitized);
  }

  if (rules.stripEmojis) {
    sanitized = stripEmojis(sanitized);
  } else if (rules.allowEmojis === false) {
    sanitized = stripEmojis(sanitized);
  }

  if (rules.allowNonLatin === false) {
    sanitized = restrictNonLatin(sanitized);
  }

  // Only strip non-ASCII control characters if emojis are not explicitly allowed
  if (rules.stripEmojis !== false) {
    sanitized = stripNonAsciiControl(sanitized);
  }

  return sanitized;
}
