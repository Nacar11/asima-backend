/**
 * Builds a Socket.io-compatible origin checker from a comma-separated
 * CORS_ALLOWED_ORIGINS string (falls back to FRONTEND_DOMAIN).
 *
 * Each entry can be:
 *   - An exact origin:   "https://app.adtokart.com"
 *   - A wildcard entry:  "*.adtokart.com"  → allows any subdomain
 *
 * Examples:
 *   CORS_ALLOWED_ORIGINS=*.adtokart.com
 *   CORS_ALLOWED_ORIGINS=*.adtokart.com,http://localhost:3000
 *   CORS_ALLOWED_ORIGINS=https://app.adtokart.com,https://admin.adtokart.com
 */
export function buildWsOriginChecker(
  frontendDomain: string | undefined,
): (origin: string, callback: (err: Error | null, allow?: boolean) => void) => void {
  const entries = frontendDomain
    ? frontendDomain.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const exactOrigins = new Set<string>();
  const wildcardPatterns: RegExp[] = [];

  for (const entry of entries) {
    if (entry.startsWith('*.')) {
      // *.adtokart.com → matches https://app.adtokart.com, http://admin.adtokart.com
      const escaped = entry.slice(2).replace(/\./g, '\\.');
      wildcardPatterns.push(new RegExp(`^https?:\\/\\/[^.]+\\.${escaped}$`));
    } else {
      exactOrigins.add(entry);
    }
  }

  return (origin, callback) => {
    if (!origin) {
      // Server-to-server (no Origin header) — allow
      callback(null, true);
      return;
    }
    if (exactOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    if (wildcardPatterns.some((re) => re.test(origin))) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  };
}
