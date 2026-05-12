import { registerAs } from '@nestjs/config';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { DatabaseConfig } from './database-config.type';

/**
 * Env-var validator — populated by `class-transformer` from
 * `process.env`. Definite-assignment per the hexagonal data-class rule
 * in CLAUDE.md.
 */
class EnvironmentVariablesValidator {
  @IsString()
  DATABASE_TYPE!: string;

  @IsString()
  DATABASE_HOST!: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  DATABASE_PORT!: number;

  @IsString()
  DATABASE_USERNAME!: string;

  @IsString()
  DATABASE_PASSWORD!: string;

  @IsString()
  DATABASE_NAME!: string;

  @IsBoolean()
  @IsOptional()
  DATABASE_SYNCHRONIZE!: boolean;

  @IsInt()
  @IsOptional()
  DATABASE_MAX_CONNECTIONS!: number;

  @IsBoolean()
  @IsOptional()
  DATABASE_SSL_ENABLED!: boolean;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    type: process.env.DATABASE_TYPE ?? 'postgres',
    host: process.env.DATABASE_HOST!,
    port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
    username: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
    name: process.env.DATABASE_NAME!,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    maxConnections: process.env.DATABASE_MAX_CONNECTIONS
      ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
      : 20,
    sslEnabled: process.env.DATABASE_SSL_ENABLED === 'true',
  };
});
