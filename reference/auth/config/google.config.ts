import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { GoogleConfig } from './google-config.type';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsOptional()
  @IsString()
  GOOGLE_CALLBACK_URL: string;
}

export default registerAs<GoogleConfig>('google', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  };
});
