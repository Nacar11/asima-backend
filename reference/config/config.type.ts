import { AppConfig } from './app-config.type';
import { AuthConfig } from '@/auth/config/auth-config.type';
import { DatabaseConfig } from '@/database/config/database-config.type';
import { MailConfig } from '@/mail/config/mail-config.type';
import { FacebookConfig } from '@/auth/config/facebook-config.type';
import { GoogleConfig } from '@/auth/config/google-config.type';
import { UploadConfig } from './upload.config';
import { StorageConfig } from '@/storage/storage-config.type';

export type FirebaseConfig = {
  projectId?: string;
  privateKey?: string;
  clientEmail?: string;
};

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  mail: MailConfig;
  facebook: FacebookConfig;
  google: GoogleConfig;
  firebase: FirebaseConfig;
  upload: UploadConfig;
  storage: StorageConfig;
};
