import { registerAs } from '@nestjs/config';
import { IsString, Matches } from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { AuthConfig } from './auth-config.type';

/**
 * Expiry strings must be parseable by `parseExpiresIn` in auth.service.ts —
 * digits + optional s/m/h/d unit. The JWT library accepts more formats
 * ("1w", "7 days"), but those would produce refresh-ledger rows whose
 * `expires_at` disagrees with the token's `exp` (ADR 0002), so we fail at
 * boot instead of silently 401-ing every refresh.
 */
const EXPIRES_IN_FORMAT = /^\d+\s*[smhd]?$/;
const EXPIRES_IN_MESSAGE = 'must be digits with an optional s/m/h/d unit (e.g. "15m", "7d", "900")';

/**
 * Env-var validator — populated by `class-transformer` from
 * `process.env`. Definite-assignment per the hexagonal data-class rule
 * in CLAUDE.md.
 */
class EnvironmentVariablesValidator {
  @IsString()
  AUTH_JWT_SECRET!: string;

  @IsString()
  @Matches(EXPIRES_IN_FORMAT, { message: `AUTH_JWT_TOKEN_EXPIRES_IN ${EXPIRES_IN_MESSAGE}` })
  AUTH_JWT_TOKEN_EXPIRES_IN!: string;

  @IsString()
  AUTH_REFRESH_SECRET!: string;

  @IsString()
  @Matches(EXPIRES_IN_FORMAT, { message: `AUTH_REFRESH_TOKEN_EXPIRES_IN ${EXPIRES_IN_MESSAGE}` })
  AUTH_REFRESH_TOKEN_EXPIRES_IN!: string;
}

export default registerAs<AuthConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    secret: process.env.AUTH_JWT_SECRET!,
    expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN!,
    refreshSecret: process.env.AUTH_REFRESH_SECRET!,
    refreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN!,
  };
});
