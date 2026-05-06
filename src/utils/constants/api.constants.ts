/**
 * API version used by every controller's `@Controller({ version: API_VERSION })`.
 *
 * When v2 ships, split this into per-version constants (API_VERSION_V1, API_VERSION_V2)
 * and have each controller hardcode the version it belongs to.
 */
export const API_VERSION = '1';

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;
