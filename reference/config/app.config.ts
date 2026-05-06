import { registerAs } from '@nestjs/config';
import { AppConfig } from './app-config.type';
import validateConfig from '@/utils/validate-config';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { PayoutProviderEnum } from '@/payouts/enums/payout-provider.enum';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT: number;

  @IsOptional()
  FRONTEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  CORS_ALLOWED_ORIGINS: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE: string;

  // Payout/disbursement provider — independent of the collection payment gateway.
  // Falls back to PayoutProviderEnum.DRAGONPAY in PayoutsModule if not set.
  @IsEnum(PayoutProviderEnum)
  @IsOptional()
  PAYOUT_PROVIDER: PayoutProviderEnum;

  @IsEmail()
  @IsOptional()
  ADMIN_EMAIL: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    frontendDomain: process.env.FRONTEND_DOMAIN,
    corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS,
    backendDomain: process.env.BACKEND_DOMAIN ?? 'http://localhost',
    port: process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
    queryLogging: process.env.QUERY_LOGGING === 'true' || false,
    adminEmail: process.env.ADMIN_EMAIL || 'admin@adtokart.com',
  };
});
