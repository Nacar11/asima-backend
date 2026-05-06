/**
 * Currency formatting utilities for Philippine Peso
 */

/**
 * Format currency with proper comma separators and ₱ symbol
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₱2,000.00")
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format currency without the ₱ symbol (for use when prefix is added separately)
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "2,000.00")
 */
export function formatCurrencyWithoutSymbol(amount: number): string {
  return amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
