import { registerAs } from '@nestjs/config';

import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MAIL_PORT: number;

  @IsString()
  MAIL_HOST: string;

  @IsString()
  @IsOptional()
  MAIL_USER: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD: string;

  @IsString()
  @IsOptional()
  MAIL_LOGO_URL: string;

  @IsEmail()
  MAIL_DEFAULT_EMAIL: string;

  @IsString()
  MAIL_DEFAULT_NAME: string;

  @IsBoolean()
  @IsOptional()
  MAIL_IGNORE_TLS: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_SECURE: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_REQUIRE_TLS: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_REJECT_UNAUTHORIZED: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  MAIL_CONNECTION_TIMEOUT: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  MAIL_GREETING_TIMEOUT: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  MAIL_SOCKET_TIMEOUT: number;

  @IsBoolean()
  @IsOptional()
  MAIL_POOL: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  MAIL_MAX_CONNECTIONS: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  MAIL_MAX_MESSAGES: number;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const ignoreTLS = process.env.MAIL_IGNORE_TLS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // Warn about insecure TLS settings in production
  if (isProduction && ignoreTLS) {
    console.warn(
      '[Mail Config] WARNING: MAIL_IGNORE_TLS=true in production disables TLS entirely. ' +
        'This is insecure and should only be used if your SMTP server is on a trusted internal network.',
    );
  }

  return {
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
    host: process.env.MAIL_HOST,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    logoUrl: process.env.MAIL_LOGO_URL?.trim() || undefined,
    defaultEmail: process.env.MAIL_DEFAULT_EMAIL,
    defaultName: process.env.MAIL_DEFAULT_NAME,
    ignoreTLS,
    secure: process.env.MAIL_SECURE === 'true',
    requireTLS: process.env.MAIL_REQUIRE_TLS === 'true',
    rejectUnauthorized: process.env.MAIL_REJECT_UNAUTHORIZED
      ? process.env.MAIL_REJECT_UNAUTHORIZED === 'true'
      : isProduction,
    // Timeout defaults (in milliseconds)
    connectionTimeout: process.env.MAIL_CONNECTION_TIMEOUT
      ? parseInt(process.env.MAIL_CONNECTION_TIMEOUT, 10)
      : 60000,
    greetingTimeout: process.env.MAIL_GREETING_TIMEOUT
      ? parseInt(process.env.MAIL_GREETING_TIMEOUT, 10)
      : 30000,
    socketTimeout: process.env.MAIL_SOCKET_TIMEOUT
      ? parseInt(process.env.MAIL_SOCKET_TIMEOUT, 10)
      : 60000,
    // Pooling defaults
    pool: process.env.MAIL_POOL === 'true',
    maxConnections: process.env.MAIL_MAX_CONNECTIONS
      ? parseInt(process.env.MAIL_MAX_CONNECTIONS, 10)
      : 5,
    maxMessages: process.env.MAIL_MAX_MESSAGES
      ? parseInt(process.env.MAIL_MAX_MESSAGES, 10)
      : 100,
  };
});
