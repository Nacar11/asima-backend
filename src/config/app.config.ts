import { registerAs } from '@nestjs/config';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { AppConfig } from './app-config.type';

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

  @IsString()
  @IsOptional()
  APP_NAME: string;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  @IsOptional()
  FRONTEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  CORS_ALLOWED_ORIGINS: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    name: process.env.APP_NAME ?? 'asima',
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000,
    apiPrefix: process.env.API_PREFIX ?? 'api',
    frontendDomain: process.env.FRONTEND_DOMAIN,
    corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS,
  };
});
