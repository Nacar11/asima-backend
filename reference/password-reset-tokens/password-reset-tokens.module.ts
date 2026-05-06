import { Module } from '@nestjs/common';
import { PasswordResetTokensPersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [PasswordResetTokensPersistenceModule],
  exports: [PasswordResetTokensPersistenceModule],
})
export class PasswordResetTokensModule {}
