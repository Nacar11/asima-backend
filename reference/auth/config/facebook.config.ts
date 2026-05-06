import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { FacebookConfig } from './facebook-config.type';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsString()
  FACEBOOK_APP_ID: string;

  @IsOptional()
  @IsString()
  FACEBOOK_APP_SECRET: string;

  @IsOptional()
  @IsString()
  FACEBOOK_CALLBACK_URL: string;
}

export default registerAs<FacebookConfig>('facebook', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
  };
});
