import { Module } from '@nestjs/common';
import { SocialAccountsPersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [SocialAccountsPersistenceModule],
  exports: [SocialAccountsPersistenceModule],
})
export class SocialAccountsModule {}
